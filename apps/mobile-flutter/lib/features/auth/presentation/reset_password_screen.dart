import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/features/auth/application/auth_providers.dart';
import 'package:connectghin/features/auth/domain/auth_dtos.dart';

/// Paste the full reset token from email: `uuid.secret` (one dot).
class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key, this.initialToken});

  final String? initialToken;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  late final TextEditingController _token;
  final _password = TextEditingController();
  final _password2 = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _token = TextEditingController(text: widget.initialToken ?? '');
  }

  @override
  void dispose() {
    _token.dispose();
    _password.dispose();
    _password2.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final t = _token.text.trim();
    final p1 = _password.text;
    final p2 = _password2.text;
    if (t.isEmpty) {
      setState(() {
        _error = 'Paste the reset token from your email.';
        _busy = false;
      });
      return;
    }
    if (t.indexOf('.') <= 0) {
      setState(() {
        _error =
            'Token should look like two parts separated by a dot (from the reset link).';
        _busy = false;
      });
      return;
    }
    if (p1.length < 8) {
      setState(() {
        _error = 'Password must be at least 8 characters.';
        _busy = false;
      });
      return;
    }
    if (p1 != p2) {
      setState(() {
        _error = 'Passwords do not match.';
        _busy = false;
      });
      return;
    }
    try {
      await ref.read(authRepositoryProvider).resetPassword(
            ResetPasswordRequestDto(token: t, newPassword: p1),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password updated. You can sign in.')),
      );
      context.go('/login');
    } on DioException catch (e) {
      setState(() => _error = formatApiError(e));
    } catch (e) {
      setState(() => _error = formatApiError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Set new password')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Use the full token from your reset email (or dev logs). '
            'It contains a dot: uuid… . secret…',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _token,
            decoration: const InputDecoration(
              labelText: 'Reset token',
              hintText: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.your-secret',
            ),
            autocorrect: false,
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _password,
            decoration: const InputDecoration(
              labelText: 'New password',
              helperText: 'Uppercase, lowercase, and a number',
            ),
            obscureText: true,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password2,
            decoration: const InputDecoration(labelText: 'Confirm password'),
            obscureText: true,
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy ? 'Saving…' : 'Update password'),
          ),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Back to login'),
          ),
        ],
      ),
    );
  }
}
