import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/core/theme/app_colors.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/discovery/domain/discovery_candidate.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';
import 'package:connectghin/shared/widgets/app_ui.dart';
import 'package:connectghin/shared/widgets/premium_upsell.dart';

class GhinderScreen extends ConsumerStatefulWidget {
  const GhinderScreen({super.key});

  @override
  ConsumerState<GhinderScreen> createState() => _GhinderScreenState();
}

class _GhinderScreenState extends ConsumerState<GhinderScreen> {
  final List<DiscoveryCandidate> _queue = [];
  bool _loading = true;
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _refill();
  }

  Future<void> _refill() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final disc = ref.read(discoveryRepositoryProvider);
      final batch = await disc.fetchCandidates();
      setState(() {
        _queue.clear();
        _queue.addAll(batch);
      });
    } catch (e) {
      setState(() => _error = formatApiError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _act(String action) async {
    if (_queue.isEmpty || _busy) return;
    final current = _queue.first;
    final id = current.userId;
    if (id.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(swipesRepositoryProvider).swipe(
            targetUserId: id,
            action: action,
          );
      if (!mounted) return;
      setState(() => _queue.removeAt(0));
      if (_queue.length < 3) {
        await _refill();
      }
    } on DioException catch (e) {
      if (!mounted) return;
      if (e.response?.statusCode == 403) {
        await showPremiumUpsell(
          context,
          message: formatApiError(e),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
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
    return Scaffold(
      appBar: AppBar(title: const Text('GHINder')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AppErrorInline(message: _error!),
                        const SizedBox(height: 16),
                        FilledButton(onPressed: _refill, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : _queue.isEmpty
                  ? Center(
                      child: AppEmptyState(
                        icon: Icons.celebration_outlined,
                        title: 'You’re all caught up',
                        subtitle: 'Check back soon for more golfers in your area.',
                        action: FilledButton.tonal(
                          onPressed: _refill,
                          child: const Text('Refresh deck'),
                        ),
                      ),
                    )
                  : Column(
                      children: [
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                            child: _SwipeCard(candidate: _queue.first),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
                          child: Row(
                            children: [
                              Expanded(
                                child: FilledButton.tonal(
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size.fromHeight(52),
                                    foregroundColor: AppColors.onSurfaceVariant,
                                  ),
                                  onPressed: _busy ? null : () => _act('PASS'),
                                  child: const Text('Pass'),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: FilledButton(
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size.fromHeight(52),
                                  ),
                                  onPressed: _busy ? null : () => _act('LIKE'),
                                  child: const Text('Connect'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
    );
  }
}

class _SwipeCard extends StatelessWidget {
  const _SwipeCard({required this.candidate});
  final DiscoveryCandidate candidate;

  @override
  Widget build(BuildContext context) {
    final profile = candidate.profile;
    final photos = candidate.photos;
    final primary = photos.primaryOrFirst;
    final name = profile?.displayName ?? candidate.username ?? 'Golfer';
    final verified = profile?.isGHINVerified ?? false;
    final subtitle = [
      if (profile?.city != null && profile!.city!.trim().isNotEmpty)
        profile.city!.trim(),
      if (profile?.handicap != null) 'HCP ${profile!.handicap}',
    ].join(' · ');

    return Material(
      elevation: 4,
      shadowColor: Colors.black.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(24),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: primary != null
                ? Image.network(
                    resolveMediaUrl(primary.imageUrl),
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _fallbackPhoto(),
                  )
                : _fallbackPhoto(),
          ),
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                      ),
                    ),
                    if (verified)
                      Icon(Icons.verified_rounded, color: AppColors.verified, size: 26),
                  ],
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
                if (profile?.bio != null && profile!.bio!.trim().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    profile.bio!,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _fallbackPhoto() {
    return ColoredBox(
      color: AppColors.primary,
      child: Center(
        child: Icon(Icons.sports_golf_rounded, size: 88, color: AppColors.onPrimary.withValues(alpha: 0.35)),
      ),
    );
  }
}
