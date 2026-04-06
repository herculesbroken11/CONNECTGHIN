import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/theme/app_colors.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(gradient: AppColors.primaryHeaderGradient),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 48),
                  Icon(Icons.sports_golf_rounded, size: 56, color: AppColors.onPrimary.withValues(alpha: 0.9)),
                  const SizedBox(height: 24),
                  Text(
                    'ConnectGHIN',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          color: AppColors.onPrimary,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Meet golfers. Plan rounds.\nPlay with people who fit your game.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.onPrimary.withValues(alpha: 0.88),
                          height: 1.45,
                        ),
                  ),
                  const Spacer(),
                  FilledButton(
                    onPressed: () => context.push('/register'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.onPrimary,
                      foregroundColor: AppColors.primary,
                      minimumSize: const Size.fromHeight(54),
                    ),
                    child: const Text('Create account'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: () => context.push('/login'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.onPrimary,
                      side: BorderSide(color: AppColors.onPrimary.withValues(alpha: 0.5)),
                      minimumSize: const Size.fromHeight(54),
                    ),
                    child: const Text('Log in'),
                  ),
                  const SizedBox(height: 36),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
