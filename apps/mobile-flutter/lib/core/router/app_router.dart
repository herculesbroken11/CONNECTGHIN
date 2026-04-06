import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/features/auth/application/auth_providers.dart';
import 'package:connectghin/features/auth/presentation/forgot_password_screen.dart';
import 'package:connectghin/features/auth/presentation/reset_password_screen.dart';
import 'package:connectghin/features/auth/presentation/welcome_screen.dart';
import 'package:connectghin/features/auth/presentation/login_screen.dart';
import 'package:connectghin/features/auth/presentation/register_screen.dart';
import 'package:connectghin/features/home/presentation/main_shell_screen.dart';
import 'package:connectghin/features/matches/presentation/matches_screen.dart';
import 'package:connectghin/features/messaging/presentation/chat_screen.dart';
import 'package:connectghin/features/profile/presentation/create_profile_screen.dart';
import 'package:connectghin/features/profile/presentation/edit_profile_screen.dart';
import 'package:connectghin/features/subscriptions/presentation/subscription_screen.dart';
import 'package:connectghin/features/settings/presentation/settings_screen.dart';
import 'package:connectghin/features/safety/presentation/safety_screen.dart';
import 'package:connectghin/features/notifications/presentation/notifications_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final session = ref.watch(authSessionProvider);
  return GoRouter(
    initialLocation: '/',
    refreshListenable: session,
    redirect: (context, state) {
      final path = state.matchedLocation;
      final authPaths = {
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
      };
      if (!session.initialized) return null;
      final isAuthed = session.isAuthenticated;
      if (!isAuthed && path == '/onboarding/profile') return '/login';
      if (!isAuthed && !authPaths.contains(path)) return '/login';
      if (isAuthed && authPaths.contains(path)) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/forgot-password',
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => ResetPasswordScreen(
          initialToken: state.uri.queryParameters['token'],
        ),
      ),
      GoRoute(path: '/home', builder: (_, __) => const MainShellScreen()),
      GoRoute(path: '/matches', builder: (_, __) => const MatchesScreen()),
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/chat/:cid',
        builder: (context, state) =>
            ChatScreen(conversationId: state.pathParameters['cid']!),
      ),
      GoRoute(
        path: '/onboarding/profile',
        builder: (_, __) => const CreateProfileScreen(),
      ),
      GoRoute(path: '/profile/edit', builder: (_, __) => const EditProfileScreen()),
      GoRoute(path: '/subscription', builder: (_, __) => const SubscriptionScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/safety', builder: (_, __) => const SafetyScreen()),
    ],
    errorBuilder: (context, state) =>
        Scaffold(body: Center(child: Text(state.error.toString()))),
  );
});
