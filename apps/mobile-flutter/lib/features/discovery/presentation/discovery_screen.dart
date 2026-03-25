import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/discovery/domain/discovery_candidate.dart';

class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen> {
  bool _verifiedOnly = false;
  List<DiscoveryCandidate> _items = [];
  String? _error;
  bool _loading = true;

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
      final repo = ref.read(discoveryRepositoryProvider);
      final list = await repo.fetchCandidates(verifiedOnly: _verifiedOnly);
      setState(() => _items = list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discovery'),
        actions: [
          FilterChip(
            label: const Text('GHIN verified'),
            selected: _verifiedOnly,
            onSelected: (v) {
              setState(() => _verifiedOnly = v);
              _load();
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      ),
                    ],
                  )
                : _items.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 120),
                          Center(child: Text('No golfers match your filters right now.')),
                        ],
                      )
                    : ListView.builder(
                        itemCount: _items.length,
                        itemBuilder: (context, i) {
                          final it = _items[i];
                          final profile = it.profile;
                          final photos = it.photos;
                          final verified = profile?.isGHINVerified == true;
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundImage: photos.isNotEmpty
                                  ? NetworkImage(
                                      resolveMediaUrl(photos.first.imageUrl),
                                    )
                                  : null,
                              child: photos.isEmpty ? const Icon(Icons.person) : null,
                            ),
                            title: Text(
                              profile?.displayName ?? it.username ?? '',
                            ),
                            subtitle: Text(
                              [
                                if (profile?.city != null &&
                                    profile!.city!.trim().isNotEmpty)
                                  profile.city!.trim(),
                                if (profile?.handicap != null)
                                  'HCP ${profile!.handicap}',
                              ].join(' · '),
                            ),
                            trailing: verified
                                ? const Icon(Icons.verified, color: Colors.teal)
                                : null,
                          );
                        },
                      ),
      ),
    );
  }
}
