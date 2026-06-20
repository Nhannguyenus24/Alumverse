class Validators {
  Validators._();

  static String? required(String? value, {String field = 'Trường này'}) {
    if (value == null || value.trim().isEmpty) {
      return '$field không được để trống';
    }
    return null;
  }

  static String? email(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return 'Email không được để trống';
    final regex = RegExp(r'^[\w\.\-]+@([\w\-]+\.)+[\w\-]{2,}$');
    if (!regex.hasMatch(v)) return 'Email không hợp lệ';
    return null;
  }

  static String? password(String? value) {
    final v = value ?? '';
    if (v.isEmpty) return 'Mật khẩu không được để trống';
    if (v.length < 8) return 'Mật khẩu tối thiểu 8 ký tự';
    
    // Add same requirements as frontend
    if (!RegExp(r'[A-Z]').hasMatch(v)) return 'Cần ít nhất 1 chữ viết hoa';
    if (!RegExp(r'[a-z]').hasMatch(v)) return 'Cần ít nhất 1 chữ viết thường';
    if (!RegExp(r'\d').hasMatch(v)) return 'Cần ít nhất 1 chữ số';
    if (!RegExp(r'[@$!%*?&]').hasMatch(v)) return 'Cần ít nhất 1 ký tự đặc biệt';
    
    return null;
  }

  static String? confirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) return 'Vui lòng nhập lại mật khẩu';
    if (value != password) return 'Mật khẩu không khớp';
    return null;
  }

  static String? studentId(String? value) {
    if (value == null || value.trim().isEmpty) return 'MSSV không được để trống';
    // Add specific student ID validation if needed
    return null;
  }

  /// Vietnamese mobile number: exactly 10 digits, leading 0, and a valid
  /// carrier prefix (second digit 3/5/7/8/9 — Viettel/Vina/Mobi/Vietnamobile/
  /// Gmobile under the current numbering plan). [optional] allows an empty value.
  static String? vietnamPhone(String? value, {bool optional = false}) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) {
      return optional ? null : 'Số điện thoại không được để trống';
    }
    if (!RegExp(r'^\d+$').hasMatch(v)) {
      return 'Số điện thoại chỉ gồm chữ số';
    }
    if (v.length != 10) {
      return 'Số điện thoại phải có đúng 10 chữ số';
    }
    if (!RegExp(r'^0[35789]\d{8}$').hasMatch(v)) {
      return 'Số điện thoại không hợp lệ';
    }
    return null;
  }
}
