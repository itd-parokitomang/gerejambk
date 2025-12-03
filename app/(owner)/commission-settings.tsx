import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TextInput, Alert, Modal, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios16Components, ios16Palette, ios16Radii, ios16Spacing, ios16Typography } from '@/constants/ios16TemplateStyles';

type CommissionSetting = {
  id: string;
  customer_id: string;
  sales_id: string;
  percentage: number;
  customers?: { name: string };
  user_profiles?: { full_name: string | null };
};

type Customer = {
  id: string;
  name: string;
  sales_id: string;
};

type Sales = {
  id: string;
  full_name: string | null;
  user_id: string;
};

export default function CommissionSettingsScreen() {
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sales[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSetting, setEditingSetting] = useState<CommissionSetting | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [formErrors, setFormErrors] = useState({
    customer_id: '',
    sales_id: '',
    percentage: '',
  });
  const [formData, setFormData] = useState({
    customer_id: '',
    sales_id: '',
    percentage: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load commission settings dengan customers (ada foreign key langsung)
      const { data: settingsData, error: settingsError } = await supabase
        .from('commission_settings')
        .select(`
          *,
          customers:customer_id(name)
        `)
        .order('created_at', { ascending: false });

      if (settingsError) throw settingsError;

      // Ambil semua unique sales_id dari settings
      const salesIds = settingsData 
        ? [...new Set(settingsData.map(s => s.sales_id).filter(Boolean))]
        : [];
      
      // Ambil data user_profiles untuk semua sales
      let salesProfilesMap: Record<string, { full_name: string | null }> = {};
      if (salesIds.length > 0) {
        const { data: salesProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, full_name')
          .in('user_id', salesIds);

        if (profilesError) {
          console.error('Error loading sales profiles:', profilesError);
        } else if (salesProfiles) {
          salesProfiles.forEach(profile => {
            salesProfilesMap[profile.user_id] = { full_name: profile.full_name };
          });
        }
      }

      // Gabungkan data settings dengan sales profiles
      const settingsWithSales = settingsData 
        ? settingsData.map(setting => ({
            ...setting,
            user_profiles: salesProfilesMap[setting.sales_id] || { full_name: null },
          }))
        : [];

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, sales_id')
        .order('name', { ascending: true });

      if (customersError) throw customersError;

      // Load sales
      const { data: salesData, error: salesError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'sales');

      if (salesError) throw salesError;

      setSettings(settingsWithSales);
      setCustomers(customersData || []);
      setSales(salesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('handleSave called', { formData, editingSetting });
    
    // Tutup dropdown jika masih terbuka
    setShowCustomerDropdown(false);
    setShowSalesDropdown(false);

    // Reset errors
    const errors = {
      customer_id: '',
      sales_id: '',
      percentage: '',
    };
    let hasError = false;

    // Validasi dengan feedback visual
    if (!formData.customer_id) {
      errors.customer_id = 'Pilih pelanggan terlebih dahulu';
      hasError = true;
    }

    if (!formData.sales_id) {
      errors.sales_id = 'Pilih sales terlebih dahulu';
      hasError = true;
    }

    if (!formData.percentage || formData.percentage.trim() === '') {
      errors.percentage = 'Masukkan persentase komisi';
      hasError = true;
    } else {
      const percentage = parseFloat(formData.percentage.trim());
      
      if (isNaN(percentage)) {
        errors.percentage = 'Persentase harus berupa angka';
        hasError = true;
      } else if (percentage < 0 || percentage > 100) {
        errors.percentage = 'Persentase harus antara 0-100';
        hasError = true;
      }
    }

    // Set errors untuk ditampilkan
    setFormErrors(errors);

    if (hasError) {
      // Scroll ke field pertama yang error
      Alert.alert('Error', 'Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Clear errors jika validasi berhasil
    setFormErrors({
      customer_id: '',
      sales_id: '',
      percentage: '',
    });

    const percentage = parseFloat(formData.percentage.trim());

    setIsSaving(true);
    try {
      const settingData = {
        customer_id: formData.customer_id,
        sales_id: formData.sales_id,
        percentage: percentage,
      };

      console.log('Saving commission setting:', settingData);
      console.log('Setting data to insert/update:', JSON.stringify(settingData, null, 2));

      if (editingSetting) {
        console.log('Updating existing setting with id:', editingSetting.id);
        const { data, error } = await supabase
          .from('commission_settings')
          .update(settingData)
          .eq('id', editingSetting.id)
          .select();
        if (error) {
          console.error('Update error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw error;
        }
        console.log('Update success:', data);
        Alert.alert('Berhasil', 'Pengaturan komisi berhasil diperbarui');
      } else {
        console.log('Inserting new setting');
        const { data, error } = await supabase
          .from('commission_settings')
          .insert(settingData)
          .select();
        if (error) {
          console.error('Insert error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw error;
        }
        console.log('Insert success:', data);
        Alert.alert('Berhasil', 'Pengaturan komisi berhasil ditambahkan');
      }

      setIsModalVisible(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Error saving commission setting:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      const errorMessage = error?.message || error?.details || 'Gagal menyimpan pengaturan komisi';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (setting: CommissionSetting) => {
    setEditingSetting(setting);
    setFormData({
      customer_id: setting.customer_id,
      sales_id: setting.sales_id,
      percentage: setting.percentage.toString(),
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Hapus Pengaturan',
      'Apakah Anda yakin ingin menghapus pengaturan komisi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('commission_settings').delete().eq('id', id);
              if (error) throw error;
              await loadData();
            } catch (error) {
              console.error('Error deleting setting:', error);
              Alert.alert('Error', 'Gagal menghapus pengaturan');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingSetting(null);
    setShowCustomerDropdown(false);
    setShowSalesDropdown(false);
    setFormData({
      customer_id: '',
      sales_id: '',
      percentage: '',
    });
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={ios16Typography.largeTitle}>Pengaturan Komisi</Text>
          <Button
            title="Tambah Pengaturan"
            onPress={() => {
              resetForm();
              setIsModalVisible(true);
            }}
            style={styles.addButton}
          />
        </View>

        {settings.map((setting) => (
          <Card key={setting.id} style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={[ios16Typography.headline, styles.customerName]}>
                {setting.customers?.name || 'N/A'}
              </Text>
              <Text style={[ios16Typography.body, styles.salesName]}>
                Sales: {setting.user_profiles?.full_name || 'N/A'}
              </Text>
              <Text style={[ios16Typography.title2, styles.percentage]}>
                {setting.percentage}%
              </Text>
            </View>
            <View style={styles.actions}>
              <Button
                title="Edit"
                onPress={() => handleEdit(setting)}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Hapus"
                onPress={() => handleDelete(setting.id)}
                variant="secondary"
                style={styles.actionButton}
              />
            </View>
          </Card>
        ))}

        <Modal 
          visible={isModalVisible} 
          animationType="slide" 
          transparent
          onRequestClose={() => {
            setIsModalVisible(false);
            resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <ScrollView
                onScrollBeginDrag={() => {
                  setShowCustomerDropdown(false);
                  setShowSalesDropdown(false);
                }}
              >
                <Text style={[ios16Typography.largeTitle, styles.modalTitle]}>
                  {editingSetting ? 'Edit Pengaturan Komisi' : 'Tambah Pengaturan Komisi'}
                </Text>

                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={ios16Typography.subheadline}>Pelanggan *</Text>
                    <Pressable
                      style={[
                        styles.dropdown,
                        formErrors.customer_id && styles.dropdownError
                      ]}
                      onPress={() => {
                        setShowSalesDropdown(false);
                        setShowCustomerDropdown(!showCustomerDropdown);
                        // Clear error saat user mulai memilih
                        if (formErrors.customer_id) {
                          setFormErrors({ ...formErrors, customer_id: '' });
                        }
                      }}
                    >
                      <Text style={[
                        ios16Typography.body,
                        styles.dropdownText,
                        !formData.customer_id && styles.dropdownPlaceholder
                      ]}>
                        {formData.customer_id 
                          ? customers.find(c => c.id === formData.customer_id)?.name || 'Pilih Pelanggan'
                          : 'Pilih Pelanggan'}
                      </Text>
                      <IconSymbol
                        name="chevron.down"
                        size={20}
                        color={ios16Palette.textPrimaryLight80}
                        style={[
                          styles.dropdownIcon,
                          showCustomerDropdown && styles.dropdownIconOpen
                        ]}
                      />
                    </Pressable>
                    {formErrors.customer_id ? (
                      <Text style={styles.errorText}>{formErrors.customer_id}</Text>
                    ) : null}
                    {showCustomerDropdown && (
                      <View style={styles.dropdownList}>
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {customers.map((customer) => (
                            <TouchableOpacity
                              key={customer.id}
                              style={[
                                styles.dropdownItem,
                                formData.customer_id === customer.id && styles.dropdownItemActive,
                              ]}
                              onPress={() => {
                                setFormData({ ...formData, customer_id: customer.id });
                                setShowCustomerDropdown(false);
                                // Clear error saat sudah memilih
                                if (formErrors.customer_id) {
                                  setFormErrors({ ...formErrors, customer_id: '' });
                                }
                              }}
                            >
                              <Text
                                style={[
                                  ios16Typography.body,
                                  styles.dropdownItemText,
                                  formData.customer_id === customer.id && styles.dropdownItemTextActive,
                                ]}
                              >
                                {customer.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={styles.field}>
                    <Text style={ios16Typography.subheadline}>Sales *</Text>
                    <Pressable
                      style={[
                        styles.dropdown,
                        formErrors.sales_id && styles.dropdownError
                      ]}
                      onPress={() => {
                        setShowCustomerDropdown(false);
                        setShowSalesDropdown(!showSalesDropdown);
                        // Clear error saat user mulai memilih
                        if (formErrors.sales_id) {
                          setFormErrors({ ...formErrors, sales_id: '' });
                        }
                      }}
                    >
                      <Text style={[
                        ios16Typography.body,
                        styles.dropdownText,
                        !formData.sales_id && styles.dropdownPlaceholder
                      ]}>
                        {formData.sales_id 
                          ? sales.find(s => s.user_id === formData.sales_id)?.full_name || 'Pilih Sales'
                          : 'Pilih Sales'}
                      </Text>
                      <IconSymbol
                        name="chevron.down"
                        size={20}
                        color={ios16Palette.textPrimaryLight80}
                        style={[
                          styles.dropdownIcon,
                          showSalesDropdown && styles.dropdownIconOpen
                        ]}
                      />
                    </Pressable>
                    {formErrors.sales_id ? (
                      <Text style={styles.errorText}>{formErrors.sales_id}</Text>
                    ) : null}
                    {showSalesDropdown && (
                      <View style={styles.dropdownList}>
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {sales.map((sale) => (
                            <TouchableOpacity
                              key={sale.id}
                              style={[
                                styles.dropdownItem,
                                formData.sales_id === sale.user_id && styles.dropdownItemActive,
                              ]}
                              onPress={() => {
                                setFormData({ ...formData, sales_id: sale.user_id });
                                setShowSalesDropdown(false);
                                // Clear error saat sudah memilih
                                if (formErrors.sales_id) {
                                  setFormErrors({ ...formErrors, sales_id: '' });
                                }
                              }}
                            >
                              <Text
                                style={[
                                  ios16Typography.body,
                                  styles.dropdownItemText,
                                  formData.sales_id === sale.user_id && styles.dropdownItemTextActive,
                                ]}
                              >
                                {sale.full_name || 'N/A'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={styles.field}>
                    <Text style={ios16Typography.subheadline}>Persentase Komisi (%) *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        formErrors.percentage && styles.inputError
                      ]}
                      value={formData.percentage}
                      onChangeText={(text) => {
                        console.log('Percentage input changed:', text);
                        setFormData({ ...formData, percentage: text });
                        // Clear error saat user mulai mengetik
                        if (formErrors.percentage) {
                          setFormErrors({ ...formErrors, percentage: '' });
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="10"
                      placeholderTextColor={ios16Palette.textQuaternaryLight}
                      returnKeyType="done"
                    />
                    {formErrors.percentage ? (
                      <Text style={styles.errorText}>{formErrors.percentage}</Text>
                    ) : null}
                  </View>

                  <View style={styles.actions}>
                    <Button
                      title="Batal"
                      onPress={() => {
                        setIsModalVisible(false);
                        resetForm();
                      }}
                      variant="secondary"
                      style={styles.actionButton}
                      disabled={isSaving}
                    />
                    <Button 
                      title={isSaving ? 'Menyimpan...' : 'Simpan'} 
                      onPress={handleSave} 
                      style={styles.actionButton}
                      loading={isSaving}
                      disabled={isSaving}
                    />
                  </View>
                </View>
              </ScrollView>
            </Card>
          </View>
        </Modal>
      </ScrollView>
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
    padding: ios16Spacing.lg,
    gap: ios16Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: ios16Spacing.md,
    gap: ios16Spacing.md,
  },
  addButton: {
    width: 'auto',
    alignSelf: 'flex-start',
  },
  settingCard: {
    gap: ios16Spacing.md,
  },
  settingInfo: {
    gap: ios16Spacing.xs,
  },
  customerName: {
    color: ios16Palette.textPrimaryLight80,
  },
  salesName: {
    color: ios16Palette.textPrimaryLight80,
  },
  percentage: {
    color: ios16Palette.accentBlue,
  },
  actions: {
    flexDirection: 'row',
    gap: ios16Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ios16Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: ios16Spacing.lg,
    color: ios16Palette.textPrimaryLight80,
  },
  form: {
    gap: ios16Spacing.md,
  },
  field: {
    gap: ios16Spacing.xs,
  },
  input: {
    backgroundColor: ios16Palette.backgroundMutedLight,
    borderRadius: ios16Radii.card,
    paddingHorizontal: ios16Spacing.lg,
    paddingVertical: ios16Spacing.md,
    color: ios16Palette.textPrimaryLight80,
    fontSize: 11,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ios16Palette.backgroundMutedLight,
    borderRadius: ios16Radii.card,
    paddingHorizontal: ios16Spacing.md,
    paddingVertical: ios16Spacing.md,
    borderWidth: 1,
    borderColor: ios16Palette.borderLight,
    minHeight: 44,
  },
  dropdownText: {
    flex: 1,
    color: ios16Palette.textPrimaryLight80,
  },
  dropdownPlaceholder: {
    color: ios16Palette.textQuaternaryLight,
  },
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
    marginLeft: ios16Spacing.xs,
  },
  dropdownIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    marginTop: ios16Spacing.xs,
    backgroundColor: ios16Palette.backgroundMutedLight,
    borderRadius: ios16Radii.card,
    borderWidth: 1,
    borderColor: ios16Palette.borderLight,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 1,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: ios16Spacing.md,
    paddingVertical: ios16Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ios16Palette.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: ios16Palette.accentBlue + '20',
  },
  dropdownItemText: {
    color: ios16Palette.textPrimaryLight80,
  },
  dropdownItemTextActive: {
    color: ios16Palette.accentBlue,
    fontWeight: '600',
  },
  dropdownError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
