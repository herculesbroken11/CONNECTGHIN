import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Bottom navigation index for [MainShellScreen] (0–4).
class MainShellTabIndex extends Notifier<int> {
  @override
  int build() => 0;

  void select(int index) {
    if (index < 0 || index > 4) return;
    state = index;
  }
}

final mainShellTabIndexProvider =
    NotifierProvider<MainShellTabIndex, int>(MainShellTabIndex.new);
