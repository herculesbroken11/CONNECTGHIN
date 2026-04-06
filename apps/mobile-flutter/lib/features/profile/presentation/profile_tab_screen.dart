import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/theme/app_colors.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';
import 'package:connectghin/shared/widgets/app_ui.dart';

class ProfileTabScreen extends ConsumerStatefulWidget {
  const ProfileTabScreen({super.key});

  @override
  ConsumerState<ProfileTabScreen> createState() => _ProfileTabScreenState();
}

class _ProfileTabScreenState extends ConsumerState<ProfileTabScreen> {
  UserMe? _me;
  bool _loading = true;
  bool _requestingGhin = false;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final me = await ref.read(profileRepositoryProvider).getMe();
      setState(() {
        _me = me;
        _loadError = null;
      });
    } catch (e) {
      setState(() {
        _me = null;
        _loadError = formatApiError(e);
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _requestGhinVerification() async {
    final noteCtl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Request GHIN verification'),
        content: TextField(
          controller: noteCtl,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Optional note for reviewers',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    final note = noteCtl.text.trim();
    noteCtl.dispose();
    if (ok != true || !mounted) return;
    setState(() => _requestingGhin = true);
    try {
      await ref.read(profileRepositoryProvider).requestGhinVerification(
            note: note.isEmpty ? null : note,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification request sent')),
        );
      }
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _requestingGhin = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_loadError != null && _me == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AppErrorInline(message: _loadError!),
                const SizedBox(height: 16),
                FilledButton(onPressed: _load, child: const Text('Retry')),
              ],
            ),
          ),
        ),
      );
    }
    final me = _me;
    final profile = me?.profile;
    final photos = me?.profilePhotos ?? [];
    final primaryPhoto = photos.primaryOrFirst;
    final verified = profile?.isGHINVerified == true;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 200,
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              surfaceTintColor: Colors.transparent,
              actions: [
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  onPressed: () => context.push('/settings'),
                  tooltip: 'Settings',
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: () async {
                    await context.push('/profile/edit');
                    if (mounted) await _load();
                  },
                  tooltip: 'Edit profile',
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: DecoratedBox(
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryHeaderGradient,
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 48, 20, 16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(18),
                            child: SizedBox(
                              width: 88,
                              height: 88,
                              child: primaryPhoto != null
                                  ? Image.network(
                                      resolveMediaUrl(primaryPhoto.imageUrl),
                                      key: ValueKey(primaryPhoto.imageUrl),
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => _ph(context),
                                    )
                                  : _ph(context),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        profile?.displayName ?? me?.username ?? '',
                                        style: const TextStyle(
                                          color: AppColors.onPrimary,
                                          fontSize: 22,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: -0.3,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (verified) ...[
                                      const SizedBox(width: 6),
                                      Icon(
                                        Icons.verified_rounded,
                                        color: AppColors.verified.withValues(alpha: 0.95),
                                        size: 24,
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '@${me?.username ?? ''}',
                                  style: TextStyle(
                                    color: AppColors.onPrimary.withValues(alpha: 0.85),
                                    fontSize: 14,
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
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _InfoChip(
                    icon: Icons.workspace_premium_outlined,
                    label:
                        '${me?.membershipType ?? ''} · ${me?.membershipStatus ?? ''}',
                  ),
                  const SizedBox(height: 12),
                  _GhinVerificationCard(
                    isVerified: verified,
                    requestedAt: profile?.ghinVerificationRequestedAt,
                    isRequesting: _requestingGhin,
                    onRequest: verified ? null : _requestGhinVerification,
                  ),
                  if (profile?.age != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Age ${profile!.age}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                  if (profile?.bio != null && profile!.bio!.trim().isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      'About',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(profile.bio!, style: Theme.of(context).textTheme.bodyLarge),
                  ],
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: () => context.push('/subscription'),
                    child: const Text('Membership & billing'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: () => context.push('/safety'),
                    child: const Text('Safety & blocked users'),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _ph(BuildContext context) {
    return ColoredBox(
      color: AppColors.onPrimary.withValues(alpha: 0.15),
      child: Icon(Icons.person_rounded, size: 44, color: AppColors.onPrimary.withValues(alpha: 0.6)),
    );
  }
}

class _GhinVerificationCard extends StatelessWidget {
  const _GhinVerificationCard({
    required this.isVerified,
    this.requestedAt,
    required this.isRequesting,
    this.onRequest,
  });

  final bool isVerified;
  final DateTime? requestedAt;
  final bool isRequesting;
  final VoidCallback? onRequest;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.outlineMuted.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isVerified ? Icons.verified_rounded : Icons.verified_outlined,
                color: isVerified ? AppColors.verified : AppColors.outlineMuted,
              ),
              const SizedBox(width: 8),
              Text(
                'GHIN verification',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            isVerified
                ? 'Your profile is verified. Other golfers can filter for verified players.'
                : 'Verification is reviewed by our team (manual admin approval). '
                    'Tap below to add yourself to the review queue.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.4),
          ),
          if (!isVerified && requestedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              'Request submitted ${requestedAt!.toLocal().toString().split('.').first}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
          if (!isVerified && onRequest != null) ...[
            const SizedBox(height: 12),
            FilledButton.tonal(
              onPressed: isRequesting ? null : onRequest,
              child: Text(isRequesting ? 'Sending…' : 'Request verification'),
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, size: 22, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
