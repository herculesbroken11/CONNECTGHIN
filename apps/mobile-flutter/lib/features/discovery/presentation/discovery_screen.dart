import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/core/theme/app_colors.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/discovery/domain/discovery_candidate.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';
import 'package:connectghin/shared/widgets/app_ui.dart';

class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen> {
  bool _verifiedOnly = false;
  int? _ageMin;
  int? _ageMax;
  double? _distanceKm;
  double? _handicapMin;
  double? _handicapMax;
  String? _drinking;
  String? _smoking;
  String? _music;

  List<DiscoveryCandidate> _items = [];
  String? _error;
  bool _loading = true;

  final _hcpMinCtl = TextEditingController();
  final _hcpMaxCtl = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _hcpMinCtl.dispose();
    _hcpMaxCtl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(discoveryRepositoryProvider);
      final list = await repo.fetchCandidates(
        verifiedOnly: _verifiedOnly,
        ageMin: _ageMin,
        ageMax: _ageMax,
        distanceKm: _distanceKm,
        handicapMin: _handicapMin,
        handicapMax: _handicapMax,
        drinkingPreference: _drinking,
        smokingPreference: _smoking,
        musicPreference: _music,
      );
      setState(() => _items = list);
    } catch (e) {
      setState(() => _error = formatApiError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openFilters() async {
    var verified = _verifiedOnly;
    var ageMin = _ageMin;
    var ageMax = _ageMax;
    var useDistance = _distanceKm != null;
    double? dist = _distanceKm ?? 75.0;
    var drink = _drinking;
    var smoke = _smoking;
    var music = _music;

    _hcpMinCtl.text = _handicapMin?.toString() ?? '';
    _hcpMaxCtl.text = _handicapMax?.toString() ?? '';

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModal) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                bottom: MediaQuery.paddingOf(context).bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Filters', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text(
                      'Distance filter uses profile coordinates when available.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      title: const Text('GHIN verified only'),
                      value: verified,
                      onChanged: (v) => setModal(() => verified = v),
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<int?>(
                            value: ageMin,
                            decoration: const InputDecoration(labelText: 'Min age'),
                            items: [
                              const DropdownMenuItem(value: null, child: Text('Any')),
                              ...List.generate(
                                103,
                                (i) => DropdownMenuItem(value: 18 + i, child: Text('${18 + i}')),
                              ),
                            ],
                            onChanged: (v) => setModal(() => ageMin = v),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<int?>(
                            value: ageMax,
                            decoration: const InputDecoration(labelText: 'Max age'),
                            items: [
                              const DropdownMenuItem(value: null, child: Text('Any')),
                              ...List.generate(
                                103,
                                (i) => DropdownMenuItem(value: 18 + i, child: Text('${18 + i}')),
                              ),
                            ],
                            onChanged: (v) => setModal(() => ageMax = v),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SwitchListTile(
                      title: const Text('Limit by distance'),
                      subtitle: Text(useDistance ? '${(dist ?? 75).round()} km' : 'Off'),
                      value: useDistance,
                      onChanged: (v) => setModal(() => useDistance = v),
                    ),
                    if (useDistance)
                      Slider(
                        value: (dist ?? 75).clamp(1, 500),
                        min: 1,
                        max: 500,
                        divisions: 99,
                        label: '${(dist ?? 75).round()} km',
                        onChanged: (v) => setModal(() => dist = v),
                      ),
                    Text(
                      'Handicap range (optional)',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Leave blank for any. Players without a handicap are excluded when a range is set.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _hcpMinCtl,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                              signed: true,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Min HCP',
                              hintText: 'e.g. 5',
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _hcpMaxCtl,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                              signed: true,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Max HCP',
                              hintText: 'e.g. 18',
                            ),
                          ),
                        ),
                      ],
                    ),
                    DropdownButtonFormField<String?>(
                      value: drink,
                      decoration: const InputDecoration(labelText: 'Drinking'),
                      items: const [
                        DropdownMenuItem(value: null, child: Text('Any')),
                        DropdownMenuItem(value: 'NO', child: Text('No drinking')),
                        DropdownMenuItem(value: 'SOCIAL', child: Text('Social')),
                        DropdownMenuItem(value: 'YES', child: Text('Yes')),
                      ],
                      onChanged: (v) => setModal(() => drink = v),
                    ),
                    DropdownButtonFormField<String?>(
                      value: smoke,
                      decoration: const InputDecoration(labelText: 'Smoking'),
                      items: const [
                        DropdownMenuItem(value: null, child: Text('Any')),
                        DropdownMenuItem(value: 'NO', child: Text('No smoking')),
                        DropdownMenuItem(value: 'SOCIAL', child: Text('Social')),
                        DropdownMenuItem(value: 'YES', child: Text('Yes')),
                      ],
                      onChanged: (v) => setModal(() => smoke = v),
                    ),
                    DropdownButtonFormField<String?>(
                      value: music,
                      decoration: const InputDecoration(labelText: 'On-course music'),
                      items: const [
                        DropdownMenuItem(value: null, child: Text('Any')),
                        DropdownMenuItem(value: 'ANY', child: Text('Any')),
                        DropdownMenuItem(value: 'QUIET', child: Text('Quiet')),
                        DropdownMenuItem(value: 'MUSIC', child: Text('Music')),
                      ],
                      onChanged: (v) => setModal(() => music = v),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setModal(() {
                                verified = false;
                                ageMin = null;
                                ageMax = null;
                                useDistance = false;
                                dist = 75;
                                drink = null;
                                smoke = null;
                                music = null;
                                _hcpMinCtl.clear();
                                _hcpMaxCtl.clear();
                              });
                            },
                            child: const Text('Reset'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton(
                            onPressed: () {
                              final minS = _hcpMinCtl.text.trim();
                              final maxS = _hcpMaxCtl.text.trim();
                              final hMin = minS.isEmpty ? null : double.tryParse(minS);
                              final hMax = maxS.isEmpty ? null : double.tryParse(maxS);
                              if (minS.isNotEmpty && hMin == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Min handicap is not a valid number'),
                                  ),
                                );
                                return;
                              }
                              if (maxS.isNotEmpty && hMax == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Max handicap is not a valid number'),
                                  ),
                                );
                                return;
                              }
                              if (hMin != null && (hMin < -10 || hMin > 60)) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Min handicap must be between -10 and 60'),
                                  ),
                                );
                                return;
                              }
                              if (hMax != null && (hMax < -10 || hMax > 60)) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Max handicap must be between -10 and 60'),
                                  ),
                                );
                                return;
                              }
                              if (hMin != null && hMax != null && hMin > hMax) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Min handicap must be ≤ max'),
                                  ),
                                );
                                return;
                              }
                              setState(() {
                                _verifiedOnly = verified;
                                _ageMin = ageMin;
                                _ageMax = ageMax;
                                _distanceKm = useDistance ? (dist ?? 75) : null;
                                _handicapMin = hMin;
                                _handicapMax = hMax;
                                _drinking = drink;
                                _smoking = smoke;
                                _music = music;
                              });
                              Navigator.pop(ctx);
                              _load();
                            },
                            child: const Text('Apply'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  bool get _hasActiveFilters =>
      _verifiedOnly ||
      _ageMin != null ||
      _ageMax != null ||
      _distanceKm != null ||
      _handicapMin != null ||
      _handicapMax != null ||
      (_drinking != null && _drinking!.isNotEmpty) ||
      (_smoking != null && _smoking!.isNotEmpty) ||
      (_music != null && _music!.isNotEmpty);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover'),
        actions: [
          if (_hasActiveFilters)
            TextButton(
              onPressed: () {
                setState(() {
                  _verifiedOnly = false;
                  _ageMin = null;
                  _ageMax = null;
                  _distanceKm = null;
                  _handicapMin = null;
                  _handicapMax = null;
                  _hcpMinCtl.clear();
                  _hcpMaxCtl.clear();
                  _drinking = null;
                  _smoking = null;
                  _music = null;
                });
                _load();
              },
              child: const Text('Clear'),
            ),
          IconButton(
            icon: Badge(
              isLabelVisible: _hasActiveFilters,
              smallSize: 8,
              child: const Icon(Icons.tune_rounded),
            ),
            tooltip: 'Filters',
            onPressed: _openFilters,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      AppErrorInline(message: _error!),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  )
                : _items.isEmpty
                    ? ListView(
                        children: const [
                          AppEmptyState(
                            icon: Icons.golf_course_outlined,
                            title: 'No golfers match right now',
                            subtitle: 'Loosen filters or check back later.',
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, i) {
                          final it = _items[i];
                          final profile = it.profile;
                          final photos = it.photos;
                          final thumb = photos.primaryOrFirst;
                          final verified = profile?.isGHINVerified == true;
                          final name = profile?.displayName ?? it.username ?? 'Golfer';
                          final meta = [
                            if (profile?.city != null && profile!.city!.trim().isNotEmpty)
                              profile.city!.trim(),
                            if (profile?.handicap != null) 'HCP ${profile!.handicap}',
                            if (profile?.age != null) 'Age ${profile!.age}',
                          ].join(' · ');

                          return Material(
                            color: Colors.white,
                            elevation: 1,
                            shadowColor: Colors.black.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(18),
                            child: InkWell(
                              onTap: () {},
                              borderRadius: BorderRadius.circular(18),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(14),
                                      child: SizedBox(
                                        width: 72,
                                        height: 72,
                                        child: thumb != null
                                            ? Image.network(
                                                resolveMediaUrl(thumb.imageUrl),
                                                fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) =>
                                                    _photoFallback(),
                                              )
                                            : _photoFallback(),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Flexible(
                                                child: Text(
                                                  name,
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .titleMedium,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              if (verified) ...[
                                                const SizedBox(width: 6),
                                                const Icon(
                                                  Icons.verified_rounded,
                                                  size: 20,
                                                  color: AppColors.verified,
                                                ),
                                              ],
                                            ],
                                          ),
                                          if (meta.isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              meta,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall,
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    Icon(
                                      Icons.chevron_right_rounded,
                                      color: AppColors.outlineMuted,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  Widget _photoFallback() {
    return ColoredBox(
      color: AppColors.surfaceContainer,
      child: Icon(Icons.person_rounded, color: AppColors.outlineMuted, size: 36),
    );
  }
}
