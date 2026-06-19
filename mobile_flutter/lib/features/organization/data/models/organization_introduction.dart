/// Organization introduction content (view-only) — mirrors the web
/// `getIntroduction` response used by IntroducePage.
class OrganizationIntroduction {
  final String? bannerUrl;
  final String? content; // HTML (ReactQuill)
  final String? vision;
  final String? mission;
  final String? coreValues;
  final List<String> imageUrls;

  const OrganizationIntroduction({
    this.bannerUrl,
    this.content,
    this.vision,
    this.mission,
    this.coreValues,
    this.imageUrls = const [],
  });

  bool get isEmpty =>
      (content == null || content!.isEmpty) &&
      (vision == null || vision!.isEmpty) &&
      (mission == null || mission!.isEmpty) &&
      (coreValues == null || coreValues!.isEmpty) &&
      imageUrls.isEmpty;

  factory OrganizationIntroduction.fromJson(Map<String, dynamic> json) {
    return OrganizationIntroduction(
      bannerUrl: json['bannerUrl'] as String?,
      content: json['content'] as String?,
      vision: json['vision'] as String?,
      mission: json['mission'] as String?,
      coreValues: json['coreValues'] as String?,
      imageUrls: (json['imageUrls'] as List?)
              ?.map((e) => e.toString())
              .where((e) => e.isNotEmpty)
              .toList() ??
          const [],
    );
  }
}
