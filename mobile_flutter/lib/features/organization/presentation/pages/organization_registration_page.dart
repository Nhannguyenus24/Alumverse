import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/logo.dart';

class OrganizationRegistrationPage extends ConsumerStatefulWidget {
  const OrganizationRegistrationPage({super.key});

  @override
  ConsumerState<OrganizationRegistrationPage> createState() =>
      _OrganizationRegistrationPageState();
}

class _OrganizationRegistrationPageState
    extends ConsumerState<OrganizationRegistrationPage> {
  final _formKey = GlobalKey<FormState>();
  final _studentCodeCtl = TextEditingController();
  final _programCtl = TextEditingController();
  final _majorCtl = TextEditingController();
  final _graduatedYearCtl = TextEditingController();

  @override
  void dispose() {
    _studentCodeCtl.dispose();
    _programCtl.dispose();
    _majorCtl.dispose();
    _graduatedYearCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    // TODO: Implement join organization logic
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đang xử lý đăng ký tổ chức...')),
    );
    
    context.go('/'); // Back to home/splash
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đăng ký tổ chức'),
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
                  'Thông tin học thuật',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).primaryColor,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Vui lòng cung cấp thông tin để tham gia tổ chức.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _studentCodeCtl,
                  validator: (v) => Validators.required(v, field: 'MSSV'),
                  decoration: const InputDecoration(
                    labelText: 'Mã số sinh viên',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _programCtl,
                  decoration: const InputDecoration(
                    labelText: 'Hệ đào tạo (Tùy chọn)',
                    hintText: 'Ví dụ: K15',
                    prefixIcon: Icon(Icons.school_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _graduatedYearCtl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Năm tốt nghiệp (Tùy chọn)',
                    hintText: '2019',
                    prefixIcon: Icon(Icons.calendar_today_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _majorCtl,
                  decoration: const InputDecoration(
                    labelText: 'Chuyên ngành (Tùy chọn)',
                    hintText: 'Ví dụ: Khoa học máy tính',
                    prefixIcon: Icon(Icons.book_outlined),
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Đăng ký tham gia', style: TextStyle(fontSize: 16)),
                ),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () => context.pop(),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Hủy bỏ'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
