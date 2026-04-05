import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/discovery/domain/discovery_candidate.dart';

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
              ? Center(child: Text(_error!))
              : _queue.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('You’re all caught up.'),
                          const SizedBox(height: 16),
                          FilledButton(
                            onPressed: _refill,
                            child: const Text('Refresh deck'),
                          ),
                        ],
                      ),
                    )
                  : Column(
                      children: [
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: _SwipeCard(candidate: _queue.first),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              FilledButton.tonal(
                                onPressed: _busy ? null : () => _act('PASS'),
                                child: const Text('Pass'),
                              ),
                              FilledButton(
                                onPressed: _busy ? null : () => _act('LIKE'),
                                child: const Text('Like'),
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
    final name =
        profile?.displayName ?? candidate.username ?? 'Golfer';
    final verified = profile?.isGHINVerified ?? false;
    return Card(
      elevation: 4,
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: photos.isNotEmpty
                ? Image.network(
                    resolveMediaUrl(photos.first.imageUrl),
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const ColoredBox(
                      color: Color(0xFF1B4332),
                      child: Icon(Icons.golf_course, size: 80, color: Colors.white54),
                    ),
                  )
                : const ColoredBox(
                    color: Color(0xFF1B4332),
                    child: Icon(Icons.person, size: 80, color: Colors.white54),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    if (verified)
                      const Icon(Icons.verified, color: Colors.teal, size: 22),
                  ],
                ),
                if (profile?.bio != null && profile!.bio!.isNotEmpty)
                  Text(
                    profile.bio!,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                if (profile?.handicap != null)
                  Text('Handicap: ${profile!.handicap}'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
