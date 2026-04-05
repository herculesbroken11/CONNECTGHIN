import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';

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
  final _handicap = TextEditingController();
  String _drinking = 'SOCIAL';
  String _smoking = 'NO';
  String _music = 'ANY';
  bool _loading = true;
  bool _saving = false;

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
      _handicap.text = profile?.handicap?.toString() ?? '';
      _drinking = profile?.drinkingPreference ?? 'SOCIAL';
      _smoking = profile?.smokingPreference ?? 'NO';
      _music = profile?.musicPreference ?? 'ANY';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    try {
      final handicap = _handicap.text.trim().isNotEmpty
          ? double.tryParse(_handicap.text.trim())
          : null;
      if (_handicap.text.trim().isNotEmpty && handicap == null) {
        throw StateError('Handicap must be a number');
      }
      await ref.read(profileRepositoryProvider).updateProfile({
        'displayName': _display.text.trim(),
        'bio': _bio.text.trim(),
        'city': _city.text.trim(),
        'drinkingPreference': _drinking,
        'smokingPreference': _smoking,
        'musicPreference': _music,
        if (handicap != null) 'handicap': handicap,
      });
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

  Future<void> _pickPhoto() async {
    final pick = ImagePicker();
    final x = await pick.pickImage(source: ImageSource.gallery, maxWidth: 1600);
    if (x == null) return;
    final bytes = await x.readAsBytes();
    try {
      await ref.read(profileRepositoryProvider).uploadPhoto(bytes, x.name);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo uploaded')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                FilledButton.tonal(
                  onPressed: _pickPhoto,
                  child: const Text('Add profile photo'),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _display,
                  decoration: const InputDecoration(labelText: 'Display name'),
                  validator: (v) {
                    final t = (v ?? '').trim();
                    if (t.length < 2) return 'Display name is too short';
                    if (t.length > 120) return 'Display name is too long';
                    return null;
                  },
                ),
                TextFormField(
                  controller: _bio,
                  decoration: const InputDecoration(labelText: 'Bio'),
                  maxLines: 4,
                  validator: (v) =>
                      (v != null && v.length > 2000) ? 'Bio is too long' : null,
                ),
                TextFormField(
                  controller: _city,
                  decoration: const InputDecoration(labelText: 'City'),
                  validator: (v) =>
                      (v != null && v.length > 120) ? 'City is too long' : null,
                ),
                TextFormField(
                  controller: _handicap,
                  decoration: const InputDecoration(labelText: 'Handicap'),
                  keyboardType: TextInputType.number,
                  validator: (v) {
                    final t = (v ?? '').trim();
                    if (t.isEmpty) return null;
                    final n = double.tryParse(t);
                    if (n == null) return 'Enter a valid number';
                    if (n < -10 || n > 60) return 'Handicap looks invalid';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _drinking,
                  items: const [
                    DropdownMenuItem(value: 'NO', child: Text('No drinking')),
                    DropdownMenuItem(value: 'SOCIAL', child: Text('Social')),
                    DropdownMenuItem(value: 'YES', child: Text('Yes')),
                  ],
                  onChanged: (v) => setState(() => _drinking = v ?? 'SOCIAL'),
                  decoration: const InputDecoration(labelText: 'Drinking'),
                ),
                DropdownButtonFormField<String>(
                  value: _smoking,
                  items: const [
                    DropdownMenuItem(value: 'NO', child: Text('No smoking')),
                    DropdownMenuItem(value: 'SOCIAL', child: Text('Social')),
                    DropdownMenuItem(value: 'YES', child: Text('Yes')),
                  ],
                  onChanged: (v) => setState(() => _smoking = v ?? 'NO'),
                  decoration: const InputDecoration(labelText: 'Smoking'),
                ),
                DropdownButtonFormField<String>(
                  value: _music,
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
            )),
    );
  }
}
