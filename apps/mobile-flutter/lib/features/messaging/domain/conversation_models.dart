import 'package:connectghin/features/profile/domain/user_profile_models.dart';

class LastMessageSummary {
  const LastMessageSummary({
    required this.id,
    required this.body,
    required this.senderId,
    required this.createdAt,
  });

  final String id;
  final String body;
  final String senderId;
  final DateTime createdAt;

  factory LastMessageSummary.fromJson(Map<String, dynamic> json) {
    return LastMessageSummary(
      id: json['id'] as String,
      body: json['body'] as String? ?? '',
      senderId: json['senderId'] as String,
      createdAt: DateTime.parse(json['createdAt'].toString()).toLocal(),
    );
  }
}

class OtherUserSummary {
  const OtherUserSummary({
    required this.id,
    required this.username,
    this.profile,
    this.primaryPhoto,
  });

  final String id;
  final String username;
  final UserProfile? profile;
  final ProfilePhoto? primaryPhoto;

  factory OtherUserSummary.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      throw ArgumentError('otherUser JSON is null');
    }
    final photo = json['primaryPhoto'];
    return OtherUserSummary(
      id: json['id'] as String,
      username: json['username'] as String? ?? '',
      profile: UserProfile.tryParse(json['profile'] as Map<String, dynamic>?),
      primaryPhoto: photo is Map
          ? ProfilePhoto.fromJson(Map<String, dynamic>.from(photo))
          : null,
    );
  }

  static OtherUserSummary? tryParse(Map<String, dynamic>? json) {
    if (json == null) return null;
    try {
      return OtherUserSummary.fromJson(json);
    } catch (_) {
      return null;
    }
  }
}

class ConversationItem {
  const ConversationItem({
    required this.conversationId,
    required this.updatedAt,
    this.otherUser,
    this.lastMessage,
    required this.unreadCount,
  });

  final String conversationId;
  final DateTime updatedAt;
  final OtherUserSummary? otherUser;
  final LastMessageSummary? lastMessage;
  final int unreadCount;

  factory ConversationItem.fromJson(Map<String, dynamic> json) {
    final last = json['lastMessage'];
    return ConversationItem(
      conversationId: json['conversationId'] as String,
      updatedAt: DateTime.parse(json['updatedAt'].toString()).toLocal(),
      otherUser: OtherUserSummary.tryParse(
        json['otherUser'] as Map<String, dynamic>?,
      ),
      lastMessage: last is Map
          ? LastMessageSummary.fromJson(Map<String, dynamic>.from(last))
          : null,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class ConversationsPage {
  const ConversationsPage({required this.items});

  final List<ConversationItem> items;

  factory ConversationsPage.fromJson(Map<String, dynamic> json) {
    final raw = json['items'] as List<dynamic>? ?? [];
    return ConversationsPage(
      items: raw
          .map(
            (e) => ConversationItem.fromJson(
              Map<String, dynamic>.from(e as Map),
            ),
          )
          .toList(),
    );
  }
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.body,
    required this.createdAt,
    this.messageType,
  });

  final String id;
  final String conversationId;
  final String senderId;
  final String body;
  final DateTime createdAt;
  final String? messageType;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      body: json['body'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'].toString()).toLocal(),
      messageType: json['messageType'] as String?,
    );
  }

  static ChatMessage? tryFromDynamic(Object? data) {
    if (data is! Map) return null;
    try {
      return ChatMessage.fromJson(Map<String, dynamic>.from(data));
    } catch (_) {
      return null;
    }
  }
}

class MessagesPage {
  const MessagesPage({required this.items, this.nextCursor});

  final List<ChatMessage> items;
  final String? nextCursor;

  factory MessagesPage.fromJson(Map<String, dynamic> json) {
    final raw = json['items'] as List<dynamic>? ?? [];
    return MessagesPage(
      items: raw
          .map(
            (e) => ChatMessage.fromJson(Map<String, dynamic>.from(e as Map)),
          )
          .toList(),
      nextCursor: json['nextCursor'] as String?,
    );
  }
}

class ConversationStartResult {
  const ConversationStartResult({
    required this.conversationId,
    required this.created,
  });

  final String conversationId;
  final bool created;

  factory ConversationStartResult.fromJson(Map<String, dynamic> json) {
    return ConversationStartResult(
      conversationId: json['conversationId'] as String,
      created: json['created'] as bool? ?? false,
    );
  }
}
