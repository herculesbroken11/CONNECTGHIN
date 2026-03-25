import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/messaging/domain/conversation_models.dart';

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  List<ConversationItem> _items = [];
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
      final list = await ref.read(messagingRepositoryProvider).conversations();
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
      appBar: AppBar(title: const Text('Messages')),
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
                          Center(child: Text('No conversations yet.')),
                        ],
                      )
                    : ListView.builder(
                        itemCount: _items.length,
                        itemBuilder: (context, i) {
                          final row = _items[i];
                          final cid = row.conversationId;
                          final other = row.otherUser;
                          final last = row.lastMessage;
                          final unread = row.unreadCount;
                          final name = other?.profile?.displayName ?? other?.username;
                          final time = last != null
                              ? DateFormat.MMMd().add_jm().format(last.createdAt)
                              : '';
                          return ListTile(
                            title: Text(name ?? 'Chat'),
                            subtitle: Text(last?.body ?? ''),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(time, style: Theme.of(context).textTheme.labelSmall),
                                if (unread > 0)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: CircleAvatar(
                                      radius: 10,
                                      child: Text(
                                        '$unread',
                                        style: const TextStyle(fontSize: 10),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            onTap: () => context.push('/chat/$cid'),
                          );
                        },
                      ),
      ),
    );
  }
}
