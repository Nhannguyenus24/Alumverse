import 'dart:convert';

class Organization {
  final int id;
  final String name;
  final String slug;
  final String? logoUrl;
  final Map<String, dynamic> brandConfig;
  final Map<String, dynamic> featuresConfig;
  final List<String> programs;
  final List<String> majors;
  final String? status;

  const Organization({
    required this.id,
    required this.name,
    required this.slug,
    this.logoUrl,
    this.brandConfig = const {},
    this.featuresConfig = const {},
    this.programs = const [],
    this.majors = const [],
    this.status,
  });

  factory Organization.fromJson(Map<String, dynamic> json) {
    return Organization(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      logoUrl: json['logoUrl'] as String?,
      brandConfig: _asMap(json['brandConfig']),
      featuresConfig: _asMap(json['featuresConfig']),
      programs: _asStringList(json['programs']),
      majors: _asStringList(json['majors']),
      status: json['status'] as String?,
    );
  }

  /// The backend stores these columns as JSON *strings*, so a field may arrive
  /// either as a decoded Map or as a raw JSON string — handle both.
  static Map<String, dynamic> _asMap(Object? value) {
    if (value is Map<String, dynamic>) return value;
    if (value is String && value.isNotEmpty) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is Map<String, dynamic>) return decoded;
      } catch (_) {}
    }
    return {};
  }

  static List<String> _asStringList(Object? value) {
    if (value is List) return value.map((e) => e.toString()).toList();
    if (value is String && value.isNotEmpty) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is List) return decoded.map((e) => e.toString()).toList();
      } catch (_) {}
    }
    return const [];
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'logoUrl': logoUrl,
        'brandConfig': brandConfig,
        'featuresConfig': featuresConfig,
        'programs': programs,
        'majors': majors,
        'status': status,
      };
}
