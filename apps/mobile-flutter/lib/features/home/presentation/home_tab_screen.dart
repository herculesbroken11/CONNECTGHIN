import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/config/public_config_repository.dart';
import 'package:connectghin/core/theme/app_colors.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/home/application/main_shell_tab_provider.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';
import 'package:connectghin/features/subscriptions/application/premium_access.dart';
import 'package:connectghin/shared/widgets/app_ui.dart';

/// Dashboard: overview, completion, shortcuts into the main tabs.
class HomeTabScreen extends ConsumerStatefulWidget {
  const HomeTabScreen({super.key});

  @override
  ConsumerState<HomeTabScreen> createState() => _HomeTabScreenState();
}

class _HomeTabScreenState extends ConsumerState<HomeTabScreen> {
  UserMe? _me;
  PublicAppConfig? _publicConfig;
  int _unreadNotifications = 0;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final me = await ref.read(profileRepositoryProvider).getMe();
      var unread = 0;
      PublicAppConfig? cfg;
      try {
        unread = await ref.read(notificationsRepositoryProvider).unreadCount();
      } catch (_) {}
      try {
        cfg = await ref.read(publicConfigRepositoryProvider).fetch();
      } catch (_) {}
      if (mounted) {
        setState(() {
          _me = me;
          _unreadNotifications = unread;
          _publicConfig = cfg;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = formatApiError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _goTab(int index) {
    ref.read(mainShellTabIndexProvider.notifier).select(index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 132,
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              surfaceTintColor: Colors.transparent,
              flexibleSpace: FlexibleSpaceBar(
                background: DecoratedBox(
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryHeaderGradient,
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 12, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _greeting(_me),
                                  style: const TextStyle(
                                    color: AppColors.onPrimary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                              ),
                              Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  IconButton(
                                    onPressed: () async {
                                      await context.push('/notifications');
                                      if (mounted) await _load();
                                    },
                                    icon: const Icon(Icons.notifications_outlined),
                                    color: AppColors.onPrimary,
                                    tooltip: 'Notifications',
                                  ),
                                  if (_unreadNotifications > 0)
                                    Positioned(
                                      right: 6,
                                      top: 6,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 5,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.accent,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          _unreadNotifications > 9
                                              ? '9+'
                                              : '$_unreadNotifications',
                                          style: const TextStyle(
                                            color: Color(0xFF1B1F1C),
                                            fontSize: 10,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              IconButton(
                                onPressed: () => context.push('/settings'),
                                icon: const Icon(Icons.settings_outlined),
                                color: AppColors.onPrimary,
                                tooltip: 'Settings',
                              ),
                            ],
                          ),
                          Text(
                            'Find your next round',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: AppColors.onPrimary,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.4,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            if (_loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AppErrorInline(message: _error!),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _HeroCard(me: _me),
                    if (_me != null &&
                        _publicConfig != null &&
                        !isPremiumUser(_me!) &&
                        _publicConfig!.freeDailySwipeLimitEnabled) ...[
                      const SizedBox(height: 16),
                      _FreeTierHint(
                        dailyLimit: _publicConfig!.freeDailySwipeLimit,
                        onUpgrade: () => context.push('/subscription'),
                      ),
                    ],
                    const SizedBox(height: 24),
                    const AppSectionTitle('Play & connect'),
                    _ActionGrid(
                      onDiscover: () => _goTab(1),
                      onGhinder: () => _goTab(2),
                      onMessages: () => _goTab(3),
                      onMatches: () => context.push('/matches'),
                    ),
                    const SizedBox(height: 24),
                    const AppSectionTitle('Membership'),
                    _MembershipCard(
                      onPremium: () => context.push('/subscription'),
                    ),
                  ]),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static String _greeting(UserMe? me) {
    final first = me?.firstName.trim();
    if (first != null && first.isNotEmpty) {
      return 'Welcome back, $first';
    }
    return 'Welcome back';
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.me});

  final UserMe? me;

  @override
  Widget build(BuildContext context) {
    final profile = me?.profile;
    final pct = profile?.profileCompletionPercent ?? 0;
    final photo = me?.profilePhotos.primaryOrFirst;
    final verified = profile?.isGHINVerified == true;

    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Avatar(url: photo?.imageUrl),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          profile?.displayName ?? me?.username ?? 'Golfer',
                          style: Theme.of(context).textTheme.titleLarge,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (verified) ...[
                        const SizedBox(width: 6),
                        Icon(Icons.verified_rounded, color: AppColors.verified, size: 22),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '@${me?.username ?? ''}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Profile strength',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: AppColors.onSurfaceVariant,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: pct / 100,
                      minHeight: 8,
                      backgroundColor: AppColors.surfaceContainer,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$pct% complete',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        width: 72,
        height: 72,
        child: url != null && url!.isNotEmpty
            ? Image.network(
                resolveMediaUrl(url!),
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _placeholder(context),
              )
            : _placeholder(context),
      ),
    );
  }

  Widget _placeholder(BuildContext context) {
    return ColoredBox(
      color: AppColors.surfaceContainer,
      child: Icon(Icons.person_rounded, size: 40, color: AppColors.outlineMuted),
    );
  }
}

class _ActionGrid extends StatelessWidget {
  const _ActionGrid({
    required this.onDiscover,
    required this.onGhinder,
    required this.onMessages,
    required this.onMatches,
  });

  final VoidCallback onDiscover;
  final VoidCallback onGhinder;
  final VoidCallback onMessages;
  final VoidCallback onMatches;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _QuickTile(
                icon: Icons.explore_outlined,
                label: 'Discover',
                onTap: onDiscover,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickTile(
                icon: Icons.swipe_outlined,
                label: 'GHINder',
                onTap: onGhinder,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickTile(
                icon: Icons.chat_bubble_outline_rounded,
                label: 'Messages',
                onTap: onMessages,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickTile(
                icon: Icons.handshake_outlined,
                label: 'Matches',
                onTap: onMatches,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickTile extends StatelessWidget {
  const _QuickTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
          child: Column(
            children: [
              Icon(icon, size: 28, color: AppColors.primary),
              const SizedBox(height: 10),
              Text(
                label,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FreeTierHint extends StatelessWidget {
  const _FreeTierHint({
    required this.dailyLimit,
    required this.onUpgrade,
  });

  final int dailyLimit;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceContainer,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Icon(Icons.touch_app_outlined, color: AppColors.primary, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Free plan: up to $dailyLimit swipes per day on GHINder. Premium removes the daily cap.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.35),
              ),
            ),
            TextButton(onPressed: onUpgrade, child: const Text('Upgrade')),
          ],
        ),
      ),
    );
  }
}

class _MembershipCard extends StatelessWidget {
  const _MembershipCard({required this.onPremium});

  final VoidCallback onPremium;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceContainer,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onPremium,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Icon(Icons.workspace_premium_rounded, color: AppColors.accent, size: 32),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Premium',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'More swipes, filters, and messaging options',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}
