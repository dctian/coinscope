import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../models/coin.dart';

/// Service for communicating with the CoinScope backend API.
class ApiService {
  // Default to localhost for development
  // Change this to your production URL when deploying
  static const String _defaultBaseUrl = 'http://localhost:8000';
  
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
    
    // Add image file
    request.files.add(
      http.MultipartFile.fromBytes(
        'image',
        imageBytes,
        filename: filename,
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
}

/// Exception thrown when API requests fail.
class ApiException implements Exception {
  final String message;
  final int statusCode;

  const ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException: $message (status: $statusCode)';
}

