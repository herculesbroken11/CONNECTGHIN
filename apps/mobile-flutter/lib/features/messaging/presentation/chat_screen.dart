import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/network/providers.dart';
import 'package:connectghin/core/util/socket_util.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/auth/application/auth_providers.dart';
import 'package:connectghin/features/messaging/domain/conversation_models.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.conversationId});

  final String conversationId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _text = TextEditingController();
  final _scroll = ScrollController();
  List<ChatMessage> _messages = [];
  bool _loading = true;
  Timer? _poll;
  io.Socket? _socket;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      await _load();
      await _connectSocket();
      _poll = Timer.periodic(const Duration(seconds: 8), (_) => _load(silent: true));
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    _disconnectSocket();
    _text.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _disconnectSocket() {
    final s = _socket;
    _socket = null;
    if (s != null) {
      s.disconnect();
      s.dispose();
    }
  }

  Future<void> _connectSocket() async {
    if (!mounted) return;
    _disconnectSocket();
    final t = await ref.read(tokenStoreProvider).access;
    if (t == null || !mounted) return;
    final socket = io.io(
      chatSocketUrl(),
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': 'Bearer $t'})
          .enableForceNew()
          .enableReconnection()
          .build(),
    );
    _socket = socket;
    socket.onConnect((_) {
      socket.emit('join', {'conversationId': widget.conversationId});
    });
    socket.on('message', (data) {
      final m = ChatMessage.tryFromDynamic(data);
      if (!mounted || m == null) return;
      setState(() {
        if (!_messages.any((x) => x.id == m.id)) {
          _messages.add(m);
        }
      });
      _scrollToEnd();
    });
    socket.connect();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent && mounted) setState(() => _loading = true);
    try {
      final list = await ref
          .read(messagingRepositoryProvider)
          .messages(widget.conversationId);
      if (mounted) {
        setState(() => _messages = list);
        await ref
            .read(messagingRepositoryProvider)
            .markRead(widget.conversationId);
      }
    } finally {
      if (mounted && !silent) setState(() => _loading = false);
      _scrollToEnd();
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  Future<void> _send() async {
    final body = _text.text.trim();
    if (body.isEmpty) return;
    _text.clear();
    try {
      await ref
          .read(messagingRepositoryProvider)
          .sendMessage(widget.conversationId, body);
      await _load(silent: true);
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
    ref.listen<int>(accessTokenRefreshSignalProvider, (previous, next) {
      if (previous != null && next != previous && mounted) {
        unawaited(_connectSocket());
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Chat')),
      body: Column(
        children: [
          Expanded(
            child: _loading && _messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.all(12),
                    itemCount: _messages.length,
                    itemBuilder: (context, i) {
                      final m = _messages[i];
                      final body = m.body;
                      final at = DateFormat.jm().format(m.createdAt);
                      return Align(
                        alignment: Alignment.centerLeft,
                        child: Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(body),
                                Text(at, style: Theme.of(context).textTheme.labelSmall),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _text,
                      decoration: const InputDecoration(
                        hintText: 'Message',
                        border: OutlineInputBorder(),
                      ),
                      minLines: 1,
                      maxLines: 4,
                    ),
                  ),
                  IconButton(
                    onPressed: _send,
                    icon: const Icon(Icons.send),
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
