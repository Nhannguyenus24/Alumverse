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
      brandConfig: json['brandConfig'] is Map ? json['brandConfig'] as Map<String, dynamic> : {},
      featuresConfig: json['featuresConfig'] is Map ? json['featuresConfig'] as Map<String, dynamic> : {},
      programs: (json['programs'] as List?)?.map((e) => e.toString()).toList() ?? [],
      majors: (json['majors'] as List?)?.map((e) => e.toString()).toList() ?? [],
      status: json['status'] as String?,
    );
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
