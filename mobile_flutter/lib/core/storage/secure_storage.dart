import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/storage_keys.dart';

final secureStorageProvider = Provider<SecureStorage>((ref) => SecureStorage());

class SecureStorage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> writeAccessToken(String token) =>
      _storage.write(key: StorageKeys.accessToken, value: token);

  Future<String?> readAccessToken() =>
      _storage.read(key: StorageKeys.accessToken);

  Future<void> writeRefreshToken(String token) =>
      _storage.write(key: StorageKeys.refreshToken, value: token);

  Future<String?> readRefreshToken() =>
      _storage.read(key: StorageKeys.refreshToken);

  Future<void> writeOrganizationSlug(String slug) =>
      _storage.write(key: StorageKeys.organizationSlug, value: slug);

  Future<String?> readOrganizationSlug() =>
      _storage.read(key: StorageKeys.organizationSlug);

  Future<void> clearAuth() async {
    await _storage.delete(key: StorageKeys.accessToken);
    await _storage.delete(key: StorageKeys.refreshToken);
    await _storage.delete(key: StorageKeys.currentUser);
  }

  Future<void> clearAll() => _storage.deleteAll();
}
