import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/storage_keys.dart';

final secureStorageProvider = Provider<SecureStorage>((ref) => SecureStorage());

/// Secure key/value store for auth state. The refresh token is intentionally
/// NOT stored here — the backend keeps it in an HTTP-only cookie managed by the
/// dio cookie jar. We persist only the access token and verification level.
class SecureStorage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> writeAccessToken(String token) =>
      _storage.write(key: StorageKeys.accessToken, value: token);

  Future<String?> readAccessToken() =>
      _storage.read(key: StorageKeys.accessToken);

  Future<void> writeVerificationLevel(int level) =>
      _storage.write(key: StorageKeys.verificationLevel, value: '$level');

  Future<int?> readVerificationLevel() async {
    final raw = await _storage.read(key: StorageKeys.verificationLevel);
    return raw == null ? null : int.tryParse(raw);
  }

  Future<void> writeOrganizationSlug(String slug) =>
      _storage.write(key: StorageKeys.organizationSlug, value: slug);

  Future<String?> readOrganizationSlug() =>
      _storage.read(key: StorageKeys.organizationSlug);

  Future<void> clearAuth() async {
    await _storage.delete(key: StorageKeys.accessToken);
    await _storage.delete(key: StorageKeys.verificationLevel);
    await _storage.delete(key: StorageKeys.currentUser);
  }

  Future<void> clearAll() => _storage.deleteAll();
}
