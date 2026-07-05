/// Authenticated user built from the JWT access token claims
/// (`sub, email, username, avatar, role, organizationId`).
class AuthUser {
  final String id;
  final String email;
  final String? fullName;
  final String? avatarUrl;
  final String? role;
  final int? organizationId;

  const AuthUser({
    required this.id,
    required this.email,
    this.fullName,
    this.avatarUrl,
    this.role,
    this.organizationId,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: json['id'].toString(),
    email: (json['email'] as String?) ?? '',
    fullName: json['fullName'] as String? ?? json['username'] as String?,
    avatarUrl: json['avatarUrl'] as String? ?? json['avatar'] as String?,
    role: json['role'] as String?,
    organizationId:
        json['organizationId'] is num
            ? (json['organizationId'] as num).toInt()
            : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'fullName': fullName,
    'avatarUrl': avatarUrl,
    'role': role,
    'organizationId': organizationId,
  };
}
