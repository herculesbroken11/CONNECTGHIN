import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:connectghin/core/config/public_config_repository.dart';
import 'package:connectghin/core/theme/app_colors.dart';
import 'package:connectghin/core/util/api_error_message.dart';
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
  PublicAppConfig? _publicConfig;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      await ref.read(subscriptionStateProvider.notifier).load();
      try {
        final cfg = await ref.read(publicConfigRepositoryProvider).fetch();
        if (mounted) setState(() => _publicConfig = cfg);
      } catch (_) {}
    });
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(subscriptionStateProvider);
    final mine = state.data;
    final mem = mine?.membership;
    final stripeStatus = mine?.subscription?.status;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Membership'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      body: AppAsyncView(
        loading: state.loading,
        error: state.error,
        onRetry: () => ref.read(subscriptionStateProvider.notifier).load(),
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.primaryHeaderGradient,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Premium',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.onPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'More swipes, richer discovery, and optional direct messaging when enabled.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.onPrimary.withValues(alpha: 0.9),
                          height: 1.4,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('What you get', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            _BenefitRow(
              icon: Icons.swipe_rounded,
              text: _publicConfig != null && _publicConfig!.freeDailySwipeLimitEnabled
                  ? 'Unlimited GHINder swipes (free tier is limited to ${_publicConfig!.freeDailySwipeLimit}/day).'
                  : 'Unlimited GHINder swipes vs free-tier limits when enabled.',
            ),
            const _BenefitRow(
              icon: Icons.tune_rounded,
              text: 'Full discovery filters: age, distance, preferences, verified.',
            ),
            _BenefitRow(
              icon: Icons.chat_rounded,
              text: _publicConfig?.premiumDirectMessagingEnabled == true
                  ? 'Direct messaging without a match when club policy allows.'
                  : 'Direct messaging without a match when your club enables it in settings.',
            ),
            const SizedBox(height: 24),
            Text('Current status', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              '${mem?.membershipType ?? ''} · ${mem?.membershipStatus ?? ''}',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            if (stripeStatus != null && stripeStatus.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                'Billing: $stripeStatus',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: 28),
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
        ),
      ),
    );
  }
}

class _BenefitRow extends StatelessWidget {
  const _BenefitRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 22, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
