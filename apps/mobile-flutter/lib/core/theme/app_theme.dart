import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData light() {
    const fairway = Color(0xFF1B4332);
    const sand = Color(0xFFF4E9D8);
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: fairway,
        brightness: Brightness.light,
        primary: fairway,
        surface: sand,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        backgroundColor: fairway,
        foregroundColor: Colors.white,
      ),
    );
  }

  static ThemeData dark() {
    const fairway = Color(0xFF2D6A4F);
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: fairway,
        brightness: Brightness.dark,
        primary: fairway,
      ),
    );
  }
}
