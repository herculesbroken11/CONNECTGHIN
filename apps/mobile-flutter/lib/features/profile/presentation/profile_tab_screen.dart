import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';

class ProfileTabScreen extends ConsumerStatefulWidget {
  const ProfileTabScreen({super.key});

  @override
  ConsumerState<ProfileTabScreen> createState() => _ProfileTabScreenState();
}

class _ProfileTabScreenState extends ConsumerState<ProfileTabScreen> {
  UserMe? _me;
  bool _loading = true;
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

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_loadError != null && _me == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('My profile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _loadError!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _load,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    final me = _me;
    final profile = me?.profile;
    final photos = me?.profilePhotos ?? [];
    final verified = profile?.isGHINVerified == true;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/profile/edit'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (photos.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Image.network(
                    resolveMediaUrl(photos.first.imageUrl),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Text(
                    profile?.displayName ?? me?.username ?? '',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                if (verified)
                  const Icon(Icons.verified, color: Colors.teal, size: 28),
              ],
            ),
            Text('@${me?.username ?? ''}'),
            const SizedBox(height: 8),
            Text(
              'Membership: ${me?.membershipType ?? ''} · ${me?.membershipStatus ?? ''}',
            ),
            if (profile?.bio != null && profile!.bio!.trim().isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(profile.bio!),
            ],
            const SizedBox(height: 24),
            FilledButton.tonal(
              onPressed: () => context.push('/subscription'),
              child: const Text('Premium membership'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => context.push('/safety'),
              child: const Text('Safety & blocked users'),
            ),
          ],
        ),
      ),
    );
  }
}
