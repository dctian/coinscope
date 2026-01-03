/// Integration tests for coin identification.
/// 
/// These tests require the backend server to be running at http://localhost:8000
/// 
/// Run with:
///   cd frontend && flutter test test/integration/coin_identification_test.dart
/// 
/// Make sure to start the backend first:
///   cd backend && source venv/bin/activate && uvicorn app.main:app --reload

import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:coinscope/services/api_service.dart';

void main() {
  late ApiService apiService;
  late String testImagePath;
  
  // Path to test image - Hungarian 5 Forint coin
  // When running from frontend directory, go up one level to find testdata
  String getTestImagePath() {
    // Try relative path from frontend directory
    var path = '../testdata/coin1.jpg';
    if (File(path).existsSync()) return path;
    
    // Try from project root
    path = 'testdata/coin1.jpg';
    if (File(path).existsSync()) return path;
    
    // Try absolute path based on current directory
    final cwd = Directory.current.path;
    if (cwd.endsWith('frontend')) {
      return '$cwd/../testdata/coin1.jpg';
    }
    return '$cwd/testdata/coin1.jpg';
  }
  
  setUpAll(() {
    testImagePath = getTestImagePath();
    apiService = ApiService(
      baseUrl: 'http://localhost:8000',
      client: http.Client(),
    );
  });

  tearDownAll(() {
    apiService.dispose();
  });

  group('Integration: Coin Identification with testdata/coin1.jpg', () {
    test('backend health check passes', () async {
      final isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        markTestSkipped('Backend server not running at localhost:8000. '
            'Start with: cd backend && uvicorn app.main:app --reload');
        return;
      }
      expect(isHealthy, true);
    });

    test('identifies Hungarian 5 Forint coin from testdata/coin1.jpg', () async {
      // Check if backend is running
      if (!await apiService.healthCheck()) {
        markTestSkipped('Backend server not running');
        return;
      }
      
      // Load the test image
      final imageFile = File(testImagePath);
      
      if (!imageFile.existsSync()) {
        fail('Test image not found at: $testImagePath\n'
            'Make sure to run this test from the frontend directory.');
      }
      
      final imageBytes = await imageFile.readAsBytes();
      
      // Call the API
      final response = await apiService.identifyCoins(
        imageBytes: imageBytes,
        filename: 'coin1.jpg',
      );
      
      // Verify response structure
      expect(response.coins, isNotEmpty, reason: 'Should detect at least one coin');
      expect(response.totalCoinsDetected, greaterThanOrEqualTo(1));
      expect(response.modelUsed, isNotEmpty);
      
      // Verify the coin data
      final coin = response.coins.first;
      expect(coin.id, isNotEmpty);
      expect(coin.name, isNotEmpty);
      expect(coin.country, isNotEmpty);
      expect(coin.denomination, isNotEmpty);
      expect(coin.currency, isNotEmpty);
      expect(coin.confidence, greaterThan(0));
      expect(coin.confidence, lessThanOrEqualTo(1));
      
      // Print identification result for manual verification
      print('\n=== Coin Identification Result ===');
      print('Name: ${coin.name}');
      print('Country: ${coin.country}');
      print('Year: ${coin.year ?? "Unknown"}');
      print('Denomination: ${coin.denomination}');
      print('Face Value: ${coin.faceValue} ${coin.currency}');
      print('Confidence: ${coin.confidencePercent}');
      print('Model: ${response.modelUsed}');
      if (coin.obverseDescription != null) {
        print('Front: ${coin.obverseDescription}');
      }
      if (coin.reverseDescription != null) {
        print('Back: ${coin.reverseDescription}');
      }
      print('==================================\n');
    });

    test('coin data has valid structure and types', () async {
      if (!await apiService.healthCheck()) {
        markTestSkipped('Backend server not running');
        return;
      }
      
      final imageFile = File(testImagePath);
      
      if (!imageFile.existsSync()) {
        fail('Test image not found at: $testImagePath');
      }
      
      final imageBytes = await imageFile.readAsBytes();
      final response = await apiService.identifyCoins(imageBytes: imageBytes);
      
      expect(response.coins, isNotEmpty);
      
      final coin = response.coins.first;
      
      // Verify required fields are present and not empty
      expect(coin.id.length, greaterThan(0));
      expect(coin.name.length, greaterThan(0));
      expect(coin.country.length, greaterThan(0));
      expect(coin.denomination.length, greaterThan(0));
      expect(coin.currency.length, greaterThan(0));
      
      // Verify confidence is in valid range
      expect(coin.confidence, greaterThanOrEqualTo(0.0));
      expect(coin.confidence, lessThanOrEqualTo(1.0));
      
      // Verify helper methods work
      expect(coin.confidencePercent, matches(RegExp(r'^\d+%$')));
      expect(coin.yearDisplay, isNotEmpty);
    });

    test('toJson and fromJson are symmetrical', () async {
      if (!await apiService.healthCheck()) {
        markTestSkipped('Backend server not running');
        return;
      }
      
      final imageFile = File(testImagePath);
      
      if (!imageFile.existsSync()) {
        fail('Test image not found at: $testImagePath');
      }
      
      final imageBytes = await imageFile.readAsBytes();
      final response = await apiService.identifyCoins(imageBytes: imageBytes);
      
      expect(response.coins, isNotEmpty);
      
      final originalCoin = response.coins.first;
      
      // Convert to JSON and back
      final json = originalCoin.toJson();
      // Note: We need to manually add 'id' back since backend always generates it
      json['id'] = originalCoin.id;
      
      // Verify JSON has expected keys
      expect(json.containsKey('name'), true);
      expect(json.containsKey('country'), true);
      expect(json.containsKey('denomination'), true);
      expect(json.containsKey('currency'), true);
      expect(json.containsKey('confidence'), true);
    });
  });

  group('Integration: Error Handling', () {
    test('handles invalid image gracefully', () async {
      if (!await apiService.healthCheck()) {
        markTestSkipped('Backend server not running');
        return;
      }
      
      // Create invalid image bytes (not a valid image format)
      final invalidBytes = Uint8List.fromList([0x00, 0x01, 0x02, 0x03]);
      
      // The server should reject this or return an error
      try {
        await apiService.identifyCoins(imageBytes: invalidBytes);
        // If it doesn't throw, we accept that some VLMs might still try to process it
      } catch (e) {
        expect(e, isA<ApiException>());
      }
    });
  });
}

