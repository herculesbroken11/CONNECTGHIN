import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/discovery/presentation/discovery_screen.dart';
import 'package:connectghin/features/ghinder/presentation/ghinder_screen.dart';
import 'package:connectghin/features/home/application/main_shell_tab_provider.dart';
import 'package:connectghin/features/home/presentation/home_tab_screen.dart';
import 'package:connectghin/features/messaging/presentation/inbox_screen.dart';
import 'package:connectghin/features/profile/presentation/profile_tab_screen.dart';

class MainShellScreen extends ConsumerStatefulWidget {
  const MainShellScreen({super.key});

  @override
  ConsumerState<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends ConsumerState<MainShellScreen> {
  bool _onboardingGateDone = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensureOnboarding());
  }

  Future<void> _ensureOnboarding() async {
    if (_onboardingGateDone) return;
    try {
      final me = await ref.read(profileRepositoryProvider).getMe();
      if (!mounted) return;
      _onboardingGateDone = true;
      if (me.needsProfileOnboarding) {
        context.go('/onboarding/profile');
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final index = ref.watch(mainShellTabIndexProvider);

    return Scaffold(
      body: IndexedStack(
        index: index,
        children: const [
          HomeTabScreen(),
          DiscoveryScreen(),
          GhinderScreen(),
          InboxScreen(),
          ProfileTabScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          ref.read(mainShellTabIndexProvider.notifier).select(i);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore_rounded),
            label: 'Discover',
          ),
          NavigationDestination(
            icon: Icon(Icons.swipe_right_alt_outlined),
            selectedIcon: Icon(Icons.swipe_right_alt_rounded),
            label: 'GHINder',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline_rounded),
            selectedIcon: Icon(Icons.chat_bubble_rounded),
            label: 'Messages',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
