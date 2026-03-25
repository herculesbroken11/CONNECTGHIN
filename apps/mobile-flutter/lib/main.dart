import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/core/notifications/push_notifications_service.dart';
import 'package:connectghin/core/router/app_router.dart';
import 'package:connectghin/core/theme/app_theme.dart';
import 'package:connectghin/features/auth/application/auth_providers.dart';
import 'package:connectghin/features/auth/application/auth_session_controller.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: ConnectGHINApp()));
}

class ConnectGHINApp extends ConsumerStatefulWidget {
  const ConnectGHINApp({super.key});

  @override
  ConsumerState<ConnectGHINApp> createState() => _ConnectGHINAppState();
}

class _ConnectGHINAppState extends ConsumerState<ConnectGHINApp> {
  @override
  void initState() {
    super.initState();
    ref.listenManual<AuthSessionController>(authSessionProvider, (
      _,
      next,
    ) async {
      await _handleSessionChange(next);
    });
    Future.microtask(() async {
      await _handleSessionChange(ref.read(authSessionProvider));
    });
  }

  Future<void> _handleSessionChange(AuthSessionController session) async {
    final push = ref.read(pushNotificationsServiceProvider);
    if (!session.initialized) return;
    if (session.isAuthenticated) {
      await push.ensureRegistered();
    } else {
      await push.stop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'ConnectGHIN',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
