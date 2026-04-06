import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/theme/app_colors.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/core/util/media_url.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/matches/domain/match_models.dart';
import 'package:connectghin/shared/widgets/app_ui.dart';
import 'package:connectghin/shared/widgets/premium_upsell.dart';

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
    } on DioException catch (e) {
      if (!mounted) return;
      if (e.response?.statusCode == 403) {
        await showPremiumUpsell(
          context,
          message: formatApiError(e),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(formatApiError(e))),
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
      appBar: AppBar(
        title: const Text('Matches'),
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
                            icon: Icons.handshake_outlined,
                            title: 'No matches yet',
                            subtitle: 'Keep swiping on GHINder — matches appear here.',
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final row = _items[i];
                          final user = row.otherUser;
                          final url = user?.primaryPhoto?.imageUrl;
                          final displayName =
                              user?.profile?.displayName ?? user?.username ?? '';
                          final oid = user?.id;
                          return Material(
                            color: Colors.white,
                            elevation: 1,
                            shadowColor: Colors.black.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(16),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              leading: CircleAvatar(
                                radius: 28,
                                backgroundImage: url != null
                                    ? NetworkImage(resolveMediaUrl(url))
                                    : null,
                                backgroundColor: AppColors.surfaceContainer,
                                child: url == null
                                    ? Icon(Icons.person_rounded, color: AppColors.outlineMuted)
                                    : null,
                              ),
                              title: Text(
                                displayName.isNotEmpty ? displayName : 'Golfer',
                                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                              subtitle: const Text('Tap to message'),
                              trailing: const Icon(Icons.chat_bubble_outline_rounded),
                              onTap: () => _openChat(oid),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
