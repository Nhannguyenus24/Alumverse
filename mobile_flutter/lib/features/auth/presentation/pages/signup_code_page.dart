import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/logo.dart';
import '../../../../shared/widgets/step_indicator.dart';
import '../providers/auth_provider.dart';

class SignupCodePage extends ConsumerStatefulWidget {
  final String email;

  const SignupCodePage({super.key, required this.email});

  @override
  ConsumerState<SignupCodePage> createState() => _SignupCodePageState();
}

class _SignupCodePageState extends ConsumerState<SignupCodePage> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(
    6,
    (_) => FocusNode(),
  );

  bool _verifying = false;
  bool _resending = false;

  @override
  void dispose() {
    for (var c in _controllers) {
      c.dispose();
    }
    for (var f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _onChanged(String value, int index) {
    if (value.length == 1 && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }

    // Auto-submit once all six digits are filled.
    if (!_verifying && _controllers.every((c) => c.text.isNotEmpty)) {
      _submit();
    }
  }

  Future<void> _submit() async {
    final otp = _controllers.map((c) => c.text).join();
    if (otp.length != 6) {
      AppToast.info(context, 'auth.enter_6_digits'.tr());
      return;
    }

    setState(() => _verifying = true);
    try {
      await ref
          .read(authStateProvider.notifier)
          .verifyOtp(email: widget.email, otp: otp);

      if (!mounted) return;
      AppToast.success(context, 'auth.verify_success'.tr());
      // Account is now active — go back to login.
      context.go(RouteNames.login);
    } catch (e) {
      if (!mounted) return;
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'auth.verify_failed'.tr();
      AppToast.error(context, message);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resend() async {
    setState(() => _resending = true);
    try {
      await ref.read(authStateProvider.notifier).sendOtp(widget.email);
      if (!mounted) return;
      AppToast.success(context, 'auth.resend_success'.tr());
    } catch (e) {
      if (!mounted) return;
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'auth.resend_failed'.tr();
      AppToast.error(context, message);
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('auth.verify_account'.tr()),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).primaryColor,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Center(child: AlumverseLogo(size: 80)),
              const SizedBox(height: 24),
              const StepIndicator(current: 2, total: 2),
              const SizedBox(height: 24),
              Text(
                'auth.enter_code'.tr(),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                'auth.verify_desc'.tr(namedArgs: {'email': widget.email}),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(
                  6,
                  (index) => SizedBox(
                    width: 45,
                    child: TextFormField(
                      controller: _controllers[index],
                      focusNode: _focusNodes[index],
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(1),
                      ],
                      onChanged: (v) => _onChanged(v, index),
                      decoration: InputDecoration(
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: _verifying ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _verifying
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text('common.next'.tr(),
                        style: const TextStyle(fontSize: 16)),
              ),
              const SizedBox(height: 24),
              Center(
                child: TextButton(
                  onPressed: _resending ? null : _resend,
                  child: Text(
                    _resending
                        ? 'auth.resending'.tr()
                        : 'auth.resend_code'.tr(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
