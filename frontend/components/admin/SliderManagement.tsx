import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  SliderItem,
  SliderTargetType,
  getAllSliders,
  createSlider,
  updateSlider,
  deleteSlider,
} from '../../services/sliders.service';
import { IconPicker } from '../common/IconPicker';
import { PageContent, getAllPages } from '../../services/pages.service';

type SliderForm = Omit<SliderItem, 'id' | 'createdAt' | 'updatedAt'>;

export default function SliderManagement() {
  const [items, setItems] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SliderItem | null>(null);
  const [form, setForm] = useState<SliderForm>({
    title: '',
    description: '',
    icon: 'information-circle-outline',
    imageBase64: undefined,
    order: 0,
    active: true,
    targetType: 'none',
    targetPageSlug: undefined,
    targetUrl: undefined,
  });
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [pages, setPages] = useState<PageContent[]>([]);

  useEffect(() => {
    loadSliders();
    loadPages();
  }, []);

  const loadSliders = async () => {
    try {
      setLoading(true);
      const data = await getAllSliders();
      setItems(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat slider');
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async () => {
    try {
      const data = await getAllPages();
      // Hanya ambil halaman yang aktif saja supaya opsi lebih relevan
      setPages(data.filter((p) => p.active));
    } catch (error) {
      console.error(error);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      icon: 'information-circle-outline',
      imageBase64: undefined,
      order: items.length,
      active: true,
      targetType: 'none',
      targetPageSlug: undefined,
      targetUrl: undefined,
    });
    setShowModal(true);
  };

  const openEdit = (item: SliderItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      icon: item.icon,
      imageBase64: item.imageBase64,
      order: item.order,
      active: item.active,
      targetType: (item.targetType as SliderTargetType) || 'none',
      targetPageSlug: item.targetPageSlug,
      targetUrl: item.targetUrl,
    });
    setShowModal(true);
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Maaf, kami memerlukan akses ke galeri foto',
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setForm((prev) => ({
          ...prev,
          imageBase64: base64Image,
        }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  const handleSave = async () => {
    if (!form.title) {
      Alert.alert('Error', 'Judul slider wajib diisi');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateSlider(editing.id, form);
        Alert.alert('Success', 'Slider berhasil diupdate');
      } else {
        await createSlider(form);
        Alert.alert('Success', 'Slider berhasil dibuat');
      }
      setShowModal(false);
      loadSliders();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan slider');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: SliderItem) => {
    Alert.alert(
      'Hapus Slider',
      `Yakin ingin menghapus "${item.title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSlider(item.id);
              Alert.alert('Success', 'Slider berhasil dihapus');
              loadSliders();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Gagal menghapus slider');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Memuat slider...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={openNew}>
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.addButtonText}>Tambah Slider</Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Belum ada slider</Text>
          <Text style={styles.emptySubtext}>
            Slider akan tampil di beranda sebagai informasi singkat.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.cardIconWrapper}>
                  {item.imageBase64 ? (
                    <Image
                      source={{ uri: item.imageBase64 }}
                      style={styles.cardImage}
                    />
                  ) : (
                    <Ionicons
                      name={(item.icon || 'information-circle-outline') as any}
                      size={22}
                      color="#8B4513"
                    />
                  )}
                </View>
                <View style={styles.cardTextBlock}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!!item.description && (
                    <Text style={styles.cardDescription}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={styles.cardMeta}>
                    Urutan: {item.order} · {item.active ? 'Aktif' : 'Nonaktif'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    updateSlider(item.id, { active: !item.active }).then(
                      loadSliders,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: item.active ? '#D32F2F' : '#2E7D32' },
                    ]}
                  >
                    {item.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => openEdit(item)}
                  >
                    <Ionicons name="create-outline" size={18} color="#8B4513" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal add/edit */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit Slider' : 'Tambah Slider'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Judul *</Text>
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                  placeholder="Contoh: Jadwal Misa Hari Ini"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Deskripsi</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={form.description}
                  onChangeText={(text) =>
                    setForm({ ...form, description: text })
                  }
                  placeholder="Ringkasan singkat yang muncul di slider"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Tujuan klik slider */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tujuan saat slider diklik</Text>
                <View style={styles.statusRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusChip,
                      (form.targetType || 'none') === 'none' &&
                        styles.statusChipActive,
                    ]}
                    onPress={() =>
                      setForm((prev) => ({
                        ...prev,
                        targetType: 'none',
                        targetPageSlug: undefined,
                        targetUrl: undefined,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        (form.targetType || 'none') === 'none' &&
                          styles.statusChipTextActive,
                      ]}
                    >
                      Tidak ada aksi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusChip,
                      form.targetType === 'page' && styles.statusChipActive,
                    ]}
                    onPress={() =>
                      setForm((prev) => ({
                        ...prev,
                        targetType: 'page',
                        targetUrl: undefined,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        form.targetType === 'page' && styles.statusChipTextActive,
                      ]}
                    >
                      Halaman aplikasi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusChip,
                      form.targetType === 'url' && styles.statusChipActive,
                    ]}
                    onPress={() =>
                      setForm((prev) => ({
                        ...prev,
                        targetType: 'url',
                        targetPageSlug: undefined,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        form.targetType === 'url' && styles.statusChipTextActive,
                      ]}
                    >
                      URL / Tautan
                    </Text>
                  </TouchableOpacity>
                </View>

                {form.targetType === 'page' && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.helperText}>
                      Pilih halaman aplikasi yang akan dibuka ketika slider
                      diklik.
                    </Text>
                    <View style={styles.pageSelectList}>
                      <ScrollView style={{ maxHeight: 160 }}>
                        {pages.map((page) => {
                          const isSelected =
                            form.targetPageSlug === page.slug ||
                            (!form.targetPageSlug &&
                              form.targetType === 'page' &&
                              editing?.targetPageSlug === page.slug);
                          return (
                            <TouchableOpacity
                              key={page.id}
                              style={[
                                styles.pageSelectItem,
                                isSelected && styles.pageSelectItemActive,
                              ]}
                              onPress={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  targetPageSlug: page.slug,
                                }))
                              }
                            >
                              <View style={styles.pageSelectIcon}>
                                <Ionicons
                                  name={page.icon as any}
                                  size={18}
                                  color={isSelected ? '#8B4513' : '#666'}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.pageSelectTitle,
                                    isSelected && styles.pageSelectTitleActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {page.title}
                                </Text>
                                <Text style={styles.pageSelectSlug}>
                                  /pages/{page.slug}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                        {pages.length === 0 && (
                          <Text style={styles.helperText}>
                            Belum ada halaman aktif. Tambahkan di menu
                            &quot;Kelola Halaman&quot;.
                          </Text>
                        )}
                      </ScrollView>
                    </View>
                  </View>
                )}

                {form.targetType === 'url' && (
                  <View style={{ marginTop: 10 }}>
                    <TextInput
                      style={styles.input}
                      value={form.targetUrl || ''}
                      onChangeText={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          targetUrl: text,
                        }))
                      }
                      placeholder="Contoh: https://paroki.or.id atau /pages/misa"
                      autoCapitalize="none"
                    />
                    <Text style={styles.helperText}>
                      Bisa URL internal (mis: /pages/misa) atau URL eksternal
                      penuh (mis: https://paroki.or.id). Tautan akan dibuka di
                      tampilan web fullscreen tanpa keluar dari aplikasi.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Icon</Text>
                <View style={styles.iconPreviewRow}>
                  <View style={styles.iconPreviewCircle}>
                    <Ionicons
                      name={
                        (form.icon || 'information-circle-outline') as any
                      }
                      size={22}
                      color="#8B4513"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.iconPreviewName}>
                      {form.icon || 'information-circle-outline'}
                    </Text>
                    <Text style={styles.helperText}>
                      Pilih icon dari daftar Ionicons.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pickIconButton}
                    onPress={() => setIconPickerVisible(true)}
                  >
                    <Text style={styles.pickIconButtonText}>Pilih Icon</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Icon akan muncul jika slider tidak menggunakan gambar.
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Gambar (opsional)</Text>
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={handlePickImage}
                >
                  {form.imageBase64 ? (
                    <Image
                      source={{ uri: form.imageBase64 }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons
                        name="image-outline"
                        size={32}
                        color="#999"
                      />
                      <Text style={styles.imagePlaceholderText}>
                        Tap untuk pilih gambar
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.helperText}>
                  Jika gambar diisi, gambar akan ditampilkan di slider; jika
                  tidak, slider menampilkan icon & teks.
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Urutan</Text>
                <TextInput
                  style={styles.input}
                  value={String(form.order)}
                  onChangeText={(text) =>
                    setForm({ ...form, order: parseInt(text) || 0 })
                  }
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusChip,
                      form.active && styles.statusChipActive,
                    ]}
                    onPress={() => setForm({ ...form, active: true })}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        form.active && styles.statusChipTextActive,
                      ]}
                    >
                      Aktif
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusChip,
                      !form.active && styles.statusChipActive,
                    ]}
                    onPress={() => setForm({ ...form, active: false })}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        !form.active && styles.statusChipTextActive,
                      ]}
                    >
                      Nonaktif
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowModal(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={styles.saveButtonText}>Simpan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <IconPicker
        visible={iconPickerVisible}
        value={form.icon}
        onClose={() => setIconPickerVisible(false)}
        onSelect={(iconName) => {
          setForm((prev) => ({ ...prev, icon: iconName }));
          setIconPickerVisible(false);
        }}
      />
    </View>
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
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  cardIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 3,
    backgroundColor: '#FFF5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: 42,
    height: 42,
    borderRadius: 3,
  },
  cardTextBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#7A5A3A',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 11,
    color: '#999',
  },
  cardActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF5E0',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4513',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  statusChipActive: {
    backgroundColor: '#FFF5E0',
    borderColor: '#8B4513',
  },
  statusChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#8B4513',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  saveButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B4513',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  iconPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPreviewCircle: {
    width: 40,
    height: 40,
    borderRadius: 3,
    backgroundColor: '#FFF5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPreviewName: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  pickIconButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#8B4513',
  },
  pickIconButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  pageSelectList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  pageSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  pageSelectItemActive: {
    backgroundColor: '#FFF5E0',
  },
  pageSelectIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pageSelectTitle: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  pageSelectTitleActive: {
    color: '#8B4513',
    fontWeight: '700',
  },
  pageSelectSlug: {
    fontSize: 11,
    color: '#999',
  },
});