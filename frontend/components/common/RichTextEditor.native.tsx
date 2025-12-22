import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import type { RichEditor as TRichEditor } from 'react-native-pell-rich-editor';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
};

const isSafeHttpUrl = (url: string): boolean => /^https?:\/\//i.test(url.trim());

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled,
  minHeight = 220,
}: RichTextEditorProps) {
  const richTextRef = useRef<TRichEditor | null>(null);
  const safeValue = useMemo(() => sanitizeHtml(value || ''), [value]);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://');
  const [pickingImage, setPickingImage] = useState(false);

  const insertImage = async () => {
    if (disabled) return;
    setPickingImage(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;
      const base64 = result.assets?.[0]?.base64;
      if (!base64) return;

      const dataUrl = `data:image/jpeg;base64,${base64}`;
      richTextRef.current?.insertImage(dataUrl);
    } finally {
      setPickingImage(false);
    }
  };

  const openVideoModal = () => {
    if (disabled) return;
    setVideoUrl('https://');
    setVideoModalVisible(true);
  };

  const submitVideo = () => {
    const url = videoUrl.trim();
    if (!isSafeHttpUrl(url)) {
      setVideoModalVisible(false);
      return;
    }
    richTextRef.current?.insertVideo(url);
    setVideoModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.toolbarWrap, disabled && styles.toolbarDisabled]}>
        <RichToolbar
          editor={richTextRef}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.heading1,
            actions.heading2,
            actions.insertBulletsList,
            actions.insertOrderedList,
            actions.insertLink,
            actions.insertImage,
            actions.insertVideo,
            actions.undo,
            actions.redo,
          ]}
          onPressAddImage={insertImage}
          onPress={(action: string) => {
            if (action === actions.insertVideo) {
              openVideoModal();
            }
          }}
          iconTint="#5D4037"
          selectedIconTint="#8B4513"
          style={styles.richToolbar}
        />
        {pickingImage && (
          <View style={styles.pickingOverlay}>
            <ActivityIndicator color="#8B4513" />
            <Text style={styles.pickingText}>Memproses gambar...</Text>
          </View>
        )}
      </View>

      <View style={[styles.editorOuter, { minHeight }]}>
        <RichEditor
          ref={richTextRef}
          initialContentHTML={safeValue}
          onChange={(html: string) => onChange(sanitizeHtml(html))}
          placeholder={placeholder || 'Tulis konten di sini...'}
          disabled={Boolean(disabled)}
          style={styles.richEditor}
        />
      </View>

      <Modal visible={videoModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sisipkan Video</Text>
              <TouchableOpacity onPress={() => setVideoModalVisible(false)}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>Masukkan URL video (https://...)</Text>
            <TextInput
              style={styles.modalInput}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setVideoModalVisible(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={submitVideo}>
                <Text style={styles.modalBtnText}>Sisipkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  toolbarWrap: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  toolbarDisabled: {
    opacity: 0.7,
  },
  richToolbar: {
    backgroundColor: '#FFF',
  },
  editorOuter: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  richEditor: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
  },
  pickingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  pickingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  modalHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: '#8B4513',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnSecondary: {
    backgroundColor: '#EEE',
  },
  modalBtnText: {
    color: '#FFF',
    fontWeight: '800',
  },
  modalBtnSecondaryText: {
    color: '#555',
    fontWeight: '800',
  },
});
