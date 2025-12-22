import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAppSettings, updateAppSettings, AppSettings } from '../../services/settings.service';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    appName: '',
    parokiName: '',
    headerText: '',
    footerText: '',
    primaryColor: '#8B4513',
    secondaryColor: '#D2691E',
    updatedAt: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getAppSettings();
      if (data) {
        setSettings(data);
      }
    } catch {
      Alert.alert('Error', 'Gagal memuat settings');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'logo' | 'icon' | 'favicon') => {
    try {
      // Request permission
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Maaf, kami memerlukan akses ke galeri foto');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'favicon' ? [1, 1] : [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        setSettings((prev) => ({
          ...prev,
          [`${type}Base64`]: base64Image,
        }));
        
        Alert.alert('Success', `${type.toUpperCase()} berhasil dipilih`);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih gambar');
      console.error('Image picker error:', error);
    }
  };

  const handleSave = async () => {
    if (!settings.appName || !settings.parokiName) {
      Alert.alert('Error', 'Nama aplikasi dan nama paroki wajib diisi');
      return;
    }

    setSaving(true);
    try {
      await updateAppSettings(settings);
      Alert.alert('Success', 'Settings berhasil disimpan');
    } catch {
      Alert.alert('Error', 'Gagal menyimpan settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Memuat settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Aplikasi</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Aplikasi *</Text>
          <TextInput
            style={styles.input}
            value={settings.appName}
            onChangeText={(text) => setSettings({ ...settings, appName: text })}
            placeholder="Contoh: Paroki Tomang"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Paroki *</Text>
          <TextInput
            style={styles.input}
            value={settings.parokiName}
            onChangeText={(text) => setSettings({ ...settings, parokiName: text })}
            placeholder="Contoh: Paroki Santa Maria Bunda Karmel"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Text Header</Text>
          <TextInput
            style={styles.input}
            value={settings.headerText}
            onChangeText={(text) => setSettings({ ...settings, headerText: text })}
            placeholder="Text yang muncul di header"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Text Footer</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.footerText}
            onChangeText={(text) => setSettings({ ...settings, footerText: text })}
            placeholder="Text yang muncul di footer"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logo & Icon</Text>
        <Text style={styles.sectionDesc}>Upload gambar dalam format JPG/PNG. Gambar akan disimpan sebagai base64.</Text>

        {/* Logo */}
        <View style={styles.imageGroup}>
          <Text style={styles.label}>Logo Aplikasi</Text>
          <Text style={styles.labelDesc}>Direkomendasikan: 512x512px, max 2MB</Text>
          <TouchableOpacity style={styles.imageButton} onPress={() => pickImage('logo')}>
            {settings.logoBase64 ? (
              <Image source={{ uri: settings.logoBase64 }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="#999" />
                <Text style={styles.imagePlaceholderText}>Tap untuk upload logo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <View style={styles.imageGroup}>
          <Text style={styles.label}>Icon PWA</Text>
          <Text style={styles.labelDesc}>Direkomendasikan: 512x512px, persegi</Text>
          <TouchableOpacity style={styles.imageButton} onPress={() => pickImage('icon')}>
            {settings.iconBase64 ? (
              <Image source={{ uri: settings.iconBase64 }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="apps-outline" size={48} color="#999" />
                <Text style={styles.imagePlaceholderText}>Tap untuk upload icon</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Favicon */}
        <View style={styles.imageGroup}>
          <Text style={styles.label}>Favicon</Text>
          <Text style={styles.labelDesc}>Direkomendasikan: 32x32px atau 64x64px</Text>
          <TouchableOpacity style={styles.imageButton} onPress={() => pickImage('favicon')}>
            {settings.faviconBase64 ? (
              <Image source={{ uri: settings.faviconBase64 }} style={styles.imagePreviewSmall} />
            ) : (
              <View style={styles.imagePlaceholderSmall}>
                <Ionicons name="bookmark-outline" size={32} color="#999" />
                <Text style={styles.imagePlaceholderText}>Tap untuk upload favicon</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Colors Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warna Tema</Text>
        
        <View style={styles.colorGroup}>
          <View style={styles.colorItem}>
            <Text style={styles.label}>Primary Color</Text>
            <View style={styles.colorRow}>
              <View style={[styles.colorPreview, { backgroundColor: settings.primaryColor }]} />
              <TextInput
                style={styles.colorInput}
                value={settings.primaryColor}
                onChangeText={(text) => setSettings({ ...settings, primaryColor: text })}
                placeholder="#8B4513"
              />
            </View>
          </View>

          <View style={styles.colorItem}>
            <Text style={styles.label}>Secondary Color</Text>
            <View style={styles.colorRow}>
              <View style={[styles.colorPreview, { backgroundColor: settings.secondaryColor }]} />
              <TextInput
                style={styles.colorInput}
                value={settings.secondaryColor}
                onChangeText={(text) => setSettings({ ...settings, secondaryColor: text })}
                placeholder="#D2691E"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  labelDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imageGroup: {
    marginBottom: 24,
  },
  imageButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D0D0D0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  imagePlaceholderSmall: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  imagePreviewSmall: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
  },
  colorGroup: {
    gap: 16,
  },
  colorItem: {
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  colorInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  buttonContainer: {
    padding: 24,
  },
  saveButton: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});
