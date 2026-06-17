/// Vietnamese relative time, mirroring the web `formatRelativeTimeVi`
/// (vd "vài giây trước", "5 phút trước", "3 ngày trước").
String formatRelativeTimeVi(DateTime? time) {
  if (time == null) return '';
  final now = DateTime.now();
  final diff = now.difference(time);

  if (diff.isNegative) return 'vừa xong';
  if (diff.inSeconds < 60) return 'vài giây trước';
  if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
  if (diff.inHours < 24) return '${diff.inHours} giờ trước';
  if (diff.inDays < 30) return '${diff.inDays} ngày trước';
  if (diff.inDays < 365) return '${(diff.inDays / 30).floor()} tháng trước';
  return '${(diff.inDays / 365).floor()} năm trước';
}
