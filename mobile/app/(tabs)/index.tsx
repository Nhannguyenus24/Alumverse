import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebView as WebViewType } from 'react-native-webview';

const TENANT_STORAGE_KEY = 'alumverse_tenant_slug';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'http://localhost:5173';

type ValidationState = 'idle' | 'validating';
type TenantValidationResult = 'ok' | 'not_found' | 'request_error';

function normalizeTenant(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function sanitizeBaseUrl(raw: string): string {
  // Common typo fix: "http://host/:8080" -> "http://host:8080"
  const fixedPort = raw.replace(/\/:(\d+)/, ':$1');
  return fixedPort.replace(/\/+$/, '');
}

export default function HomeScreen() {
  const webViewRef = useRef<WebViewType>(null);
  const [webCanGoBack, setWebCanGoBack] = useState(false);

  const [storedTenant, setStoredTenant] = useState<string | null>(null);
  const [tenantInput, setTenantInput] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [loadingSavedTenant, setLoadingSavedTenant] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const slug = await AsyncStorage.getItem(TENANT_STORAGE_KEY);
        if (slug) {
          setStoredTenant(slug);
          setTenantInput(slug);
        }
      } finally {
        setLoadingSavedTenant(false);
      }
    };

    void loadTenant();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const onBackPress = () => {
      if (storedTenant && webCanGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [storedTenant, webCanGoBack]);

  const validateTenant = useCallback(async (slug: string): Promise<TenantValidationResult> => {
    const normalizedApiBase = sanitizeBaseUrl(API_BASE_URL);
    const endpoint = `${normalizedApiBase}/api/organizations/${encodeURIComponent(slug)}`;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(endpoint);
    } catch {
      return 'request_error';
    }

    try {
      const response = await fetch(parsedUrl.toString());
      if (response.ok) {
        return 'ok';
      }
      if (response.status === 404) {
        return 'not_found';
      }
      return 'request_error';
    } catch {
      return 'request_error';
    }
  }, []);

  const handleContinue = useCallback(async () => {
    const normalized = normalizeTenant(tenantInput);
    if (!normalized) {
      Alert.alert('Thiếu organization', 'Vui lòng nhập organization slug, ví dụ: fit');
      return;
    }

    setValidationState('validating');
    try {
      const result = await validateTenant(normalized);
      if (result === 'not_found') {
        Alert.alert('Organization không hợp lệ', 'Không tìm thấy organization tương ứng với slug này.');
        return;
      }
      if (result === 'request_error') {
        Alert.alert(
          'Không kết nối được',
          'Không thể kiểm tra organization. Kiểm tra EXPO_PUBLIC_API_BASE_URL hoặc CORS rồi thử lại.'
        );
        return;
      }

      await AsyncStorage.setItem(TENANT_STORAGE_KEY, normalized);
      setStoredTenant(normalized);
      setTenantInput(normalized);
    } finally {
      setValidationState('idle');
    }
  }, [tenantInput, validateTenant]);

  const handleChangeTenant = useCallback(async () => {
    await AsyncStorage.removeItem(TENANT_STORAGE_KEY);
    setStoredTenant(null);
    setWebCanGoBack(false);
  }, []);

  const webUrl = useMemo(() => {
    if (!storedTenant) {
      return '';
    }
    return `${sanitizeBaseUrl(WEB_BASE_URL)}/${storedTenant}`;
  }, [storedTenant]);

  if (loadingSavedTenant) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!storedTenant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Nhập organization để vào AlumVerse</Text>
          <Text style={styles.subtitle}>
            Mỗi khoa/đơn vị có slug riêng, ví dụ: fit, biology, chemistry
          </Text>

          <TextInput
            value={tenantInput}
            onChangeText={setTenantInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Nhập organization slug"
            style={styles.input}
            editable={validationState !== 'validating'}
          />

          <Pressable
            style={[styles.button, validationState === 'validating' && styles.buttonDisabled]}
            onPress={() => void handleContinue()}
            disabled={validationState === 'validating'}>
            {validationState === 'validating' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Tiếp tục</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.webContainer}>
      <View style={styles.topBar}>
        <Text numberOfLines={1} style={styles.tenantLabel}>
          Organization: {storedTenant}
        </Text>
        <Pressable style={styles.changeTenantButton} onPress={() => void handleChangeTenant()}>
          <Text style={styles.changeTenantText}>Đổi organization</Text>
        </Pressable>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: webUrl }}
        startInLoadingState
        domStorageEnabled
        javaScriptEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onNavigationStateChange={(state) => setWebCanGoBack(state.canGoBack)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    marginTop: 4,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  tenantLabel: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  changeTenantButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  changeTenantText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 12,
  },
});
