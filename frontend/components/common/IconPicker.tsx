import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  createCustomIcon,
  getAllCustomIcons,
  isCustomIconRef,
  type CustomIconDoc,
} from '../../services/icons.service';

type IconChoice = {
  name: string;
  label: string;
};

const ICON_CHOICES: IconChoice[] = [
  { name: 'information-circle-outline', label: 'Info' },
  { name: 'alert-circle-outline', label: 'Penting' },
  { name: 'star-outline', label: 'Highlight' },
  { name: 'calendar-outline', label: 'Jadwal' },
  { name: 'time-outline', label: 'Waktu' },
  { name: 'book-outline', label: 'Renungan' },
  { name: 'library-outline', label: 'Artikel' },
  { name: 'megaphone-outline', label: 'Kegiatan' },
  { name: 'notifications-outline', label: 'Pengumuman' },
  { name: 'people-outline', label: 'Komunitas' },
  { name: 'hand-left-outline', label: 'Pelayanan' },
  { name: 'heart-outline', label: 'Aksi' },
  { name: 'home-outline', label: 'Beranda' },
  { name: 'globe-outline', label: 'Website' },
  { name: 'map-outline', label: 'Peta' },
  { name: 'pin-outline', label: 'Lokasi' },
  { name: 'call-outline', label: 'Kontak' },
  { name: 'mail-outline', label: 'Email' },
  { name: 'chatbubble-ellipses-outline', label: 'Pesan' },
  { name: 'chatbubbles-outline', label: 'Diskusi' },
  { name: 'musical-notes-outline', label: 'Pujian' },
  { name: 'balloon-outline', label: 'Anak' },
  { name: 'rainy-outline', label: 'Cuaca' },
  { name: 'sunny-outline', label: 'Hari cerah' },
  { name: 'cloud-outline', label: 'Umum' },
];

export interface IconPickerProps {
  visible: boolean;
  value?: string;
  title?: string;
  onSelect: (iconName: string) => void;
  onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  visible,
  value,
  title = 'Pilih Icon',
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [customIcons, setCustomIcons] = useState<CustomIconDoc[]>([]);
  const [loadingCustomIcons, setLoadingCustomIcons] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoadingCustomIcons(true);
    getAllCustomIcons()
      .then((data) => {
        if (!cancelled) setCustomIcons(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingCustomIcons(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const filteredIcons = useMemo(
    () =>
      ICON_CHOICES.filter(
        (icon) =>
          icon.name.toLowerCase().includes(search.toLowerCase()) ||
          icon.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const validateBase64DataUrl = (dataUrl: string, fileName: string) => {
    const lowerName = fileName.toLowerCase();
    const isPng = lowerName.endsWith('.png') || dataUrl.startsWith('data:image/png;base64,');
    const isIco =
      lowerName.endsWith('.ico') ||
      dataUrl.startsWith('data:image/x-icon;base64,') ||
      dataUrl.startsWith('data:image/vnd.microsoft.icon;base64,');

    if (!isPng && !isIco) {
      throw new Error('Format file harus PNG atau ICO.');
    }

    const parts = dataUrl.split(';base64,');
    if (parts.length !== 2 || !parts[1]) {
      throw new Error('Data icon tidak valid.');
    }

    const base64 = parts[1];
    if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
      throw new Error('Data base64 tidak valid.');
    }

    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    const estimatedBytes = Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
    if (estimatedBytes > 2 * 1024 * 1024) {
      throw new Error('Ukuran file maksimal 2MB.');
    }

    return { isPng };
  };

  const validateImageResolutionWeb = async (dataUrl: string) => {
    const win = globalThis as any;
    if (!win?.Image) return;
    await new Promise<void>((resolve, reject) => {
      const img = new win.Image();
      img.onload = () => {
        const w = Number(img.width || 0);
        const h = Number(img.height || 0);
        if (w > 256 || h > 256) {
          reject(new Error('Resolusi icon maksimal 256x256 piksel.'));
          return;
        }
        resolve();
      };
      img.onerror = () => reject(new Error('Gagal membaca resolusi icon.'));
      img.src = dataUrl;
    });
  };

  const handleUploadedIcon = async (input: { dataUrl: string; originalFileName: string }) => {
    if (uploading) return;
    setUploading(true);
    try {
      validateBase64DataUrl(input.dataUrl, input.originalFileName);
      if (Platform.OS === 'web') {
        await validateImageResolutionWeb(input.dataUrl);
      }
      const created = await createCustomIcon({
        icon: input.dataUrl,
        originalFileName: input.originalFileName,
      });
      setCustomIcons((prev) => [created, ...prev]);
      onSelect(`custom:${created.id}`);
      setSearch('');
    } catch (error: any) {
      Alert.alert('Upload Gagal', error?.message || 'Terjadi kesalahan');
    } finally {
      setUploading(false);
    }
  };

  const handlePickNative = async () => {
    if (uploading) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Maaf, kami memerlukan akses ke galeri foto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        base64: true,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) {
        Alert.alert('Upload Gagal', 'Gagal membaca data icon.');
        return;
      }

      const mimeType = (asset as any).mimeType as string | undefined;
      const uri = asset.uri || '';
      const ext = uri.split('.').pop()?.toLowerCase() || '';
      const isPng = mimeType === 'image/png' || ext === 'png';
      if (!isPng) {
        Alert.alert('Upload Gagal', 'Format file harus PNG (untuk perangkat mobile).');
        return;
      }

      const w = Number(asset.width || 0);
      const h = Number(asset.height || 0);
      if (w > 256 || h > 256) {
        Alert.alert('Upload Gagal', 'Resolusi icon maksimal 256x256 piksel.');
        return;
      }

      const dataUrl = `data:image/png;base64,${asset.base64}`;
      await handleUploadedIcon({
        dataUrl,
        originalFileName: uri.split('/').pop() || 'icon.png',
      });
    } catch (error: any) {
      Alert.alert('Upload Gagal', error?.message || 'Terjadi kesalahan');
    }
  };

  const handleUploadPress = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }
    handlePickNative();
  };

  const renderCustomIcons = () => {
    if (loadingCustomIcons) {
      return (
        <View style={styles.customLoadingRow}>
          <ActivityIndicator size="small" color="#8B4513" />
          <Text style={styles.customLoadingText}>Memuat icon custom...</Text>
        </View>
      );
    }

    if (customIcons.length === 0) {
      return (
        <View style={styles.customEmptyRow}>
          <Text style={styles.customEmptyText}>Belum ada icon custom</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={customIcons}
        numColumns={5}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const ref = `custom:${item.id}`;
          const active = value === ref;
          return (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => {
                onSelect(ref);
                setSearch('');
              }}
              disabled={uploading}
            >
              <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                <Image source={{ uri: item.icon }} style={styles.customIconImage} />
              </View>
              <Text style={styles.iconLabel} numberOfLines={1}>
                {item.originalFileName || 'Icon'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.ico,image/png,image/x-icon,image/vnd.microsoft.icon"
              style={{ display: 'none' } as any}
              onChange={async (e: any) => {
                const file: File | undefined = e?.target?.files?.[0];
                if (!file) return;
                e.target.value = '';

                const lowerName = String(file.name || '').toLowerCase();
                const isPng = file.type === 'image/png' || lowerName.endsWith('.png');
                const isIco =
                  file.type === 'image/x-icon' ||
                  file.type === 'image/vnd.microsoft.icon' ||
                  lowerName.endsWith('.ico');
                if (!isPng && !isIco) {
                  Alert.alert('Upload Gagal', 'Format file harus PNG atau ICO.');
                  return;
                }
                if (file.size > 2 * 1024 * 1024) {
                  Alert.alert('Upload Gagal', 'Ukuran file maksimal 2MB.');
                  return;
                }

                const reader = new FileReader();
                reader.onerror = () => Alert.alert('Upload Gagal', 'Gagal membaca file.');
                reader.onload = async () => {
                  const result = String(reader.result || '');
                  await handleUploadedIcon({ dataUrl: result, originalFileName: file.name });
                };
                reader.readAsDataURL(file);
              }}
            />
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Icon Custom</Text>
            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadPress}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                  <Text style={styles.uploadButtonText}>Unggah</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHint}>
            Format PNG/ICO, maksimal 2MB, resolusi maksimal 256x256.
          </Text>

          {renderCustomIcons()}

          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama icon..."
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={filteredIcons}
            numColumns={5}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.grid}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const active = !isCustomIconRef(value) && value === item.name;
              return (
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => {
                    onSelect(item.name);
                    setSearch('');
                  }}
                  disabled={uploading}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      active && styles.iconCircleActive,
                    ]}
                  >
                    <Ionicons
                      name={item.name as any}
                      size={22}
                      color={active ? '#8B4513' : '#5D4037'}
                    />
                  </View>
                  <Text style={styles.iconLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  sectionHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadButtonDisabled: {
    opacity: 0.75,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  grid: {
    paddingTop: 4,
  },
  gridItem: {
    width: 64,
    marginBottom: 10,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconCircleActive: {
    backgroundColor: '#FFF5E0',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  customIconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  iconLabel: {
    fontSize: 11,
    color: '#555',
  },
  customLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  customLoadingText: {
    fontSize: 12,
    color: '#666',
  },
  customEmptyRow: {
    paddingVertical: 8,
  },
  customEmptyText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  closeText: {
    fontSize: 13,
    color: '#8B4513',
    fontWeight: '600',
  },
});



