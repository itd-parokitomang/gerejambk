import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import SettingsPage from '../../components/admin/SettingsPage';
import PagesManagement from '../../components/admin/PagesManagement';

type AdminPage = 'overview' | 'settings' | 'pages' | 'users';

export default function AdminDashboard() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [activePage, setActivePage] = useState<AdminPage>('overview');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    console.log('[Dashboard] User:', user?.email);
    console.log('[Dashboard] Profile:', profile);
  }, [user, profile]);

  const handleLogout = async () => {
    await logout();
    router.replace('/adm');
  };

  const handleBackHome = () => {
    router.push('/');
  };

  const menuItems = [
    { id: 'overview' as AdminPage, icon: 'home', label: 'Dashboard', badge: null },
    { id: 'settings' as AdminPage, icon: 'settings', label: 'Settings Umum', badge: null },
    { id: 'pages' as AdminPage, icon: 'document-text', label: 'Kelola Halaman', badge: null },
    { id: 'users' as AdminPage, icon: 'people', label: 'Kelola User', badge: profile?.role === 'superadmin' ? null : 'Admin Only' },
  ];

  // Show loading state
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if no profile
  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Profile not found. Please try logging in again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleLogout}>
            <Text style={styles.retryButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.pageTitle}>Dashboard Overview</Text>
            
            {/* Welcome Card */}
            <View style={styles.card}>
              <Ionicons name="person-circle" size={64} color="#8B4513" />
              <Text style={styles.welcomeText}>Selamat Datang</Text>
              <Text style={styles.emailText}>{profile.email}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {profile.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="document-text" size={32} color="#8B4513" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Halaman</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={32} color="#8B4513" />
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="eye" size={32} color="#8B4513" />
                <Text style={styles.statNumber}>-</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
            </View>
          </View>
        );
      
      case 'settings':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.pageTitle}>Settings Umum</Text>
            <Text style={styles.pageSubtitle}>Kelola pengaturan aplikasi</Text>
            <SettingsPage />
          </View>
        );
      
      case 'pages':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.pageTitle}>Kelola Halaman</Text>
            <Text style={styles.pageSubtitle}>Buat dan edit halaman aplikasi</Text>
            <PagesManagement />
          </View>
        );
      
      case 'users':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.pageTitle}>Kelola User</Text>
            <Text style={styles.pageSubtitle}>Manajemen admin dan user</Text>
            <View style={styles.card}>
              <Text style={styles.placeholderText}>User management coming soon...</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isMobile && (
            <TouchableOpacity 
              onPress={() => setShowMobileSidebar(!showMobileSidebar)} 
              style={styles.menuButton}
            >
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleBackHome} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        {/* Sidebar */}
        {(!isMobile || showMobileSidebar) && (
          <View style={[styles.sidebar, isMobile && styles.mobileSidebar]}>
            <View style={styles.sidebarContent}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    activePage === item.id && styles.menuItemActive,
                  ]}
                  onPress={() => {
                    setActivePage(item.id);
                    if (isMobile) setShowMobileSidebar(false);
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={activePage === item.id ? '#8B4513' : '#666'}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      activePage === item.id && styles.menuLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Main Content */}
        <ScrollView style={styles.content}>
          {renderContent()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#E0D5C7',
  },
  mobileSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sidebarContent: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#FFF8F0',
  },
  menuLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#8B4513',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentSection: {
    padding: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B4513',
    marginTop: 16,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8B4513',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
