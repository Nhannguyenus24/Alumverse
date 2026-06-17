import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/logo.dart';
import '../providers/auth_provider.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameCtl = TextEditingController();
  final _studentIdCtl = TextEditingController();
  final _emailCtl = TextEditingController();
  final _passCtl = TextEditingController();
  final _confirmPassCtl = TextEditingController();
  final _passFocus = FocusNode();
  String? _selectedYear;
  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _submitting = false;
  bool _passFocused = false;

  final List<String> _years = List.generate(
    20,
    (index) => (DateTime.now().year - index).toString(),
  );

  @override
  void initState() {
    super.initState();
    _passFocus.addListener(() {
      setState(() => _passFocused = _passFocus.hasFocus);
    });
    _passCtl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _fullNameCtl.dispose();
    _studentIdCtl.dispose();
    _emailCtl.dispose();
    _passCtl.dispose();
    _confirmPassCtl.dispose();
    _passFocus.dispose();
    super.dispose();
  }

  // Password requirements (mirrors the web RegisterPage rules).
  Map<String, bool> get _passwordRules {
    final v = _passCtl.text;
    return {
      'Tối thiểu 8 ký tự': v.length >= 8,
      'Ít nhất 1 chữ viết hoa (A-Z)': RegExp(r'[A-Z]').hasMatch(v),
      'Ít nhất 1 chữ viết thường (a-z)': RegExp(r'[a-z]').hasMatch(v),
      'Ít nhất 1 chữ số (0-9)': RegExp(r'\d').hasMatch(v),
      'Ít nhất 1 ký tự đặc biệt (@\$!%*?&)':
          RegExp(r'[@$!%*?&]').hasMatch(v),
    };
  }

  bool get _allRulesMet => _passwordRules.values.every((met) => met);

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final email = _emailCtl.text.trim();
    setState(() => _submitting = true);
    try {
      final notifier = ref.read(authStateProvider.notifier);
      // Step 1: create the (inactive) account.
      await notifier.register(
        email: email,
        studentId: _studentIdCtl.text.trim(),
        fullName: _fullNameCtl.text.trim(),
        password: _passCtl.text,
      );
      // Step 2: send the OTP so the verification screen is ready.
      await notifier.sendOtp(email);

      if (!mounted) return;
      context.push(RouteNames.signupCode, extra: email);
    } catch (e) {
      if (!mounted) return;
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Đăng ký thất bại';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đăng ký'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).primaryColor,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(child: AlumverseLogo(size: 60)),
                const SizedBox(height: 32),
                Text(
                  'Tạo tài khoản mới',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).primaryColor,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _fullNameCtl,
                  validator: (v) => Validators.required(v, field: 'Họ và tên'),
                  decoration: const InputDecoration(
                    labelText: 'Họ và tên',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _studentIdCtl,
                  validator: Validators.studentId,
                  decoration: const InputDecoration(
                    labelText: 'Mã số sinh viên',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedYear,
                  items: _years
                      .map((y) => DropdownMenuItem(value: y, child: Text(y)))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedYear = v),
                  validator: (v) => Validators.required(v, field: 'Năm nhập học'),
                  decoration: const InputDecoration(
                    labelText: 'Năm nhập học',
                    prefixIcon: Icon(Icons.calendar_today_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emailCtl,
                  validator: Validators.email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passCtl,
                  focusNode: _passFocus,
                  obscureText: _obscurePass,
                  validator: Validators.password,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePass ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () => setState(() => _obscurePass = !_obscurePass),
                    ),
                  ),
                ),
                // Password requirements: shown only while the password field
                // is focused and not all rules are met yet (matches web, but
                // placed below the field instead of beside it).
                AnimatedSize(
                  duration: const Duration(milliseconds: 150),
                  child: (_passFocused && !_allRulesMet)
                      ? _PasswordRules(rules: _passwordRules)
                      : const SizedBox.shrink(),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPassCtl,
                  obscureText: _obscureConfirm,
                  validator: (v) => Validators.confirmPassword(v, _passCtl.text),
                  decoration: InputDecoration(
                    labelText: 'Nhập lại mật khẩu',
                    prefixIcon: const Icon(Icons.lock_clock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () =>
                          setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Tiếp tục', style: TextStyle(fontSize: 16)),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Bạn đã có tài khoản?'),
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text(
                        'Đăng nhập ngay!',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Live password-requirement checklist shown below the password field.
class _PasswordRules extends StatelessWidget {
  const _PasswordRules({required this.rules});

  final Map<String, bool> rules;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).dividerColor),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Yêu cầu mật khẩu:',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          const SizedBox(height: 6),
          ...rules.entries.map(
            (e) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Icon(
                    e.value ? Icons.check_circle : Icons.cancel,
                    size: 16,
                    color: e.value
                        ? const Color(0xFF00A500)
                        : const Color(0xFFE70000),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      e.key,
                      style: TextStyle(
                        fontSize: 12.5,
                        color: e.value
                            ? const Color(0xFF00A500)
                            : const Color(0xFFE70000),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
