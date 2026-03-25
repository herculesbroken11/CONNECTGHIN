import 'package:flutter/material.dart';

class AppAsyncView extends StatelessWidget {
  const AppAsyncView({
    super.key,
    required this.loading,
    required this.child,
    this.error,
    this.onRetry,
    this.empty,
  });

  final bool loading;
  final String? error;
  final VoidCallback? onRetry;
  final Widget child;
  final Widget? empty;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              FilledButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ],
        ),
      );
    }
    return child;
  }
}
