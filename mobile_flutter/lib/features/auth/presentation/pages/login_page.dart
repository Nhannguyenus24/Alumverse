import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/api_exception.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/blur_validated_field.dart';
import '../../../../shared/widgets/logo.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../providers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtl = TextEditingController();
  final _passCtl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtl.dispose();
    _passCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref
        .read(authStateProvider.notifier)
        .login(_emailCtl.text.trim(), _passCtl.text);

    if (!mounted) return;

    final auth = ref.read(authStateProvider);
    if (auth.hasError) {
      _showError(auth.error!);
    } else if (auth.valueOrNull?.isLoggedIn == true) {
      context.go(RouteNames.home);
    }
  }

  void _showError(Object e) {
    AppToast.fromStatus(context, _statusOf(e), _messageFrom(e));
  }

  int? _statusOf(Object e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).statusCode;
    }
    if (e is ApiException) return e.statusCode;
    return null;
  }

  /// Pull a human-readable message out of the error. The error interceptor
  /// wraps backend errors as [ApiException] inside a [DioException].
  String _messageFrom(Object e) {
    if (e is DioException) {
      final inner = e.error;
      if (inner is ApiException) return inner.message;
      return e.message ?? 'auth.login_failed'.tr();
    }
    if (e is ApiException) return e.message;
    return e.toString().replaceFirst('Exception: ', '');
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final loading = authState.isLoading;
    final orgName = ref.watch(organizationStateProvider).valueOrNull?.name;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(
                  child: AlumverseLogo(size: 72, full: false),
                ),
                const SizedBox(height: 32),
                Text(
                  'auth.login'.tr(),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (orgName != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    orgName,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 32),
                BlurValidatedField(
                  controller: _emailCtl,
                  validator: Validators.email,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'auth.email_or_student_id'.tr(),
                    hintText: 'auth.email_placeholder'.tr(),
                    prefixIcon: const Icon(Icons.person_outline),
                  ),
                ),
                const SizedBox(height: 16),
                BlurValidatedField(
                  controller: _passCtl,
                  obscureText: _obscure,
                  validator:
                      (v) =>
                          Validators.required(v, field: 'auth.password'.tr()),
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => loading ? null : _submit(),
                  decoration: InputDecoration(
                    labelText: 'auth.password'.tr(),
                    hintText: '••••••••',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscure ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push(RouteNames.forgotPassword),
                    child: Text('auth.forgot_password'.tr()),
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: loading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child:
                      loading
                          ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                          : Text(
                            'auth.login'.tr(),
                            style: const TextStyle(fontSize: 16),
                          ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'auth.or_continue_with'.tr(),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed:
                      loading
                          ? null
                          : () {
                            // TODO: Google Sign-In — gọi google_sign_in để lấy
                            // idToken rồi ref.read(authStateProvider.notifier)
                            // .loginWithGoogle(idToken).
                            AppToast.info(
                              context,
                              'auth.google_coming_soon'.tr(),
                            );
                          },
                  icon: const Icon(Icons.g_mobiledata, size: 30),
                  label: Text('auth.continue_with_google'.tr()),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('auth.no_account'.tr()),
                    TextButton(
                      onPressed: () => context.push(RouteNames.register),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.only(left: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        'auth.register_now'.tr(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () {
                    ref.read(organizationStateProvider.notifier).reset();
                  },
                  icon: const Icon(Icons.apartment_rounded, size: 18),
                  label: Text(
                    'auth.change_organization'.tr(),
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.divider),
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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
