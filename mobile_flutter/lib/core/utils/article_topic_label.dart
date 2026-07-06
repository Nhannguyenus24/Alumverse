import 'package:easy_localization/easy_localization.dart';

String articleTopicLabel(String? raw) {
  final normalized = _normalizeTopic(raw);
  if (normalized == null) return '';

  final key = 'article.topics.$normalized';
  final translated = key.tr();
  if (translated != key) return translated;

  return normalized
      .split('_')
      .where((part) => part.isNotEmpty)
      .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String? _normalizeTopic(String? raw) {
  final value = raw?.trim();
  if (value == null || value.isEmpty) return null;
  return value
      .replaceAll(RegExp(r'[\s-]+'), '_')
      .replaceAll(RegExp(r'_+'), '_')
      .toLowerCase();
}
