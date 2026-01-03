/// Run all unit and widget tests (excluding integration tests).
/// 
/// Usage:
///   flutter test test/all_tests.dart
/// 
/// For integration tests (requires backend running):
///   flutter test test/integration/

import 'models/coin_test.dart' as coin_tests;
import 'services/api_service_test.dart' as api_service_tests;
import 'widgets/coin_card_test.dart' as coin_card_tests;

void main() {
  coin_tests.main();
  api_service_tests.main();
  coin_card_tests.main();
}

