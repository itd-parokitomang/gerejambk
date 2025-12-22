import React, { useEffect, useMemo, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllPages,
  createPage,
  updatePage,
  deletePage,
  PageContent,
  PageType,
} from '../../services/pages.service';
import { useAuth } from '../../contexts/AuthContext';
import { IconPicker } from '../common/IconPicker';
import RichTextEditor from '../common/RichTextEditor';
import RichTextRenderer from '../common/RichTextRenderer';

type PageFormData = Omit<PageContent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

const PAGE_TYPES: { value: PageType; label: string; icon: string }[] = [
  { value: 'static', label: 'Halaman Statis', icon: 'document-text' },
  { value: 'parent', label: 'Halaman Induk (Group Menu)', icon: 'albums' },
  { value: 'webview', label: 'WebView', icon: 'globe' },
  { value: 'youtube_video', label: 'Video YouTube', icon: 'play-circle' },
  { value: 'youtube_channel', label: 'Channel YouTube', icon: 'tv' },
  { value: 'data_table', label: 'Tabel Data', icon: 'grid' },
];

export default function PagesManagement() {
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [parentForNew, setParentForNew] = useState<PageContent | null>(null);
  const [formData, setFormData] = useState<PageFormData>({
    title: '',
    slug: '',
    icon: 'document-text',
    type: 'static',
    order: 0,
    active: true,
    richTextContent: '',
    youtubeVideos: [],
    parentId: undefined,
    youtubeChannelUrl: undefined,
    tableColumns: undefined,
    tableData: undefined,
  });
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [contentMode, setContentMode] = useState<'edit' | 'preview'>('edit');
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [autoSaveAt, setAutoSaveAt] = useState<number | null>(null);
  const [contentDirty, setContentDirty] = useState(false);

  const modalContentWidth = useMemo(() => Math.max(320, windowWidth - 80), [windowWidth]);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await getAllPages();
      setPages(data);
    } catch {
      Alert.alert('Error', 'Gagal memuat halaman');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingPage(null);
    setParentForNew(null);
    setContentMode('edit');
    setAutoSaveStatus('idle');
    setAutoSaveAt(null);
    setContentDirty(false);
    setFormData({
      title: '',
      slug: '',
      icon: 'document-text',
      type: 'static',
      order: pages.length,
      active: true,
      richTextContent: '',
      youtubeVideos: [],
      parentId: undefined,
      youtubeChannelUrl: undefined,
      tableColumns: undefined,
      tableData: undefined,
    });
    setShowModal(true);
  };

  const handleAddChild = (parent: PageContent) => {
    setEditingPage(null);
    setParentForNew(parent);
    setContentMode('edit');
    setAutoSaveStatus('idle');
    setAutoSaveAt(null);
    setContentDirty(false);
    setFormData({
      title: '',
      slug: '',
      icon: parent.icon || 'document-text',
      type: 'static',
      order: pages.length,
      active: true,
      richTextContent: '',
      youtubeVideos: [],
      parentId: parent.id,
      youtubeChannelUrl: undefined,
      tableColumns: undefined,
      tableData: undefined,
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

  // Table column handlers
  const handleAddColumn = () => {
    const newColumn = {
      id: `col_${Date.now()}`,
      label: '',
      type: 'text' as const,
    };
    setFormData({
      ...formData,
      tableColumns: [...(formData.tableColumns || []), newColumn],
    });
  };

  const handleRemoveColumn = (columnId: string) => {
    const newColumns = formData.tableColumns?.filter((c) => c.id !== columnId) || [];
    // Also remove this column from all data rows
    const newData = formData.tableData?.map((row) => {
      const newRow = { ...row };
      delete newRow[columnId];
      return newRow;
    }) || [];
    setFormData({
      ...formData,
      tableColumns: newColumns,
      tableData: newData,
    });
  };

  const handleColumnChange = (columnId: string, field: string, value: string) => {
    setFormData({
      ...formData,
      tableColumns: formData.tableColumns?.map((c) =>
        c.id === columnId ? { ...c, [field]: value } : c
      ) || [],
    });
  };

  // Table data row handlers
  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    formData.tableColumns?.forEach((col) => {
      newRow[col.id] = '';
    });
    setFormData({
      ...formData,
      tableData: [...(formData.tableData || []), newRow],
    });
  };

  const handleRemoveRow = (rowIndex: number) => {
    setFormData({
      ...formData,
      tableData: formData.tableData?.filter((_, idx) => idx !== rowIndex) || [],
    });
  };

  const handleRowCellChange = (rowIndex: number, columnId: string, value: string) => {
    setFormData({
      ...formData,
      tableData: formData.tableData?.map((row, idx) =>
        idx === rowIndex ? { ...row, [columnId]: value } : row
      ) || [],
    });
  };

  const handleEdit = (page: PageContent) => {
    setEditingPage(page);
    setParentForNew(null);
    setContentMode('edit');
    setAutoSaveStatus('idle');
    setAutoSaveAt(null);
    setContentDirty(false);
    setFormData({
      title: page.title,
      slug: page.slug,
      icon: page.icon,
      type: page.type,
      order: page.order,
      active: page.active,
      richTextContent: page.richTextContent || '',
      parentId: page.parentId,
      webviewUrl: page.webviewUrl,
      youtubeVideos: page.youtubeVideos,
      youtubeChannelId: page.youtubeChannelId,
      youtubeChannelName: page.youtubeChannelName,
      youtubeChannelUrl: page.youtubeChannelUrl,
      tableTitle: page.tableTitle,
      tableColumns: page.tableColumns,
      tableData: page.tableData,
    });
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal) return;
    if (!editingPage) return;
    if (formData.type !== 'static') return;
    if (!contentDirty) return;

    const content = formData.richTextContent || '';
    const timer = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await updatePage(editingPage.id, { richTextContent: content });
        setAutoSaveStatus('saved');
        setAutoSaveAt(Date.now());
        setContentDirty(false);
      } catch {
        setAutoSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [showModal, editingPage, formData.type, formData.richTextContent, contentDirty]);

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
            } catch {
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
    } catch {
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
                  {page.type === 'parent' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.addChildButton]}
                      onPress={() => handleAddChild(page)}
                    >
                      <Ionicons name="add-circle-outline" size={18} color="#8B4513" />
                      <Text style={styles.actionButtonText}>Sub Halaman</Text>
                    </TouchableOpacity>
                  )}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
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
                {parentForNew && !editingPage && (
                  <View style={styles.infoParentBox}>
                    <Text style={styles.infoParentLabel}>Sub halaman dari:</Text>
                    <View style={styles.infoParentRow}>
                      <Ionicons
                        name={parentForNew.icon as any}
                        size={18}
                        color="#8B4513"
                      />
                      <Text style={styles.infoParentTitle}>
                        {parentForNew.title}
                      </Text>
                    </View>
                  </View>
                )}
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
                    <View style={styles.richHeaderRow}>
                      <Text style={styles.label}>Konten Halaman</Text>
                      <View style={styles.richHeaderRight}>
                        {editingPage && (
                          <View style={styles.autoSavePill}>
                            {autoSaveStatus === 'saving' ? (
                              <>
                                <ActivityIndicator size="small" color="#8B4513" />
                                <Text style={styles.autoSaveText}>Menyimpan...</Text>
                              </>
                            ) : autoSaveStatus === 'saved' && autoSaveAt ? (
                              <Text style={styles.autoSaveText}>
                                Tersimpan {new Date(autoSaveAt).toLocaleTimeString()}
                              </Text>
                            ) : autoSaveStatus === 'error' ? (
                              <Text style={styles.autoSaveText}>Gagal simpan</Text>
                            ) : (
                              <Text style={styles.autoSaveText}>Auto-save aktif</Text>
                            )}
                          </View>
                        )}

                        <View style={styles.modeSwitch}>
                          <TouchableOpacity
                            style={[
                              styles.modeBtn,
                              contentMode === 'edit' && styles.modeBtnActive,
                            ]}
                            onPress={() => setContentMode('edit')}
                          >
                            <Text
                              style={[
                                styles.modeBtnText,
                                contentMode === 'edit' && styles.modeBtnTextActive,
                              ]}
                            >
                              Edit
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.modeBtn,
                              contentMode === 'preview' && styles.modeBtnActive,
                            ]}
                            onPress={() => setContentMode('preview')}
                          >
                            <Text
                              style={[
                                styles.modeBtnText,
                                contentMode === 'preview' && styles.modeBtnTextActive,
                              ]}
                            >
                              Preview
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {contentMode === 'edit' ? (
                      <RichTextEditor
                        value={formData.richTextContent || ''}
                        onChange={(html: string) => {
                          setFormData((prev) => ({ ...prev, richTextContent: html }));
                          if (editingPage) setContentDirty(true);
                        }}
                        placeholder="Tulis konten halaman di sini..."
                        minHeight={260}
                      />
                    ) : (
                      <View style={styles.previewBox}>
                        {Platform.OS === 'web' ? (
                          <RichTextRenderer html={formData.richTextContent || ''} />
                        ) : (
                          <RichTextRenderer
                            html={formData.richTextContent || ''}
                            contentWidth={modalContentWidth}
                          />
                        )}
                      </View>
                    )}
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
                        <Text style={styles.emptyVideoSubtext}>
                          Klik {'"'}Tambah Video{'"'} untuk menambahkan
                        </Text>
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
                      <Text style={styles.label}>URL Channel (beranda)</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.youtubeChannelUrl}
                        onChangeText={(text) =>
                          setFormData({ ...formData, youtubeChannelUrl: text })
                        }
                        placeholder="https://www.youtube.com/@namaChannel atau /channel/UCxxxx"
                        autoCapitalize="none"
                      />
                      <Text style={styles.helperText}>
                        Tempel URL beranda channel, misalnya{' '}
                        https://www.youtube.com/channel/UC1_up347GdfKBDVGqwjt7Aw
                        atau https://www.youtube.com/@mohmbilly
                      </Text>
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Nama Channel</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.youtubeChannelName}
                        onChangeText={(text) =>
                          setFormData({ ...formData, youtubeChannelName: text })
                        }
                        placeholder="Nama channel YouTube (opsional, untuk judul tampilan)"
                      />
                    </View>
                  </>
                )}

                {formData.type === 'data_table' && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Judul Tabel</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.tableTitle || ''}
                        onChangeText={(text) =>
                          setFormData({ ...formData, tableTitle: text })
                        }
                        placeholder="Contoh: Jadwal Misa Minggu Ini"
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <View style={styles.videoListHeader}>
                        <Text style={styles.label}>Kolom Tabel</Text>
                        <TouchableOpacity
                          style={styles.addVideoButton}
                          onPress={handleAddColumn}
                        >
                          <Ionicons name="add-circle" size={20} color="#8B4513" />
                          <Text style={styles.addVideoText}>Tambah Kolom</Text>
                        </TouchableOpacity>
                      </View>
                      {formData.tableColumns && formData.tableColumns.length > 0 ? (
                        <ScrollView style={{ maxHeight: 200 }}>
                          {formData.tableColumns.map((column) => (
                            <View key={column.id} style={styles.videoItem}>
                              <View style={styles.videoItemHeader}>
                                <Text style={styles.videoItemTitle}>
                                  Kolom: {column.label || '(tanpa label)'}
                                </Text>
                                <TouchableOpacity
                                  onPress={() => handleRemoveColumn(column.id)}
                                >
                                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                                </TouchableOpacity>
                              </View>
                              <TextInput
                                style={styles.input}
                                value={column.label}
                                onChangeText={(text) =>
                                  handleColumnChange(column.id, 'label', text)
                                }
                                placeholder="Label kolom (contoh: Nama, Tanggal)"
                              />
                              <View style={{ marginTop: 8 }}>
                                <Text style={[styles.helperText, { marginBottom: 6 }]}>
                                  Tipe Data:
                                </Text>
                                <View style={styles.statusRow}>
                                  {(['text', 'number', 'date'] as const).map((type) => (
                                    <TouchableOpacity
                                      key={type}
                                      style={[
                                        styles.statusChip,
                                        column.type === type && styles.statusChipActive,
                                      ]}
                                      onPress={() =>
                                        handleColumnChange(column.id, 'type', type)
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.statusChipText,
                                          column.type === type &&
                                            styles.statusChipTextActive,
                                        ]}
                                      >
                                        {type === 'text'
                                          ? 'Teks'
                                          : type === 'number'
                                            ? 'Angka'
                                            : 'Tanggal'}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </View>
                            </View>
                          ))}
                        </ScrollView>
                      ) : (
                        <View style={styles.emptyVideoList}>
                          <Ionicons name="grid-outline" size={48} color="#CCC" />
                          <Text style={styles.emptyVideoText}>Belum ada kolom</Text>
                          <Text style={styles.emptyVideoSubtext}>
                            Klik &quot;Tambah Kolom&quot; untuk menambahkan
                          </Text>
                        </View>
                      )}
                    </View>

                    {formData.tableColumns && formData.tableColumns.length > 0 && (
                      <View style={styles.formGroup}>
                        <View style={styles.videoListHeader}>
                          <Text style={styles.label}>Data Baris</Text>
                          <TouchableOpacity
                            style={styles.addVideoButton}
                            onPress={handleAddRow}
                          >
                            <Ionicons name="add-circle" size={20} color="#8B4513" />
                            <Text style={styles.addVideoText}>Tambah Baris</Text>
                          </TouchableOpacity>
                        </View>
                        {formData.tableData && formData.tableData.length > 0 ? (
                          <ScrollView style={{ maxHeight: 300 }}>
                            {formData.tableData.map((row, rowIndex) => (
                              <View key={rowIndex} style={styles.videoItem}>
                                <View style={styles.videoItemHeader}>
                                  <Text style={styles.videoItemTitle}>
                                    Baris {rowIndex + 1}
                                  </Text>
                                  <TouchableOpacity
                                    onPress={() => handleRemoveRow(rowIndex)}
                                  >
                                    <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                                  </TouchableOpacity>
                                </View>
                                {formData.tableColumns?.map((column) => (
                                  <TextInput
                                    key={column.id}
                                    style={[styles.input, { marginTop: 8 }]}
                                    value={String(row[column.id] || '')}
                                    onChangeText={(text) =>
                                      handleRowCellChange(rowIndex, column.id, text)
                                    }
                                    placeholder={column.label || 'Isi data'}
                                    keyboardType={
                                      column.type === 'number' ? 'numeric' : 'default'
                                    }
                                  />
                                ))}
                              </View>
                            ))}
                          </ScrollView>
                        ) : (
                          <View style={styles.emptyVideoList}>
                            <Ionicons name="list-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyVideoText}>Belum ada data</Text>
                            <Text style={styles.emptyVideoSubtext}>
                              Klik &quot;Tambah Baris&quot; untuk menambahkan data
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Icon</Text>
                  <View style={styles.iconPreviewRow}>
                    <View style={styles.iconPreviewCircle}>
                      <Ionicons
                        name={(formData.icon || 'document-text') as any}
                        size={22}
                        color="#8B4513"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.iconPreviewName}>
                        {formData.icon || 'document-text'}
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
                    Icon akan tampil di menu utama dan daftar halaman.
                  </Text>
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
        </KeyboardAvoidingView>
      </Modal>

      <IconPicker
        visible={iconPickerVisible}
        value={formData.icon}
        onClose={() => setIconPickerVisible(false)}
        onSelect={(iconName) => {
          setFormData((prev) => ({ ...prev, icon: iconName }));
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
  addChildButton: {
    backgroundColor: '#FFF5E0',
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
  richEditorContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  richToolbar: {
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  richEditor: {
    minHeight: 200,
    backgroundColor: '#fff',
    padding: 8,
  },
  videoListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF8F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  addVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  videoItem: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  videoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  emptyVideoList: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDD',
  },
  emptyVideoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptyVideoSubtext: {
    fontSize: 13,
    color: '#BBB',
    marginTop: 4,
    textAlign: 'center',
  },
  iconPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPreviewCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  infoParentBox: {
    marginBottom: 16,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFF5E0',
    flexDirection: 'column',
    gap: 4,
  },
  infoParentLabel: {
    fontSize: 12,
    color: '#A67C52',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoParentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoParentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4037',
  },
  richHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  richHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoSavePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  autoSaveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5D4037',
  },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D5C7',
    backgroundColor: '#FFF',
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF',
  },
  modeBtnActive: {
    backgroundColor: '#FFF5E0',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666',
  },
  modeBtnTextActive: {
    color: '#5D4037',
  },
  previewBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    padding: 12,
  },
});
