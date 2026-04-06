import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';

class SafetyScreen extends ConsumerStatefulWidget {
  const SafetyScreen({super.key});

  @override
  ConsumerState<SafetyScreen> createState() => _SafetyScreenState();
}

class _SafetyScreenState extends ConsumerState<SafetyScreen> {
  final _targetId = TextEditingController();
  final _reason = TextEditingController();
  final _details = TextEditingController();
  List<Map<String, dynamic>> _blocks = [];

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadBlocks);
  }

  @override
  void dispose() {
    _targetId.dispose();
    _reason.dispose();
    _details.dispose();
    super.dispose();
  }

  Future<void> _loadBlocks() async {
    try {
      final list = await ref.read(safetyRepositoryProvider).listBlocks();
      setState(() => _blocks = list);
    } catch (_) {}
  }

  Future<void> _submitReport() async {
    final id = _targetId.text.trim();
    if (id.isEmpty || _reason.text.trim().isEmpty) return;
    try {
      await ref.read(safetyRepositoryProvider).reportUser(
            targetUserId: id,
            reason: _reason.text.trim(),
            details: _details.text.trim().isEmpty ? null : _details.text.trim(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Report submitted')),
        );
        _reason.clear();
        _details.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
        );
      }
    }
  }

  Future<void> _unblock(String id) async {
    try {
      await ref.read(safetyRepositoryProvider).unblock(id);
      await _loadBlocks();
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
      appBar: AppBar(
        title: const Text('Safety'),
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
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        children: [
          Text(
            'Report a user',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _targetId,
            decoration: const InputDecoration(
              labelText: 'Target user ID (UUID)',
              prefixIcon: Icon(Icons.person_search_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reason,
            decoration: const InputDecoration(
              labelText: 'Reason',
              prefixIcon: Icon(Icons.flag_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _details,
            decoration: const InputDecoration(
              labelText: 'Details (optional)',
              alignLabelWithHint: true,
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _submitReport,
            child: const Text('Submit report'),
          ),
          const SizedBox(height: 32),
          Text(
            'Blocked users',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          if (_blocks.isEmpty)
            Text(
              'No blocked users.',
              style: Theme.of(context).textTheme.bodyMedium,
            )
          else
            ..._blocks.map((b) {
              final u = b['user'] as Map<String, dynamic>?;
              final id = b['blockedUserId'] as String?;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Material(
                  color: Colors.white,
                  elevation: 1,
                  shadowColor: Colors.black.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(14),
                  child: ListTile(
                    title: Text(u?['username']?.toString() ?? id ?? ''),
                    trailing: TextButton(
                      onPressed: id != null ? () => _unblock(id) : null,
                      child: const Text('Unblock'),
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}
