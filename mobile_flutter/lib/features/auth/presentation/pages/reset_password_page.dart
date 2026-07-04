import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/blur_validated_field.dart';
import '../../../../shared/widgets/logo.dart';
import '../providers/auth_provider.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key});

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _oldPassCtl = TextEditingController();
  final _newPassCtl = TextEditingController();
  final _confirmNewPassCtl = TextEditingController();
  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _submitting = false;

  @override
  void dispose() {
    _oldPassCtl.dispose();
    _newPassCtl.dispose();
    _confirmNewPassCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      await ref
          .read(authStateProvider.notifier)
          .changePassword(
            oldPassword: _oldPassCtl.text,
            newPassword: _newPassCtl.text,
          );
      if (!mounted) return;
      AppToast.success(context, 'auth.change_password_success'.tr());
      context.go(RouteNames.home);
    } catch (e) {
      if (!mounted) return;
      final message =
          e is Exception
              ? e.toString().replaceFirst('Exception: ', '')
              : 'auth.change_password_failed'.tr();
      AppToast.error(context, message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('auth.change_password'.tr()),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).primaryColor,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(child: AlumverseLogo(size: 60)),
                const SizedBox(height: 32),
                Text(
                  'auth.change_password'.tr(),
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                BlurValidatedField(
                  controller: _oldPassCtl,
                  obscureText: _obscureOld,
                  validator:
                      (v) => Validators.required(
                        v,
                        field: 'auth.current_password'.tr(),
                      ),
                  decoration: InputDecoration(
                    labelText: 'auth.current_password'.tr(),
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureOld ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed:
                          () => setState(() => _obscureOld = !_obscureOld),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                BlurValidatedField(
                  controller: _newPassCtl,
                  obscureText: _obscureNew,
                  validator: Validators.password,
                  decoration: InputDecoration(
                    labelText: 'auth.new_password'.tr(),
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureNew ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed:
                          () => setState(() => _obscureNew = !_obscureNew),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                BlurValidatedField(
                  controller: _confirmNewPassCtl,
                  obscureText: _obscureConfirm,
                  validator:
                      (v) => Validators.confirmPassword(v, _newPassCtl.text),
                  decoration: InputDecoration(
                    labelText: 'auth.repeat_new_password'.tr(),
                    prefixIcon: const Icon(Icons.lock_clock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed:
                          () => setState(
                            () => _obscureConfirm = !_obscureConfirm,
                          ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'auth.skip_change_password'.tr(),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child:
                      _submitting
                          ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                          : Text(
                            'auth.change_password'.tr(),
                            style: const TextStyle(fontSize: 16),
                          ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => context.go(RouteNames.home),
                    child: Text(
                      'auth.go_home'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
