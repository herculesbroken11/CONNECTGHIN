import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/subscriptions/application/subscription_state.dart';
import 'package:connectghin/shared/widgets/app_async_view.dart';

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(subscriptionStateProvider.notifier).load());
  }

  Future<void> _checkout() async {
    setState(() => _busy = true);
    try {
      final url = await ref.read(subscriptionRepositoryProvider).createCheckoutUrl();
      if (url != null) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _portal() async {
    setState(() => _busy = true);
    try {
      final url =
          await ref.read(subscriptionRepositoryProvider).customerPortalUrl();
      if (url != null) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(subscriptionStateProvider);
    final mine = state.data;
    final mem = mine?['membership'] as Map<String, dynamic>?;
    final sub = mine?['subscription'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(title: const Text('Membership')),
      body: AppAsyncView(
          loading: state.loading,
          error: state.error,
          onRetry: () => ref.read(subscriptionStateProvider.notifier).load(),
          child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text(
                  'Status',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  '${mem?['membershipType'] ?? ''} · ${mem?['membershipStatus'] ?? ''}',
                ),
                if (sub != null) ...[
                  const SizedBox(height: 16),
                  Text('Stripe: ${sub['status'] ?? ''}'),
                ],
                const SizedBox(height: 24),
                Text(
                  'Premium unlocks full GHINder, filters, and optional direct messaging when enabled by the club.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _busy ? null : _checkout,
                  child: const Text('Upgrade — \$2.99/mo'),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _busy ? null : _portal,
                  child: const Text('Manage billing'),
                ),
              ],
            )),
    );
  }
}
