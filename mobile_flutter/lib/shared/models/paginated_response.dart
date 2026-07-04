class PaginatedResponse<T> {
  final List<T> items;
  final int page;
  final int size;
  final int totalElements;
  final int totalPages;

  const PaginatedResponse({
    required this.items,
    required this.page,
    required this.size,
    required this.totalElements,
    required this.totalPages,
  });

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    final content = (json['content'] ?? json['items'] ?? []) as List;
    return PaginatedResponse<T>(
      items: content.map((e) => fromJsonT(e as Map<String, dynamic>)).toList(),
      page: (json['number'] ?? json['page'] ?? 0) as int,
      size: (json['size'] ?? 0) as int,
      totalElements: (json['totalElements'] ?? 0) as int,
      totalPages: (json['totalPages'] ?? 0) as int,
    );
  }
}
