import 'package:dio/dio.dart';
import 'package:connectghin/features/messaging/domain/conversation_models.dart';

class MessagingRepository {
  MessagingRepository(this._dio);
  final Dio _dio;

  Future<List<ConversationItem>> conversations() async {
    final res = await _dio.get<Map<String, dynamic>>('/conversations');
    return ConversationsPage.fromJson(
      Map<String, dynamic>.from(res.data ?? {}),
    ).items;
  }

  Future<ConversationStartResult> startConversation(String otherUserId) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/conversations/start',
      data: {'otherUserId': otherUserId},
    );
    return ConversationStartResult.fromJson(
      Map<String, dynamic>.from(res.data ?? {}),
    );
  }

  Future<List<ChatMessage>> messages(
    String conversationId, {
    String? cursor,
  }) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/conversations/$conversationId/messages',
      queryParameters: {if (cursor != null) 'cursor': cursor},
    );
    return MessagesPage.fromJson(
      Map<String, dynamic>.from(res.data ?? {}),
    ).items;
  }

  Future<void> sendMessage(String conversationId, String body) async {
    await _dio.post('/conversations/$conversationId/messages', data: {
      'body': body,
    });
  }

  Future<void> markRead(String conversationId) async {
    await _dio.patch('/conversations/$conversationId/read');
  }
}
