import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import {
  getAllPages,
  createPage,
  updatePage,
  deletePage,
  PageContent,
  PageType,
} from '../../services/pages.service';
import { useAuth } from '../../contexts/AuthContext';

type PageFormData = Omit<PageContent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

const PAGE_TYPES: Array<{ value: PageType; label: string; icon: string }> = [
  { value: 'static', label: 'Halaman Statis', icon: 'document-text' },
  { value: 'webview', label: 'WebView', icon: 'globe' },
  { value: 'youtube_video', label: 'Video YouTube', icon: 'play-circle' },
  { value: 'youtube_channel', label: 'Channel YouTube', icon: 'tv' },
  { value: 'data_table', label: 'Tabel Data', icon: 'grid' },
];

export default function PagesManagement() {
  const { user } = useAuth();
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [formData, setFormData] = useState<PageFormData>({
    title: '',
    slug: '',
    icon: 'document-text',
    type: 'static',
    order: 0,
    active: true,
    richTextContent: '',
    youtubeVideos: [],
  });
  const richText = useRef<RichEditor>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await getAllPages();
      setPages(data);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat halaman');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingPage(null);
    setFormData({
      title: '',
      slug: '',
      icon: 'document-text',
      type: 'static',
      order: pages.length,
      active: true,
      richTextContent: '',
      youtubeVideos: [],
    });
    setShowModal(true);
  };

  const handleAddVideo = () => {
    const newVideo = {
      id: Date.now().toString(),
      title: '',
      videoId: '',
      thumbnailUrl: '',
    };
    setFormData({
      ...formData,
      youtubeVideos: [...(formData.youtubeVideos || []), newVideo],
    });
  };

  const handleRemoveVideo = (videoId: string) => {
    setFormData({
      ...formData,
      youtubeVideos: formData.youtubeVideos?.filter((v) => v.id !== videoId) || [],
    });
  };

  const handleVideoChange = (videoId: string, field: string, value: string) => {
    setFormData({
      ...formData,
      youtubeVideos: formData.youtubeVideos?.map((v) =>
        v.id === videoId ? { ...v, [field]: value } : v
      ) || [],
    });
  };

  const handleEdit = (page: PageContent) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      icon: page.icon,
      type: page.type,
      order: page.order,
      active: page.active,
      richTextContent: page.richTextContent || '',
      webviewUrl: page.webviewUrl,
      youtubeVideos: page.youtubeVideos,
      youtubeChannelId: page.youtubeChannelId,
      youtubeChannelName: page.youtubeChannelName,
      tableTitle: page.tableTitle,
      tableColumns: page.tableColumns,
      tableData: page.tableData,
    });
    setShowModal(true);
  };

  const handleDelete = (page: PageContent) => {
    Alert.alert(
      'Hapus Halaman',
      `Apakah Anda yakin ingin menghapus "${page.title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePage(page.id);
              Alert.alert('Success', 'Halaman berhasil dihapus');
              loadPages();
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus halaman');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      Alert.alert('Error', 'Judul dan slug wajib diisi');
      return;
    }

    try {
      if (editingPage) {
        await updatePage(editingPage.id, formData);
        Alert.alert('Success', 'Halaman berhasil diupdate');
      } else {
        await createPage({
          ...formData,
          createdBy: user?.uid || 'unknown',
        });
        Alert.alert('Success', 'Halaman berhasil dibuat');
      }
      setShowModal(false);
      loadPages();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan halaman');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (text: string) => {
    setFormData({ ...formData, title: text });
    if (!editingPage) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(text) }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Memuat halaman...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Tambah Halaman Baru</Text>
      </TouchableOpacity>

      {/* Pages List */}
      {pages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Belum ada halaman</Text>
          <Text style={styles.emptySubtext}>Klik tombol di atas untuk membuat halaman pertama</Text>
        </View>
      ) : (
        <ScrollView style={styles.pagesList}>
          {pages.map((page) => (
            <View key={page.id} style={styles.pageCard}>
              <View style={styles.pageHeader}>
                <View style={styles.pageIconContainer}>
                  <Ionicons name={page.icon as any} size={24} color="#8B4513" />
                </View>
                <View style={styles.pageInfo}>
                  <Text style={styles.pageTitle}>{page.title}</Text>
                  <Text style={styles.pageSlug}>/{page.slug}</Text>
                  <Text style={styles.pageType}>
                    {PAGE_TYPES.find((t) => t.value === page.type)?.label}
                  </Text>
                </View>
                <View style={styles.pageActions}>
                  <TouchableOpacity
                    style={[styles.statusBadge, page.active ? styles.activeBadge : styles.inactiveBadge]}
                    onPress={() => updatePage(page.id, { active: !page.active }).then(loadPages)}
                  >
                    <Text style={styles.statusText}>{page.active ? 'Aktif' : 'Nonaktif'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.pageFooter}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(page)}>
                  <Ionicons name="create-outline" size={20} color="#8B4513" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(page)}
                >
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingPage ? 'Edit Halaman' : 'Tambah Halaman Baru'}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Judul Halaman *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.title}
                    onChangeText={handleTitleChange}
                    placeholder="Contoh: Jadwal Misa"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Slug (URL) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.slug}
                    onChangeText={(text) => setFormData({ ...formData, slug: text })}
                    placeholder="jadwal-misa"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tipe Halaman *</Text>
                  <View style={styles.typeSelector}>
                    {PAGE_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.typeOption,
                          formData.type === type.value && styles.typeOptionActive,
                        ]}
                        onPress={() => setFormData({ ...formData, type: type.value })}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={20}
                          color={formData.type === type.value ? '#8B4513' : '#666'}
                        />
                        <Text
                          style={[
                            styles.typeOptionText,
                            formData.type === type.value && styles.typeOptionTextActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Type-specific fields */}
                {formData.type === 'static' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Konten Halaman</Text>
                    <View style={styles.richEditorContainer}>
                      <RichToolbar
                        editor={richText}
                        actions={[
                          actions.setBold,
                          actions.setItalic,
                          actions.setUnderline,
                          actions.heading1,
                          actions.heading2,
                          actions.insertBulletsList,
                          actions.insertOrderedList,
                          actions.insertLink,
                          actions.undo,
                          actions.redo,
                        ]}
                        style={styles.richToolbar}
                      />
                      <RichEditor
                        ref={richText}
                        initialContentHTML={formData.richTextContent || ''}
                        onChange={(text) => setFormData({ ...formData, richTextContent: text })}
                        placeholder="Tulis konten halaman di sini..."
                        style={styles.richEditor}
                      />
                    </View>
                  </View>
                )}

                {formData.type === 'youtube_video' && (
                  <View style={styles.formGroup}>
                    <View style={styles.videoListHeader}>
                      <Text style={styles.label}>Daftar Video YouTube</Text>
                      <TouchableOpacity style={styles.addVideoButton} onPress={handleAddVideo}>
                        <Ionicons name="add-circle" size={20} color="#8B4513" />
                        <Text style={styles.addVideoText}>Tambah Video</Text>
                      </TouchableOpacity>
                    </View>
                    {formData.youtubeVideos && formData.youtubeVideos.length > 0 ? (
                      formData.youtubeVideos.map((video, index) => (
                        <View key={video.id} style={styles.videoItem}>
                          <View style={styles.videoItemHeader}>
                            <Text style={styles.videoItemTitle}>Video {index + 1}</Text>
                            <TouchableOpacity onPress={() => handleRemoveVideo(video.id)}>
                              <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                            </TouchableOpacity>
                          </View>
                          <TextInput
                            style={styles.input}
                            value={video.title}
                            onChangeText={(text) => handleVideoChange(video.id, 'title', text)}
                            placeholder="Judul Video"
                          />
                          <TextInput
                            style={[styles.input, { marginTop: 8 }]}
                            value={video.videoId}
                            onChangeText={(text) => handleVideoChange(video.id, 'videoId', text)}
                            placeholder="Video ID (misal: dQw4w9WgXcQ)"
                            autoCapitalize="none"
                          />
                          <Text style={styles.helperText}>
                            ID video dari URL: youtube.com/watch?v=<Text style={{ fontWeight: '600' }}>VIDEO_ID</Text>
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyVideoList}>
                        <Ionicons name="videocam-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyVideoText}>Belum ada video</Text>
                        <Text style={styles.emptyVideoSubtext}>Klik "Tambah Video" untuk menambahkan</Text>
                      </View>
                    )}
                  </View>
                )}

                {formData.type === 'webview' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>URL Website</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.webviewUrl}
                      onChangeText={(text) => setFormData({ ...formData, webviewUrl: text })}
                      placeholder="https://example.com"
                      autoCapitalize="none"
                    />
                  </View>
                )}

                {formData.type === 'youtube_channel' && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Channel ID</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.youtubeChannelId}
                        onChangeText={(text) => setFormData({ ...formData, youtubeChannelId: text })}
                        placeholder="UCxxxxxxxxx"
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Nama Channel</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.youtubeChannelName}
                        onChangeText={(text) => setFormData({ ...formData, youtubeChannelName: text })}
                        placeholder="Nama channel YouTube"
                      />
                    </View>
                  </>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Icon</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.icon}
                    onChangeText={(text) => setFormData({ ...formData, icon: text })}
                    placeholder="document-text"
                    autoCapitalize="none"
                  />
                  <Text style={styles.helperText}>Icon dari Ionicons (cari di icons.expo.fyi)</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Urutan</Text>
                  <TextInput
                    style={styles.input}
                    value={String(formData.order)}
                    onChangeText={(text) => setFormData({ ...formData, order: parseInt(text) || 0 })}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Save Button */}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginTop: 16,
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
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
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
    marginTop: 8,
    textAlign: 'center',
  },
  pagesList: {
    flex: 1,
  },
  pageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pageInfo: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  pageSlug: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  pageType: {
    fontSize: 12,
    color: '#999',
  },
  pageActions: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  pageFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  deleteButtonText: {
    color: '#D32F2F',
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
    padding: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B4513',
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
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
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  typeSelector: {
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    backgroundColor: '#FFF8F0',
    borderColor: '#8B4513',
  },
  typeOptionText: {
    fontSize: 15,
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#8B4513',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#8B4513',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
