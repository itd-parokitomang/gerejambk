import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function SliderWebviewScreen() {
  const { url, title } = useLocalSearchParams<{
    url?: string;
    title?: string;
  }>();
  const router = useRouter();

  const decodedUrl = url ? decodeURIComponent(String(url)) : undefined;
  const decodedTitle = title ? decodeURIComponent(String(title)) : 'Tautan';

  if (!decodedUrl) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#D32F2F"
            style={{ marginBottom: 8 }}
          />
          <Text style={styles.errorTitle}>URL tidak valid</Text>
          <Text style={styles.errorMessage}>
            Tautan untuk slider ini tidak ditemukan.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#8B4513"
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {decodedTitle}
          </Text>
        </View>
      </View>

      <View style={styles.webviewWrapper}>
        {Platform.OS === 'web' ? (
          <iframe
            style={styles.iframe as any}
            src={decodedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={decodedTitle}
          />
        ) : (
          <WebView
            source={{ uri: decodedUrl }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B4513" />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C7',
    backgroundColor: '#FFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
    flex: 1,
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});


