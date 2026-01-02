/// Model representing an identified coin.
class Coin {
  final String id;
  final String name;
  final String country;
  final int? year;
  final String denomination;
  final double? faceValue;
  final String currency;
  final String? obverseDescription;
  final String? reverseDescription;
  final double confidence;

  const Coin({
    required this.id,
    required this.name,
    required this.country,
    this.year,
    required this.denomination,
    this.faceValue,
    required this.currency,
    this.obverseDescription,
    this.reverseDescription,
    required this.confidence,
  });

  factory Coin.fromJson(Map<String, dynamic> json) {
    return Coin(
      id: json['id'] as String,
      name: json['name'] as String,
      country: json['country'] as String,
      year: json['year'] as int?,
      denomination: json['denomination'] as String,
      faceValue: (json['face_value'] as num?)?.toDouble(),
      currency: json['currency'] as String,
      obverseDescription: json['obverse_description'] as String?,
      reverseDescription: json['reverse_description'] as String?,
      confidence: (json['confidence'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'country': country,
      'year': year,
      'denomination': denomination,
      'face_value': faceValue,
      'currency': currency,
      'obverse_description': obverseDescription,
      'reverse_description': reverseDescription,
      'confidence': confidence,
    };
  }

  /// Returns a confidence percentage string
  String get confidencePercent => '${(confidence * 100).toStringAsFixed(0)}%';

  /// Returns the year as a display string
  String get yearDisplay => year?.toString() ?? 'Unknown year';
}

/// Response from coin identification API
class CoinIdentificationResponse {
  final List<Coin> coins;
  final int totalCoinsDetected;
  final String modelUsed;

  const CoinIdentificationResponse({
    required this.coins,
    required this.totalCoinsDetected,
    required this.modelUsed,
  });

  factory CoinIdentificationResponse.fromJson(Map<String, dynamic> json) {
    return CoinIdentificationResponse(
      coins: (json['coins'] as List)
          .map((coin) => Coin.fromJson(coin as Map<String, dynamic>))
          .toList(),
      totalCoinsDetected: json['total_coins_detected'] as int,
      modelUsed: json['model_used'] as String,
    );
  }
}

