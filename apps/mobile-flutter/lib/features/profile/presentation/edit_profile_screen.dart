import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:connectghin/core/theme/app_colors.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';
import 'package:connectghin/features/profile/presentation/widgets/profile_photo_slot.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _display = TextEditingController();
  final _bio = TextEditingController();
  final _city = TextEditingController();
  final _age = TextEditingController();
  final _handicap = TextEditingController();
  String _drinking = 'SOCIAL';
  String _smoking = 'NO';
  String _music = 'ANY';
  bool _loading = true;
  bool _saving = false;
  bool _uploadingPhoto = false;
  bool _locating = false;
  ProfilePhoto? _previewPhoto;
  double? _savedLocationLat;
  double? _savedLocationLng;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _display.dispose();
    _bio.dispose();
    _city.dispose();
    _age.dispose();
    _handicap.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final me = await ref.read(profileRepositoryProvider).getMe();
      final profile = me.profile;
      _display.text = profile?.displayName ?? '';
      _bio.text = profile?.bio ?? '';
      _city.text = profile?.city ?? '';
      _age.text = profile?.age?.toString() ?? '';
      _handicap.text = profile?.handicap?.toString() ?? '';
      _drinking = profile?.drinkingPreference ?? 'SOCIAL';
      _smoking = profile?.smokingPreference ?? 'NO';
      _music = profile?.musicPreference ?? 'ANY';
      _previewPhoto = me.profilePhotos.primaryOrFirst;
      _savedLocationLat = profile?.locationLat;
      _savedLocationLng = profile?.locationLng;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_previewPhoto == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile photo is required')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final handicap = double.parse(_handicap.text.trim());
      final patch = <String, dynamic>{
        'displayName': _display.text.trim(),
        'bio': _bio.text.trim(),
        'city': _city.text.trim(),
        'handicap': handicap,
        'drinkingPreference': _drinking,
        'smokingPreference': _smoking,
        'musicPreference': _music,
      };
      final ageStr = _age.text.trim();
      if (ageStr.isNotEmpty) {
        final a = int.tryParse(ageStr);
        if (a != null) patch['age'] = a;
      }
      await ref.read(profileRepositoryProvider).updateProfile(patch);
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _useMyLocation() async {
    setState(() => _locating = true);
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location permission is required to use this feature'),
            ),
          );
        }
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      await ref.read(profileRepositoryProvider).updateProfile({
        'locationLat': pos.latitude,
        'locationLng': pos.longitude,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location saved for distance matching')),
        );
        await _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _pickPhoto() async {
    final pick = ImagePicker();
    final x = await pick.pickImage(source: ImageSource.gallery, maxWidth: 1600);
    if (x == null) return;
    final bytes = await x.readAsBytes();
    setState(() => _uploadingPhoto = true);
    try {
      final uploaded =
          await ref.read(profileRepositoryProvider).uploadPhoto(bytes, x.name);
      if (!mounted) return;
      setState(() => _previewPhoto = uploaded);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Photo uploaded')),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(8, 44, 20, 24),
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryHeaderGradient,
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        IconButton(
                          onPressed: () => context.pop(),
                          icon: const Icon(Icons.arrow_back_ios_new_rounded),
                          color: AppColors.onPrimary,
                        ),
                        Text(
                          'Edit profile',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                color: AppColors.onPrimary,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Keep your info current so partners know what to expect on the course.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.onPrimary.withValues(alpha: 0.88),
                              ),
                        ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: Form(
                    key: _formKey,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                      children: [
                ProfilePhotoSlot(photo: _previewPhoto),
                const SizedBox(height: 12),
                FilledButton.tonal(
                  onPressed: _uploadingPhoto ? null : _pickPhoto,
                  child: Text(
                    _uploadingPhoto
                        ? 'Uploading…'
                        : (_previewPhoto == null
                            ? 'Add profile photo'
                            : 'Change profile photo'),
                  ),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _display,
                  decoration:
                      const InputDecoration(labelText: 'Display name *'),
                  validator: (v) {
                    final t = (v ?? '').trim();
                    if (t.length < 2) return 'Display name is too short';
                    if (t.length > 120) return 'Display name is too long';
                    return null;
                  },
                ),
                TextFormField(
                  controller: _bio,
                  decoration: const InputDecoration(labelText: 'Bio *'),
                  maxLines: 4,
                  validator: (v) {
                    final t = (v ?? '').trim();
                    if (t.isEmpty) return 'Bio is required';
                    if (t.length > 2000) return 'Bio is too long';
                    return null;
                  },
                ),
                TextFormField(
                  controller: _city,
                  decoration: const InputDecoration(labelText: 'City *'),
                  validator: (v) {
                    final t = (v ?? '').trim();
                    if (t.isEmpty) return 'City is required';
                    if (t.length > 120) return 'City is too long';
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: (_saving || _locating) ? null : _useMyLocation,
                  icon: _locating
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.my_location_rounded),
                  label: Text(_locating ? 'Getting location…' : 'Use my location'),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    _savedLocationLat != null && _savedLocationLng != null
                        ? 'Saved location: ${_savedLocationLat!.toStringAsFixed(4)}, ${_savedLocationLng!.toStringAsFixed(4)}'
                        : 'Add coordinates so Discover distance filters work.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
                TextFormField(
                  controller: _age,
                  decoration: const InputDecoration(labelText: 'Age (optional)'),
                  keyboardType: TextInputType.number,
                  validator: (v) {
                    final t = (v ?? '').trim();
                    if (t.isEmpty) return null;
                    final n = int.tryParse(t);
                    if (n == null) return 'Enter a valid age';
                    if (n < 18 || n > 120) return 'Age must be 18–120';
                    return null;
                  },
                ),
                TextFormField(
                  controller: _handicap,
                  decoration: const InputDecoration(labelText: 'Handicap *'),
                  keyboardType: TextInputType.number,
                  validator: (v) {
                    final t = (v ?? '').trim();
                    if (t.isEmpty) return 'Handicap is required';
                    final n = double.tryParse(t);
                    if (n == null) return 'Enter a valid number';
                    if (n < -10 || n > 60) return 'Handicap looks invalid';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  key: ValueKey('edit_drinking_$_drinking'),
                  initialValue: _drinking,
                  items: const [
                    DropdownMenuItem(value: 'NO', child: Text('No drinking')),
                    DropdownMenuItem(value: 'SOCIAL', child: Text('Social')),
                    DropdownMenuItem(value: 'YES', child: Text('Yes')),
                  ],
                  onChanged: (v) => setState(() => _drinking = v ?? 'SOCIAL'),
                  decoration: const InputDecoration(labelText: 'Drinking'),
                ),
                DropdownButtonFormField<String>(
                  key: ValueKey('edit_smoking_$_smoking'),
                  initialValue: _smoking,
                  items: const [
                    DropdownMenuItem(value: 'NO', child: Text('No smoking')),
                    DropdownMenuItem(value: 'SOCIAL', child: Text('Social')),
                    DropdownMenuItem(value: 'YES', child: Text('Yes')),
                  ],
                  onChanged: (v) => setState(() => _smoking = v ?? 'NO'),
                  decoration: const InputDecoration(labelText: 'Smoking'),
                ),
                DropdownButtonFormField<String>(
                  key: ValueKey('edit_music_$_music'),
                  initialValue: _music,
                  items: const [
                    DropdownMenuItem(value: 'ANY', child: Text('Any')),
                    DropdownMenuItem(value: 'QUIET', child: Text('Quiet')),
                    DropdownMenuItem(value: 'MUSIC', child: Text('Music')),
                  ],
                  onChanged: (v) => setState(() => _music = v ?? 'ANY'),
                  decoration: const InputDecoration(labelText: 'On-course music'),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_saving ? 'Saving…' : 'Save'),
                ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
