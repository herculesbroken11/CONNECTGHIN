import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/discovery/presentation/discovery_screen.dart';
import 'package:connectghin/features/ghinder/presentation/ghinder_screen.dart';
import 'package:connectghin/features/matches/presentation/matches_screen.dart';
import 'package:connectghin/features/messaging/presentation/inbox_screen.dart';
import 'package:connectghin/features/profile/presentation/profile_tab_screen.dart';

class MainShellScreen extends ConsumerStatefulWidget {
  const MainShellScreen({super.key});

  @override
  ConsumerState<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends ConsumerState<MainShellScreen> {
  int _index = 0;
  bool _onboardingGateDone = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensureOnboarding());
  }

  /// Send users below the completion threshold to the dedicated onboarding flow.
  Future<void> _ensureOnboarding() async {
    if (_onboardingGateDone) return;
    try {
      final me = await ref.read(profileRepositoryProvider).getMe();
      if (!mounted) return;
      _onboardingGateDone = true;
      if (me.needsProfileOnboarding) {
        context.go('/onboarding/profile');
      }
    } catch (_) {
      // Leave gate open so a fresh navigation to /home can retry.
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [
          ProfileTabScreen(),
          DiscoveryScreen(),
          GhinderScreen(),
          MatchesScreen(),
          InboxScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search),
            label: 'Discover',
          ),
          NavigationDestination(
            icon: Icon(Icons.swipe_right_alt_outlined),
            selectedIcon: Icon(Icons.swipe_right_alt),
            label: 'GHINder',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_outline),
            selectedIcon: Icon(Icons.favorite),
            label: 'Matches',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: 'Chats',
          ),
        ],
      ),
      floatingActionButton: _index == 0
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/settings'),
              icon: const Icon(Icons.settings_outlined),
              label: const Text('Settings'),
            )
          : null,
    );
  }
}
