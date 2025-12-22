import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
};

const clampUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled,
  minHeight = 220,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const lastAppliedValueRef = useRef<string>('');

  const safeValue = useMemo(() => sanitizeHtml(value || ''), [value]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isFocused) return;
    if (safeValue === lastAppliedValueRef.current) return;

    el.innerHTML = safeValue || '';
    lastAppliedValueRef.current = safeValue;
  }, [safeValue, isFocused]);

  const exec = (command: string, valueArg?: string) => {
    if (disabled) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, valueArg);
    const next = sanitizeHtml(el.innerHTML || '');
    lastAppliedValueRef.current = next;
    onChange(next);
  };

  const insertHtml = (html: string) => {
    if (disabled) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand('insertHTML', false, html);
    const next = sanitizeHtml(el.innerHTML || '');
    lastAppliedValueRef.current = next;
    onChange(next);
  };

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const next = sanitizeHtml(el.innerHTML || '');
    lastAppliedValueRef.current = next;
    onChange(next);
  };

  const handlePickImage = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (file: File) => {
    if (disabled) return;
    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
      reader.readAsDataURL(file);
    });

    if (!/^data:image\//i.test(dataUrl)) return;
    insertHtml(`<img src="${dataUrl}" alt="image" style="max-width:100%;height:auto;" />`);
  };

  const handleInsertLink = () => {
    if (disabled) return;
    const raw = window.prompt('Masukkan URL tautan (https://...)', 'https://');
    if (raw === null) return;
    const url = clampUrl(raw);
    if (!url) return;
    exec('createLink', url);
  };

  const handleInsertVideo = () => {
    if (disabled) return;
    const raw = window.prompt('Masukkan URL video embed (https://...)', 'https://');
    if (raw === null) return;
    const url = clampUrl(raw);
    if (!url) return;
    insertHtml(
      `<div style="position:relative;padding-top:56.25%;"><iframe src="${url}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`,
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, disabled && styles.toolbarDisabled]}>
        <TouchableOpacity style={styles.toolBtn} onPress={() => exec('bold')} disabled={disabled}>
          <Text style={styles.toolText}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => exec('italic')} disabled={disabled}>
          <Text style={styles.toolText}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => exec('underline')} disabled={disabled}>
          <Text style={styles.toolText}>U</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => exec('formatBlock', 'H1')} disabled={disabled}>
          <Text style={styles.toolText}>H1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => exec('formatBlock', 'H2')} disabled={disabled}>
          <Text style={styles.toolText}>H2</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => exec('insertUnorderedList')} disabled={disabled}>
          <Ionicons name="list" size={18} color="#5D4037" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => exec('insertOrderedList')} disabled={disabled}>
          <Ionicons name="list-circle" size={18} color="#5D4037" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handleInsertLink} disabled={disabled}>
          <Ionicons name="link" size={18} color="#5D4037" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handlePickImage} disabled={disabled}>
          <Ionicons name="image" size={18} color="#5D4037" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handleInsertVideo} disabled={disabled}>
          <Ionicons name="videocam" size={18} color="#5D4037" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => exec('removeFormat')} disabled={disabled}>
          <Ionicons name="close-circle" size={18} color="#5D4037" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.editorOuter,
          { minHeight },
          disabled && styles.editorOuterDisabled,
        ]}
      >
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          data-placeholder={placeholder || 'Tulis konten di sini...'}
          style={{
            outline: 'none',
            minHeight: `${minHeight}px`,
            padding: 12,
            fontSize: 14,
            lineHeight: 1.6,
            color: '#333',
          }}
          suppressContentEditableWarning
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void handleImageSelected(file);
            e.target.value = '';
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 8,
  },
  toolbarDisabled: {
    opacity: 0.6,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5E0',
    borderWidth: 1,
    borderColor: '#E0D5C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5D4037',
  },
  editorOuter: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  editorOuterDisabled: {
    opacity: 0.7,
  },
});
