import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';


import '../models/coin.dart';

/// Service for communicating with the CoinScope backend API.
class ApiService {
  // Default to a build-time override so mobile/web can point at a VM IP.
  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.0.21:8000',
  );
  
  final String baseUrl;
  final http.Client _client;

  ApiService({
    String? baseUrl,
    http.Client? client,
  })  : baseUrl = baseUrl ?? _defaultBaseUrl,
        _client = client ?? http.Client();

  /// Identify coins in an image.
  /// 
  /// [imageBytes] - The raw bytes of the image to analyze.
  /// [filename] - Optional filename for the upload (defaults to 'image.jpg').
  /// 
  /// Returns a [CoinIdentificationResponse] with identified coins.
  /// Throws an exception if the request fails.
  Future<CoinIdentificationResponse> identifyCoins({
    required Uint8List imageBytes,
    String filename = 'image.jpg',
  }) async {
    final uri = Uri.parse('$baseUrl/api/v1/coins/identify');
    
    // Create multipart request
    final request = http.MultipartRequest('POST', uri);
    
    // Detect image type from bytes
    final contentType = _detectImageType(imageBytes);
    
    // Add image file with content type
    request.files.add(
      http.MultipartFile.fromBytes(
        'image',
        imageBytes,
        filename: filename,
        contentType: contentType,
      ),
    );
    
    // Send request
    final streamedResponse = await _client.send(request);
    final response = await http.Response.fromStream(streamedResponse);
    
    // Handle response
    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return CoinIdentificationResponse.fromJson(json);
    } else {
      // Parse error message from response
      String errorMessage = 'Failed to identify coins';
      try {
        final errorJson = jsonDecode(response.body);
        errorMessage = errorJson['detail'] ?? errorMessage;
      } catch (_) {
        errorMessage = 'Server error: ${response.statusCode}';
      }
      throw ApiException(errorMessage, response.statusCode);
    }
  }

  /// Check if the API is healthy.
  Future<bool> healthCheck() async {
    try {
      final uri = Uri.parse('$baseUrl/api/v1/coins/health');
      final response = await _client.get(uri);
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Dispose of the HTTP client.
  void dispose() {
    _client.close();
  }

  /// Detect image MIME type from bytes using magic numbers.
  MediaType _detectImageType(Uint8List bytes) {
    if (bytes.length < 4) {
      return MediaType('image', 'jpeg'); // Default
    }
    
    // Check magic bytes
    if (bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF) {
      return MediaType('image', 'jpeg');
    }
    if (bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
      return MediaType('image', 'png');
    }
    if (bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46) {
      return MediaType('image', 'gif');
    }
    if (bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
        bytes.length > 11 && bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50) {
      return MediaType('image', 'webp');
    }
    
    // Default to JPEG
    return MediaType('image', 'jpeg');
  }
}

/// Exception thrown when API requests fail.
class ApiException implements Exception {
  final String message;
  final int statusCode;

  const ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException: $message (status: $statusCode)';
}

