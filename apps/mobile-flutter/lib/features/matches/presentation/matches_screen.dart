import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/matches/domain/match_models.dart';

class MatchesScreen extends ConsumerStatefulWidget {
  const MatchesScreen({super.key});

  @override
  ConsumerState<MatchesScreen> createState() => _MatchesScreenState();
}

class _MatchesScreenState extends ConsumerState<MatchesScreen> {
  List<MatchListItem> _items = [];
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
      final list = await ref.read(matchesRepositoryProvider).listMatches();
      setState(() => _items = list);
    } catch (e) {
      setState(() => _error = formatApiError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openChat(String? otherUserId) async {
    if (otherUserId == null) return;
    try {
      final res =
          await ref.read(messagingRepositoryProvider).startConversation(otherUserId);
      if (mounted) context.push('/chat/${res.conversationId}');
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
      appBar: AppBar(title: const Text('Matches')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!))
                : _items.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 100),
                          Center(child: Text('No matches yet — keep swiping on GHINder.')),
                        ],
                      )
                    : ListView.builder(
                        itemCount: _items.length,
                        itemBuilder: (context, i) {
                          final row = _items[i];
                          final user = row.otherUser;
                          final url = user?.primaryPhoto?.imageUrl;
                          final displayName =
                              user?.profile?.displayName ?? user?.username ?? '';
                          final oid = user?.id;
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundImage: url != null
                                  ? NetworkImage(resolveMediaUrl(url))
                                  : null,
                              child: url == null ? const Icon(Icons.person) : null,
                            ),
                            title: Text(
                              displayName.isNotEmpty ? displayName : 'Golfer',
                            ),
                            subtitle: const Text('Tap to message'),
                            onTap: () => _openChat(oid),
                          );
                        },
                      ),
      ),
    );
  }
}
