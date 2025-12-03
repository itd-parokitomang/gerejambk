import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, Pressable, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios16Components, ios16Palette, ios16Spacing, ios16Typography, ios16Radii } from '@/constants/ios16TemplateStyles';
import { formatDate } from '@/lib/utils/date-utils';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/utils/role-check';

type UserProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  created_at: string;
  email?: string;
};

export default function UsersScreen() {
  const { createUserAsAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'sales' as UserRole,
  });

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Gunakan database function untuk mendapatkan users dengan email
      const { data, error } = await supabase.rpc('get_users_with_email');

      if (error) throw error;

      if (data) {
        // Sort by created_at descending
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        setUsers(sortedData);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Hapus Pengguna',
      `Apakah Anda yakin ingin menghapus ${userName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', userId);

              if (error) throw error;
              await loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Gagal menghapus pengguna');
            }
          },
        },
      ]
    );
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await createUserAsAdmin({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
      });

      if (error) {
        throw error;
      }

      Alert.alert('Berhasil', 'User berhasil dibuat', [
        {
          text: 'OK',
          onPress: () => {
            setShowAddModal(false);
            setFormData({ email: '', password: '', fullName: '', role: 'sales' });
            loadUsers();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error creating user:', error);
      Alert.alert('Error', error.message || 'Gagal membuat user');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, ios16Components.screenLight]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ios16Palette.accentBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, ios16Components.screenLight]}>
      <Header title="Manajemen Pengguna" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Button
          title="Tambah User Baru"
          onPress={() => setShowAddModal(true)}
          variant="primary"
          style={styles.addButton}
        />

        {users.map((user) => {
          const isExpanded = expandedUsers.has(user.id);
          return (
            <Card key={user.id} style={styles.userCard}>
              <Pressable
                style={styles.userHeader}
                onPress={() => toggleUser(user.id)}
                android_ripple={{ color: ios16Palette.backgroundMutedLight }}
              >
                <View style={styles.userHeaderContent}>
                  <IconSymbol
                    name="chevron.right"
                    size={16}
                    color={ios16Palette.textPrimaryLight80}
                    style={[
                      styles.chevronIcon,
                      isExpanded && styles.chevronIconExpanded,
                    ]}
                  />
                  <Text style={[ios16Typography.headline, styles.userName]}>
                    {user.full_name || 'Tidak ada nama'}
                  </Text>
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.userDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[ios16Typography.caption, styles.detailLabel]}>Email:</Text>
                    <Text style={[ios16Typography.caption, styles.detailValue]}>
                      {user.email || 'Tidak ada email'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[ios16Typography.caption, styles.detailLabel]}>Role:</Text>
                    <Text style={[ios16Typography.caption, styles.roleBadge]}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[ios16Typography.caption, styles.detailLabel]}>Dibuat:</Text>
                    <Text style={[ios16Typography.caption, styles.detailValue]}>
                      {formatDate(user.created_at)}
                    </Text>
                  </View>
                  {user.phone && (
                    <View style={styles.detailRow}>
                      <Text style={[ios16Typography.caption, styles.detailLabel]}>Telepon:</Text>
                      <Text style={[ios16Typography.caption, styles.detailValue]}>
                        {user.phone}
                      </Text>
                    </View>
                  )}
                  <View style={styles.deleteButtonContainer}>
                    <Button
                      title="Hapus"
                      onPress={() => handleDeleteUser(user.id, user.full_name || 'User')}
                      variant="secondary"
                      style={styles.deleteButton}
                    />
                  </View>
                </View>
              )}
            </Card>
          );
        })}

        {users.length === 0 && (
          <Card>
            <Text style={[ios16Typography.body, styles.emptyText]}>Tidak ada pengguna</Text>
          </Card>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <Text style={[ios16Typography.title2, styles.modalTitle]}>Tambah User Baru</Text>

              <View style={styles.formField}>
                <Text style={[ios16Typography.subheadline, styles.label]}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  placeholder="John Doe"
                  placeholderTextColor={ios16Palette.textQuaternaryLight}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[ios16Typography.subheadline, styles.label]}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="user@example.com"
                  placeholderTextColor={ios16Palette.textQuaternaryLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.formField}>
                <Text style={[ios16Typography.subheadline, styles.label]}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="••••••••"
                  placeholderTextColor={ios16Palette.textQuaternaryLight}
                  secureTextEntry
                />
              </View>

              <View style={styles.formField}>
                <Text style={[ios16Typography.subheadline, styles.label]}>Role</Text>
                <View style={styles.roleContainer}>
                  {(['owner', 'admin', 'sales'] as UserRole[]).map((role) => (
                    <Pressable
                      key={role}
                      style={[
                        styles.roleButton,
                        formData.role === role && styles.roleButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, role })}
                    >
                      <Text
                        style={[
                          ios16Typography.subheadline,
                          formData.role === role ? styles.roleButtonTextActive : styles.roleButtonText,
                        ]}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Batal"
                  onPress={() => {
                    setShowAddModal(false);
                    setFormData({ email: '', password: '', fullName: '', role: 'sales' });
                  }}
                  variant="secondary"
                  style={styles.modalButton}
                  disabled={isCreating}
                />
                <Button
                  title={isCreating ? 'Membuat...' : 'Buat User'}
                  onPress={handleCreateUser}
                  variant="primary"
                  style={styles.modalButton}
                  loading={isCreating}
                  disabled={isCreating}
                />
              </View>
            </Card>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ios16Spacing.xs,
    paddingVertical: ios16Spacing.xs,
    gap: ios16Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    overflow: 'hidden',
  },
  userHeader: {
    paddingVertical: ios16Spacing.xs,
    paddingHorizontal: ios16Spacing.xs,
  },
  userHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ios16Spacing.xs,
  },
  chevronIcon: {
    transform: [{ rotate: '0deg' }],
    transition: 'transform 0.2s',
  },
  chevronIconExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  userName: {
    color: ios16Palette.textPrimaryLight80,
    flex: 1,
  },
  userDetails: {
    paddingHorizontal: ios16Spacing.xs,
    paddingBottom: ios16Spacing.xs,
    gap: ios16Spacing.xxs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ios16Palette.borderLight,
    marginTop: ios16Spacing.xxs,
    paddingTop: ios16Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ios16Spacing.xs,
  },
  detailLabel: {
    color: ios16Palette.textQuaternaryLight,
    minWidth: 60,
  },
  detailValue: {
    color: ios16Palette.textPrimaryLight80,
    flex: 1,
  },
  roleBadge: {
    color: ios16Palette.accentBlue,
    fontWeight: '600',
  },
  deleteButtonContainer: {
    marginTop: ios16Spacing.xxs,
    paddingTop: ios16Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ios16Palette.borderLight,
  },
  deleteButton: {
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
    color: ios16Palette.textPrimaryLight80,
    padding: ios16Spacing.xl,
  },
  addButton: {
    marginBottom: ios16Spacing.xs,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ios16Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    padding: ios16Spacing.xl,
    gap: ios16Spacing.lg,
  },
  modalTitle: {
    marginBottom: ios16Spacing.md,
    color: ios16Palette.textPrimaryLight80,
  },
  formField: {
    gap: ios16Spacing.xs,
  },
  label: {
    color: ios16Palette.textPrimaryLight80,
  },
  input: {
    backgroundColor: ios16Palette.backgroundMutedLight,
    borderRadius: ios16Radii.card,
    paddingHorizontal: ios16Spacing.lg,
    paddingVertical: ios16Spacing.md,
    color: ios16Palette.textPrimaryLight80,
    fontSize: 11,
    borderWidth: 1,
    borderColor: ios16Palette.strokeDark,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: ios16Spacing.sm,
    flexWrap: 'wrap',
  },
  roleButton: {
    paddingHorizontal: ios16Spacing.lg,
    paddingVertical: ios16Spacing.sm,
    borderRadius: ios16Radii.card,
    borderWidth: 1,
    borderColor: ios16Palette.strokeDark,
    backgroundColor: ios16Palette.backgroundMutedLight,
  },
  roleButtonActive: {
    backgroundColor: ios16Palette.accentBlue,
    borderColor: ios16Palette.accentBlue,
  },
  roleButtonText: {
    color: ios16Palette.textPrimaryLight80,
  },
  roleButtonTextActive: {
    color: ios16Palette.textPrimaryLight80,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: ios16Spacing.md,
    marginTop: ios16Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

