import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/header';
import { ios16Components, ios16Palette, ios16Spacing, ios16Typography } from '@/constants/ios16TemplateStyles';
import { formatDate } from '@/lib/utils/date-utils';

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  package_id: string;
  sales_id: string;
  due_date: number;
  status: string;
  created_at: string;
  packages?: { name: string; speed_mbps: number; price_monthly: number };
  user_profiles?: { full_name: string | null };
};

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      // Ambil data customers dengan packages
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          packages:package_id(name, speed_mbps, price_monthly)
        `)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      if (!customersData || customersData.length === 0) {
        setCustomers([]);
        return;
      }

      // Ambil semua unique sales_id
      const salesIds = [...new Set(customersData.map(c => c.sales_id).filter(Boolean))];
      
      // Ambil data user_profiles untuk semua sales
      const { data: salesProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', salesIds);

      if (profilesError) {
        console.error('Error loading sales profiles:', profilesError);
        // Tetap tampilkan customers meskipun error loading profiles
        setCustomers(customersData.map(customer => ({
          ...customer,
          user_profiles: undefined,
        })));
        return;
      }

      // Buat map untuk lookup cepat
      const salesProfilesMap: Record<string, { full_name: string | null }> = {};
      if (salesProfiles) {
        salesProfiles.forEach(profile => {
          salesProfilesMap[profile.user_id] = { full_name: profile.full_name };
        });
      }

      // Gabungkan data
      const customersWithSales = customersData.map(customer => ({
        ...customer,
        user_profiles: salesProfilesMap[customer.sales_id] || { full_name: null },
      }));

      setCustomers(customersWithSales);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
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
      <Header 
        title="Daftar Pelanggan" 
        subtitle={`Total: ${customers.length} pelanggan`}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {customers.map((customer) => (
          <Card key={customer.id} style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <Text style={[ios16Typography.headline, styles.customerName]}>{customer.name}</Text>
              <Text style={[ios16Typography.body, styles.customerDetail]}>📞 {customer.phone}</Text>
              {customer.email && (
                <Text style={[ios16Typography.body, styles.customerDetail]}>✉️ {customer.email}</Text>
              )}
              <Text style={[ios16Typography.body, styles.customerDetail]}>📍 {customer.address}</Text>
              <View style={styles.meta}>
                <Text style={[ios16Typography.caption, styles.metaText]}>
                  Paket: {customer.packages?.name || 'N/A'} ({customer.packages?.speed_mbps} Mbps)
                </Text>
                <Text style={[ios16Typography.caption, styles.metaText]}>
                  Sales: {customer.user_profiles?.full_name || 'N/A'}
                </Text>
                <Text style={[ios16Typography.caption, styles.metaText]}>
                  Jatuh Tempo: Tanggal {customer.due_date}
                </Text>
                <Text style={[ios16Typography.caption, styles.metaText]}>
                  Status: {customer.status}
                </Text>
                <Text style={[ios16Typography.caption, styles.metaText]}>
                  Terdaftar: {formatDate(customer.created_at)}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {customers.length === 0 && (
          <Card>
            <Text style={[ios16Typography.body, styles.emptyText]}>Tidak ada pelanggan</Text>
          </Card>
        )}
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
  customerCard: {
    gap: ios16Spacing.md,
  },
  customerInfo: {
    gap: ios16Spacing.xs,
  },
  customerName: {
    color: ios16Palette.textPrimaryLight80,
  },
  customerDetail: {
    color: ios16Palette.textPrimaryLight80,
  },
  meta: {
    marginTop: ios16Spacing.xs,
    gap: ios16Spacing.xs,
  },
  metaText: {
    color: ios16Palette.textTertiaryLight,
  },
  emptyText: {
    textAlign: 'center',
    color: ios16Palette.textPrimaryLight80,
    padding: ios16Spacing.xl,
  },
});

