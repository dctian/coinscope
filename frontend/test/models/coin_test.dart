import 'package:flutter_test/flutter_test.dart';
import 'package:coinscope/models/coin.dart';

void main() {
  group('Coin', () {
    test('fromJson creates Coin with all fields', () {
      final json = {
        'id': 'test-id-123',
        'name': '5 Forint',
        'country': 'Hungary',
        'year': 2017,
        'denomination': '5 forint',
        'face_value': 5.0,
        'currency': 'HUF',
        'obverse_description': 'Great Egret bird with text MAGYARORSZÁG',
        'reverse_description': 'Large numeral 5 with text FORINT',
        'confidence': 0.99,
      };

      final coin = Coin.fromJson(json);

      expect(coin.id, 'test-id-123');
      expect(coin.name, '5 Forint');
      expect(coin.country, 'Hungary');
      expect(coin.year, 2017);
      expect(coin.denomination, '5 forint');
      expect(coin.faceValue, 5.0);
      expect(coin.currency, 'HUF');
      expect(coin.obverseDescription, 'Great Egret bird with text MAGYARORSZÁG');
      expect(coin.reverseDescription, 'Large numeral 5 with text FORINT');
      expect(coin.confidence, 0.99);
    });

    test('fromJson handles null optional fields', () {
      final json = {
        'id': 'test-id',
        'name': 'Unknown Coin',
        'country': 'Unknown',
        'year': null,
        'denomination': 'unknown',
        'face_value': null,
        'currency': 'USD',
        'obverse_description': null,
        'reverse_description': null,
        'confidence': 0.5,
      };

      final coin = Coin.fromJson(json);

      expect(coin.year, isNull);
      expect(coin.faceValue, isNull);
      expect(coin.obverseDescription, isNull);
      expect(coin.reverseDescription, isNull);
    });

    test('toJson serializes correctly', () {
      const coin = Coin(
        id: 'test-id',
        name: '5 Forint',
        country: 'Hungary',
        year: 2017,
        denomination: '5 forint',
        faceValue: 5.0,
        currency: 'HUF',
        obverseDescription: 'Egret bird',
        reverseDescription: 'Numeral 5',
        confidence: 0.99,
      );

      final json = coin.toJson();

      expect(json['id'], 'test-id');
      expect(json['name'], '5 Forint');
      expect(json['country'], 'Hungary');
      expect(json['year'], 2017);
      expect(json['denomination'], '5 forint');
      expect(json['face_value'], 5.0);
      expect(json['currency'], 'HUF');
      expect(json['confidence'], 0.99);
    });

    test('confidencePercent returns correct percentage', () {
      const coin = Coin(
        id: 'test',
        name: 'Test',
        country: 'Test',
        denomination: 'test',
        currency: 'USD',
        confidence: 0.95,
      );

      expect(coin.confidencePercent, '95%');
    });

    test('confidencePercent rounds correctly', () {
      const coin = Coin(
        id: 'test',
        name: 'Test',
        country: 'Test',
        denomination: 'test',
        currency: 'USD',
        confidence: 0.9999,
      );

      expect(coin.confidencePercent, '100%');
    });

    test('yearDisplay returns year when present', () {
      const coin = Coin(
        id: 'test',
        name: 'Test',
        country: 'Test',
        year: 2017,
        denomination: 'test',
        currency: 'USD',
        confidence: 0.9,
      );

      expect(coin.yearDisplay, '2017');
    });

    test('yearDisplay returns "Unknown year" when null', () {
      const coin = Coin(
        id: 'test',
        name: 'Test',
        country: 'Test',
        year: null,
        denomination: 'test',
        currency: 'USD',
        confidence: 0.9,
      );

      expect(coin.yearDisplay, 'Unknown year');
    });
  });

  group('CoinIdentificationResponse', () {
    test('fromJson parses response with coins', () {
      final json = {
        'coins': [
          {
            'id': 'coin-1',
            'name': '5 Forint',
            'country': 'Hungary',
            'year': 2017,
            'denomination': '5 forint',
            'face_value': 5.0,
            'currency': 'HUF',
            'obverse_description': 'Egret bird',
            'reverse_description': 'Numeral 5',
            'confidence': 0.99,
          },
        ],
        'total_coins_detected': 1,
        'model_used': 'gemini/gemini-3-flash-preview',
      };

      final response = CoinIdentificationResponse.fromJson(json);

      expect(response.coins.length, 1);
      expect(response.totalCoinsDetected, 1);
      expect(response.modelUsed, 'gemini/gemini-3-flash-preview');
      expect(response.coins.first.name, '5 Forint');
      expect(response.coins.first.country, 'Hungary');
    });

    test('fromJson handles empty coins list', () {
      final json = {
        'coins': [],
        'total_coins_detected': 0,
        'model_used': 'gemini/gemini-3-flash-preview',
      };

      final response = CoinIdentificationResponse.fromJson(json);

      expect(response.coins, isEmpty);
      expect(response.totalCoinsDetected, 0);
    });

    test('fromJson parses multiple coins', () {
      final json = {
        'coins': [
          {
            'id': 'coin-1',
            'name': '5 Forint',
            'country': 'Hungary',
            'denomination': '5 forint',
            'currency': 'HUF',
            'confidence': 0.99,
          },
          {
            'id': 'coin-2',
            'name': '10 Forint',
            'country': 'Hungary',
            'denomination': '10 forint',
            'currency': 'HUF',
            'confidence': 0.95,
          },
        ],
        'total_coins_detected': 2,
        'model_used': 'gpt-4-vision-preview',
      };

      final response = CoinIdentificationResponse.fromJson(json);

      expect(response.coins.length, 2);
      expect(response.totalCoinsDetected, 2);
      expect(response.coins[0].name, '5 Forint');
      expect(response.coins[1].name, '10 Forint');
    });
  });
}

