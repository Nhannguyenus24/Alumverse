class AuthUser {
  final String id;
  final String email;
  final String? fullName;
  final String? avatarUrl;
  final List<String> roles;
  final int? verificationLevel;

  const AuthUser({
    required this.id,
    required this.email,
    this.fullName,
    this.avatarUrl,
    this.roles = const [],
    this.verificationLevel,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'].toString(),
        email: json['email'] as String,
        fullName: json['fullName'] as String? ?? json['name'] as String?,
        avatarUrl: json['avatarUrl'] as String? ?? json['avatar'] as String?,
        roles: (json['roles'] as List?)?.map((e) => e.toString()).toList() ??
            const [],
        verificationLevel: json['verificationLevel'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'fullName': fullName,
        'avatarUrl': avatarUrl,
        'roles': roles,
        'verificationLevel': verificationLevel,
      };
}
