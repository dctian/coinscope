import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../models/coin.dart';
import '../widgets/coin_card.dart';

/// Screen displaying the results of coin identification.
class ResultsScreen extends StatelessWidget {
  final List<Coin> coins;
  final Uint8List imageBytes;
  final String modelUsed;

  const ResultsScreen({
    super.key,
    required this.coins,
    required this.imageBytes,
    required this.modelUsed,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Results'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
              // TODO: Implement share functionality
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Share feature coming soon!')),
              );
            },
          ),
        ],
      ),
      body: coins.isEmpty
          ? _buildEmptyState(context)
          : _buildResultsList(context),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off_outlined,
              size: 80,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 24),
            Text(
              'No Coins Detected',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text(
              'We couldn\'t identify any coins in this image. Try taking a clearer photo with good lighting.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.camera_alt_outlined),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsList(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // Image preview
        SliverToBoxAdapter(
          child: Container(
            margin: const EdgeInsets.all(16),
            height: 200,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.memory(
                imageBytes,
                fit: BoxFit.cover,
                width: double.infinity,
              ),
            ),
          ),
        ),

        // Summary header
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${coins.length} Coin${coins.length != 1 ? 's' : ''} Found',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Chip(
                  label: Text(
                    modelUsed.split('/').last,
                    style: const TextStyle(fontSize: 11),
                  ),
                  avatar: const Icon(Icons.auto_awesome, size: 14),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 8)),

        // Coin cards list
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) => CoinCard(
              coin: coins[index],
              onTap: () => _showCoinDetails(context, coins[index]),
            ),
            childCount: coins.length,
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  void _showCoinDetails(BuildContext context, Coin coin) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.outline,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                
                // Coin name
                Text(
                  coin.name,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                
                // Country
                Text(
                  coin.country,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),
                
                // Details
                _DetailRow(label: 'Year', value: coin.yearDisplay),
                _DetailRow(label: 'Denomination', value: coin.denomination),
                _DetailRow(label: 'Currency', value: coin.currency),
                if (coin.faceValue != null)
                  _DetailRow(label: 'Face Value', value: coin.faceValue!.toString()),
                _DetailRow(label: 'Confidence', value: coin.confidencePercent),
                
                if (coin.obverseDescription != null) ...[
                  const SizedBox(height: 16),
                  Text('Front (Obverse)', style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Text(coin.obverseDescription!),
                ],
                
                if (coin.reverseDescription != null) ...[
                  const SizedBox(height: 16),
                  Text('Back (Reverse)', style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Text(coin.reverseDescription!),
                ],
                
                const SizedBox(height: 32),
                
                // Future: Price and seller links
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Pricing and seller links coming soon!',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

