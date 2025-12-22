import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const filteredIcons = useMemo(
    () =>
      ICON_CHOICES.filter(
        (icon) =>
          icon.name.toLowerCase().includes(search.toLowerCase()) ||
          icon.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

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
              const active = value === item.name;
              return (
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => {
                    onSelect(item.name);
                    setSearch('');
                  }}
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
  iconLabel: {
    fontSize: 11,
    color: '#555',
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



