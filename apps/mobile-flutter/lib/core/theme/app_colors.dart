import 'package:flutter/material.dart';

/// Golf-networking palette: deep fairway green, warm neutrals, subtle gold accent.
abstract final class AppColors {
  static const Color primary = Color(0xFF0D3D2E);
  static const Color primaryLight = Color(0xFF1B5E45);
  static const Color onPrimary = Color(0xFFFFFFFF);

  static const Color surface = Color(0xFFF8F7F4);
  static const Color surfaceContainer = Color(0xFFEEF1EC);
  static const Color surfaceContainerHigh = Color(0xFFE2E8E0);

  static const Color outlineMuted = Color(0xFF9AAA9E);
  static const Color onSurface = Color(0xFF1B1F1C);
  static const Color onSurfaceVariant = Color(0xFF4A524E);

  static const Color accent = Color(0xFFC4A35A);
  static const Color verified = Color(0xFF0E7490);

  static const LinearGradient primaryHeaderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0A3328), primaryLight],
  );
}
