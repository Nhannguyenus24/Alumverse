/// Formats a VND amount with dot thousand separators, e.g. `1500000` → `1.500.000 ₫`.
/// Done manually (no `intl` locale data) so it works without locale init.
String formatVnd(num amount) {
  final n = amount.round();
  final digits = n.abs().toString();
  final buf = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buf.write('.');
    buf.write(digits[i]);
  }
  return '${n < 0 ? '-' : ''}$buf ₫';
}
