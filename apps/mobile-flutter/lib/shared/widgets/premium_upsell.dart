import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Shown when API returns 403 for limits (swipes, messaging rules).
Future<void> showPremiumUpsell(
  BuildContext context, {
  required String message,
}) async {
  await showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Premium'),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: const Text('Not now'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.of(ctx).pop();
            context.push('/subscription');
          },
          child: const Text('View plans'),
        ),
      ],
    ),
  );
}
