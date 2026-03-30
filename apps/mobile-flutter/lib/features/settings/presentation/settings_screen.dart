import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/notifications/push_notifications_service.dart';
import 'package:connectghin/features/auth/application/auth_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.workspace_premium_outlined),
            title: const Text('Membership'),
            onTap: () => context.push('/subscription'),
          ),
          ListTile(
            leading: const Icon(Icons.shield_outlined),
            title: const Text('Safety'),
            onTap: () => context.push('/safety'),
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Log out'),
            onTap: () async {
              await ref.read(pushNotificationsServiceProvider).unregisterCurrentToken();
              await ref.read(authRepositoryProvider).logout();
              await ref.read(pushNotificationsServiceProvider).stop();
              await ref.read(authSessionProvider).setAuthenticated(false);
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}
