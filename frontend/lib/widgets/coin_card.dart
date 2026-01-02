import 'package:flutter/material.dart';
import '../models/coin.dart';

/// A card widget displaying information about an identified coin.
class CoinCard extends StatelessWidget {
  final Coin coin;
  final VoidCallback? onTap;

  const CoinCard({
    super.key,
    required this.coin,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row with name and confidence
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      coin.name,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _ConfidenceBadge(confidence: coin.confidence),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Country and year row
              Row(
                children: [
                  _InfoChip(
                    icon: Icons.flag_outlined,
                    label: coin.country,
                  ),
                  const SizedBox(width: 8),
                  _InfoChip(
                    icon: Icons.calendar_today_outlined,
                    label: coin.yearDisplay,
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Denomination row
              Row(
                children: [
                  _InfoChip(
                    icon: Icons.monetization_on_outlined,
                    label: '${coin.denomination} (${coin.currency})',
                  ),
                ],
              ),
              
              // Descriptions if available
              if (coin.obverseDescription != null || coin.reverseDescription != null) ...[
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),
                
                if (coin.obverseDescription != null)
                  _DescriptionRow(
                    label: 'Front',
                    description: coin.obverseDescription!,
                  ),
                  
                if (coin.reverseDescription != null) ...[
                  const SizedBox(height: 4),
                  _DescriptionRow(
                    label: 'Back',
                    description: coin.reverseDescription!,
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Confidence badge showing identification confidence level.
class _ConfidenceBadge extends StatelessWidget {
  final double confidence;

  const _ConfidenceBadge({required this.confidence});

  Color _getColor() {
    if (confidence >= 0.8) return Colors.green;
    if (confidence >= 0.6) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _getColor().withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _getColor().withOpacity(0.5)),
      ),
      child: Text(
        '${(confidence * 100).toStringAsFixed(0)}%',
        style: TextStyle(
          color: _getColor(),
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }
}

/// Info chip with icon and label.
class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Description row with label and text.
class _DescriptionRow extends StatelessWidget {
  final String label;
  final String description;

  const _DescriptionRow({
    required this.label,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 40,
          child: Text(
            '$label:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        Expanded(
          child: Text(
            description,
            style: const TextStyle(fontSize: 12),
          ),
        ),
      ],
    );
  }
}

