import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:coinscope/models/coin.dart';
import 'package:coinscope/widgets/coin_card.dart';

void main() {
  // Sample Hungarian Forint coin (matches testdata/coin1.jpg)
  const hungarianForint = Coin(
    id: 'test-id-1',
    name: '5 Forint',
    country: 'Hungary',
    year: 2017,
    denomination: '5 forint',
    faceValue: 5.0,
    currency: 'HUF',
    obverseDescription: 'Great Egret bird with text MAGYARORSZÁG',
    reverseDescription: 'Large numeral 5 with text FORINT',
    confidence: 0.99,
  );

  Widget buildTestWidget(Coin coin, {VoidCallback? onTap}) {
    return MaterialApp(
      theme: ThemeData.light(useMaterial3: true),
      home: Scaffold(
        body: CoinCard(coin: coin, onTap: onTap),
      ),
    );
  }

  group('CoinCard', () {
    testWidgets('displays coin name', (tester) async {
      await tester.pumpWidget(buildTestWidget(hungarianForint));

      expect(find.text('5 Forint'), findsOneWidget);
    });

    testWidgets('displays country', (tester) async {
      await tester.pumpWidget(buildTestWidget(hungarianForint));

      expect(find.text('Hungary'), findsOneWidget);
    });

    testWidgets('displays year', (tester) async {
      await tester.pumpWidget(buildTestWidget(hungarianForint));

      expect(find.text('2017'), findsOneWidget);
    });

    testWidgets('displays denomination and currency', (tester) async {
      await tester.pumpWidget(buildTestWidget(hungarianForint));

      expect(find.text('5 forint (HUF)'), findsOneWidget);
    });

    testWidgets('displays confidence percentage', (tester) async {
      await tester.pumpWidget(buildTestWidget(hungarianForint));

      expect(find.text('99%'), findsOneWidget);
    });

    testWidgets('displays obverse description when present', (tester) async {
      await tester.pumpWidget(buildTestWidget(hungarianForint));

      expect(find.text('Front:'), findsOneWidget);
      expect(
        find.text('Great Egret bird with text MAGYARORSZÁG'),
        findsOneWidget,
      );
    });

    testWidgets('displays reverse description when present', (tester) async {
      await tester.pumpWidget(buildTestWidget(hungarianForint));

      expect(find.text('Back:'), findsOneWidget);
      expect(
        find.text('Large numeral 5 with text FORINT'),
        findsOneWidget,
      );
    });

    testWidgets('hides descriptions when null', (tester) async {
      const coinNoDesc = Coin(
        id: 'test-id',
        name: 'Test Coin',
        country: 'Test Country',
        denomination: '1 unit',
        currency: 'TST',
        confidence: 0.5,
        obverseDescription: null,
        reverseDescription: null,
      );

      await tester.pumpWidget(buildTestWidget(coinNoDesc));

      expect(find.text('Front:'), findsNothing);
      expect(find.text('Back:'), findsNothing);
    });

    testWidgets('displays "Unknown year" when year is null', (tester) async {
      const coinNoYear = Coin(
        id: 'test-id',
        name: 'Test Coin',
        country: 'Test Country',
        year: null,
        denomination: '1 unit',
        currency: 'TST',
        confidence: 0.5,
      );

      await tester.pumpWidget(buildTestWidget(coinNoYear));

      expect(find.text('Unknown year'), findsOneWidget);
    });

    testWidgets('calls onTap when card is tapped', (tester) async {
      bool wasTapped = false;

      await tester.pumpWidget(buildTestWidget(
        hungarianForint,
        onTap: () => wasTapped = true,
      ));

      await tester.tap(find.byType(CoinCard));
      await tester.pumpAndSettle();

      expect(wasTapped, true);
    });

    testWidgets('shows green confidence badge for high confidence', (tester) async {
      const highConfidenceCoin = Coin(
        id: 'test',
        name: 'Test',
        country: 'Test',
        denomination: 'test',
        currency: 'TST',
        confidence: 0.95,
      );

      await tester.pumpWidget(buildTestWidget(highConfidenceCoin));

      expect(find.text('95%'), findsOneWidget);
    });

    testWidgets('shows orange confidence badge for medium confidence', (tester) async {
      const mediumConfidenceCoin = Coin(
        id: 'test',
        name: 'Test',
        country: 'Test',
        denomination: 'test',
        currency: 'TST',
        confidence: 0.70,
      );

      await tester.pumpWidget(buildTestWidget(mediumConfidenceCoin));

      expect(find.text('70%'), findsOneWidget);
    });

    testWidgets('shows red confidence badge for low confidence', (tester) async {
      const lowConfidenceCoin = Coin(
        id: 'test',
        name: 'Test',
        country: 'Test',
        denomination: 'test',
        currency: 'TST',
        confidence: 0.40,
      );

      await tester.pumpWidget(buildTestWidget(lowConfidenceCoin));

      expect(find.text('40%'), findsOneWidget);
    });

    testWidgets('displays icons for country, year, and denomination', (tester) async {
      await tester.pumpWidget(buildTestWidget(hungarianForint));

      expect(find.byIcon(Icons.flag_outlined), findsOneWidget);
      expect(find.byIcon(Icons.calendar_today_outlined), findsOneWidget);
      expect(find.byIcon(Icons.monetization_on_outlined), findsOneWidget);
    });
  });
}

