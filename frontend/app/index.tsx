import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SliderItem, getActiveSliders } from '../services/sliders.service';
import { PageContent, getActivePages } from '../services/pages.service';
import {
  getCustomIconById,
  getCustomIconId,
  isCustomIconRef,
} from '../services/icons.service';
import {
  AppSettings,
  getAppSettings,
  getMassScheduleHeroConfig,
  MassScheduleHeroConfig,
} from '../services/settings.service';
import { useAuth } from '../contexts/AuthContext';

// Default fallback jika collection sliders kosong
const DEFAULT_INFO_SLIDES: SliderItem[] = [
  {
    id: '1',
    title: 'Jadwal Misa',
    description: 'Lihat jadwal misa harian & mingguan',
    icon: 'calendar-outline',
    order: 0,
    active: true,
    createdAt: null as any,
    updatedAt: null as any,
  },
  {
    id: '2',
    title: 'Renungan',
    description: 'Renungan harian untuk memperkuat iman',
    icon: 'book-outline',
    order: 1,
    active: true,
    createdAt: null as any,
    updatedAt: null as any,
  },
  {
    id: '3',
    title: 'Kegiatan',
    description: 'Informasi acara & kegiatan paroki',
    icon: 'megaphone-outline',
    order: 2,
    active: true,
    createdAt: null as any,
    updatedAt: null as any,
  },
  {
    id: '4',
    title: 'Kontak',
    description: 'Hubungi sekretariat & layanan paroki',
    icon: 'call-outline',
    order: 3,
    active: true,
    createdAt: null as any,
    updatedAt: null as any,
  },
];

// Menu items default (fallback jika Firestore belum ada data)
const DEFAULT_MENU_ITEMS = [
  {
    id: '1',
    title: 'Misa Gereja & Intensi Misa',
    icon: 'calendar',
    route: '/pages/misa',
  },
  {
    id: '2',
    title: 'Paroki Tomang - Gereja MBK',
    icon: 'home',
    route: '/pages/paroki',
  },
  {
    id: '3',
    title: 'Pelayanan Gereja MBK',
    icon: 'hand-left',
    route: '/pages/pelayanan',
  },
  {
    id: '4',
    title: 'Renungan Harian Katolik',
    icon: 'book',
    route: '/pages/renungan',
  },
  {
    id: '5',
    title: 'Kegiatan MBK Akan Datang',
    icon: 'calendar-outline',
    route: '/pages/kegiatan',
  },
  {
    id: '6',
    title: 'Kontak & Informasi',
    icon: 'call',
    route: '/pages/kontak',
  },
];

export default function Index() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { user, logout, loading } = useAuth();
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [massScheduleHero, setMassScheduleHero] = useState<MassScheduleHeroConfig | null>(null);
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Debug user state changes - simplified
  useEffect(() => {
    console.log('[Home] User changed:', user?.email || 'logged out');
    console.log('[Home] Icon should show:', user ? 'logout icon' : 'person icon');
  }, [user]);

  useEffect(() => {
    const load = async () => {
      console.log('[Home] Loading sliders, user status:', user ? 'logged in' : 'logged out');
      
      // Always try to load from Firestore, regardless of user status
      try {
        const data = await getActiveSliders();
        if (data && data.length > 0) {
          setSliders(data);
          console.log('[Home] Loaded sliders from Firestore:', data.length);
        } else {
          // Only use default if no data from Firestore
          console.log('[Home] No sliders from Firestore, using defaults');
          setSliders(DEFAULT_INFO_SLIDES);
        }
      } catch (error) {
        console.error('[Home] Error loading sliders:', error);
        // Keep existing sliders if error, don't reset to default
        if (sliders.length === 0) {
          setSliders(DEFAULT_INFO_SLIDES);
        }
      }
    };
    
    // Only load on initial mount, not on user changes
    if (sliders.length === 0) {
      load();
    }
  }, []); // Remove user dependency

  // Separate effect for user changes - don't reload sliders
  useEffect(() => {
    console.log('[Home] User changed:', user?.email || 'logged out');
    console.log('[Home] Current sliders count:', sliders.length);
  }, [user]);

  useEffect(() => {
    const loadPages = async () => {
      if (user) {
        // User logged in, load data from Firestore
        try {
          const data = await getActivePages();
          setPages(data);
        } catch (error) {
          console.error('[Home] Error loading pages:', error);
          setPages(DEFAULT_MENU_ITEMS);
        }
      } else {
        // User logged out, use default data
        setPages(DEFAULT_MENU_ITEMS);
      }
    };
    loadPages();
  }, [user]);

  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        // User logged in, load settings from Firestore
        try {
          const data = await getAppSettings();
          setAppSettings(data);
        } catch (error) {
          console.error('[Home] Error loading settings:', error);
          setAppSettings(null);
        }
      } else {
        // User logged out, clear settings
        setAppSettings(null);
      }
    };
    loadSettings();
  }, [user]);

  useEffect(() => {
    const loadHero = async () => {
      if (user) {
        // User logged in, load hero config from Firestore
        try {
          const data = await getMassScheduleHeroConfig();
          setMassScheduleHero(data);
        } catch (error) {
          console.error('[Home] Error loading hero config:', error);
          setMassScheduleHero(null);
        }
      } else {
        // User logged out, clear hero config
        setMassScheduleHero(null);
      }
    };
    loadHero();
  }, [user]);

  useEffect(() => {
    if (!user) {
      // User logged out, clear custom icons
      setCustomIcons({});
      return;
    }

    // Only proceed if we have pages and sliders data
    if (pages.length === 0 && sliders.length === 0) return;

    const ids = new Set<string>();
    for (const p of pages) {
      if (p.icon && isCustomIconRef(p.icon)) ids.add(getCustomIconId(p.icon));
    }
    for (const s of sliders) {
      const icon = (s as any).icon as string | undefined;
      if (icon && isCustomIconRef(icon)) ids.add(getCustomIconId(icon));
    }
    
    // Only fetch missing icons
    const missing = Array.from(ids).filter((id) => !customIcons[id]);
    if (missing.length === 0) return;
    
    let cancelled = false;
    Promise.all(missing.map((id) => getCustomIconById(id))).then((docs) => {
      if (cancelled) return;
      setCustomIcons((prev) => {
        const next = { ...prev };
        docs.forEach((doc, idx) => {
          if (doc?.icon) next[missing[idx]] = doc.icon;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pages, sliders, user]); // Keep dependencies minimal

  // Calculate number of columns based on current window width
  const numColumns = windowWidth >= 1024 ? 5 : windowWidth >= 768 ? 4 : 3;
  
  // Calculate item width dynamically
  const gridHorizontalPadding = 16;
  const menuItemHorizontalMargin = 4;
  const availableWidth = windowWidth - (gridHorizontalPadding * 2);
  const itemWidth =
    (availableWidth / numColumns) - (menuItemHorizontalMargin * 2);

  const handleMenuPress = useCallback((route: Href) => {
    router.push(route);
  }, [router]);

  // Test logout function directly
  const testLogout = useCallback(() => {
    console.log('[Home] testLogout called directly');
    logout().then(() => {
      console.log('[Home] testLogout success');
    }).catch((error) => {
      console.error('[Home] testLogout error:', error);
    });
  }, [logout]);

  // Simplified avatar press handler
  const handleAvatarPress = useCallback(() => {
    console.log('[Home] Avatar clicked, user:', user?.email || 'none');
    
    if (user) {
      console.log('[Home] User is logged in, calling testLogout');
      testLogout();
    } else {
      console.log('[Home] User not logged in, going to login');
      router.push('/adm' as Href);
    }
  }, [user, testLogout, router]);

  const handleSliderPress = useCallback((item: SliderItem) => {
    if (item.targetType === 'page' && item.targetPageSlug) {
      router.push(`/pages/${item.targetPageSlug}` as Href);
      return;
    }

    if (item.targetType === 'url' && item.targetUrl) {
      const raw = item.targetUrl.trim();
      if (raw.startsWith('/')) {
        router.push(raw as Href);
        return;
      }
      const encodedUrl = encodeURIComponent(raw);
      const encodedTitle = encodeURIComponent(item.title || 'Tautan');
      router.push(`/slider-webview?url=${encodedUrl}&title=${encodedTitle}` as Href);
    }
  }, [router]);

  const effectiveMassHero: MassScheduleHeroConfig = massScheduleHero || {
    title: 'Jadwal Misa',
    value: 'Lihat',
    targetType: 'page',
    targetPageSlug: 'misa',
    updatedAt: null as any,
  };

  const handleMassHeroPress = useCallback(() => {
    const cfg = effectiveMassHero;
    if (cfg.targetType === 'page' && cfg.targetPageSlug) {
      router.push(`/pages/${cfg.targetPageSlug}` as Href);
      return;
    }
    if (cfg.targetType === 'url' && cfg.targetUrl) {
      const raw = cfg.targetUrl.trim();
      if (raw.startsWith('/')) {
        router.push(raw as Href);
        return;
      }
      const encodedUrl = encodeURIComponent(raw);
      const encodedTitle = encodeURIComponent(cfg.title || 'Tautan');
      router.push(`/slider-webview?url=${encodedUrl}&title=${encodedTitle}` as Href);
    }
  }, [effectiveMassHero, router]);

  // Don't render anything while auth is loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primaryColor = appSettings?.primaryColor || '#8B4513';
  const headerTitle =
    appSettings?.headerText || appSettings?.parokiName || 'Paroki Santa Maria Bunda Karmel';
  const heroTitle = `Selamat Datang di ${appSettings?.appName || 'Paroki Tomang'}`;
  const footerLines = (appSettings?.footerText || 'Paroki Santa Maria Bunda Karmel (MBK)\nTomang - Jakarta Barat')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarRow}>
            <Ionicons name="location-outline" size={16} color="#FFF5E0" />
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {headerTitle}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.avatar, isLoggingOut && styles.avatarLoading]} 
            onPress={handleAvatarPress}
            onPressIn={() => console.log('[Home] Avatar pressed in')}
            onPressOut={() => console.log('[Home] Avatar pressed out')}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <Ionicons 
                name={user ? "log-out-outline" : "person"} 
                size={20} 
                color={primaryColor} 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Hero card ala modern app */}
        <View style={[styles.heroCard, { backgroundColor: primaryColor }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroChip}>Hari Ini</Text>
            <Text style={styles.heroMainTitle}>{heroTitle}</Text>
            <Text style={styles.heroMainSubtitle}>
              Temukan jadwal misa, pelayanan gereja, renungan harian, dan informasi penting lain.
            </Text>
            
            <View style={styles.heroStatsRow}>
              {effectiveMassHero.targetType === 'none' ? (
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>{effectiveMassHero.title}</Text>
                  <Text style={styles.heroStatValue}>{effectiveMassHero.value}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.heroStat} activeOpacity={0.8} onPress={handleMassHeroPress}>
                  <Text style={styles.heroStatLabel}>{effectiveMassHero.title}</Text>
                  <Text style={styles.heroStatValue}>{effectiveMassHero.value}</Text>
                </TouchableOpacity>
              )}
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Pelayanan</Text>
                <Text style={styles.heroStatValue}>Aktif</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Slider kecil di bawah hero */}
        <View style={styles.infoSliderContainer}>
          <FlatList
            data={sliders.length ? sliders : DEFAULT_INFO_SLIDES}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.infoSliderContent}
            renderItem={({ item }) => {
              const hasImage =
                'imageBase64' in item && Boolean((item as any).imageBase64);
              const imageUri = hasImage ? (item as any).imageBase64 : undefined;

              return (
                <TouchableOpacity
                  style={styles.infoSlideCard}
                  activeOpacity={0.8}
                  onPress={() => handleSliderPress(item as SliderItem)}
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {hasImage && imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.infoSlideImageBackground}
                    />
                  ) : (
                    <View style={styles.infoSlideIconCentered}>
                      <View style={styles.infoSlideIconWrapper}>
                        <Ionicons
                          name={
                            (item.icon || 'information-circle-outline') as any
                          }
                          size={24}
                          color={primaryColor}
                        />
                      </View>
                    </View>
                  )}

                  {/* Bottom info card overlay */}
                  <View style={styles.infoSlideOverlay}>
                    <View style={styles.infoSlideTopRow}>
                      <Text style={styles.infoSlideLabel} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Menu Grid */}
        <View style={styles.menuSection}>
          <View style={styles.menuGrid}>
            {(pages.length ? pages : DEFAULT_MENU_ITEMS).map((item) => {
              const title = 'title' in item ? item.title : (item as any).title;
              const iconName =
                ('icon' in item && (item as any).icon) ? (item as any).icon : 'grid-outline';
              const slug =
                'slug' in item ? (item as any).slug : (item as any).slug;
              const route =
                'route' in item && (item as any).route
                  ? (item as any).route
                  : `/pages/${slug}`;

              return (
                <TouchableOpacity
                  key={item.id || slug}
                  style={[styles.menuItem, { width: itemWidth }]}
                  onPress={() => handleMenuPress(route as Href)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={iconName as any} size={28} color={primaryColor} />
                  </View>
                  <Text style={styles.menuTitle}>{title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{footerLines[0] || 'Paroki Santa Maria Bunda Karmel (MBK)'}</Text>
          {!!footerLines[1] && <Text style={styles.footerSubtext}>{footerLines[1]}</Text>}
          {footerLines.length > 2 && (
            <Text style={styles.footerSubtext}>{footerLines.slice(2).join(' ')}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topBarLabel: {
    fontSize: 12,
    color: '#A67C52',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5D4037',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4C4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarLoading: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B4513',
  },
  debugIconText: {
    position: 'absolute',
    bottom: -12,
    fontSize: 8,
    color: '#999',
    fontWeight: 'bold',
  },
  heroCard: {
    backgroundColor: '#8B4513',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroLeft: {
    flex: 1,
  },
  heroChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#FFF5E0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroMainSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 10,
    color: '#FDEBD0',
  },
  heroStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 8,
  },
  heroRight: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  illustrationBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  illustrationHill: {
    width: 110,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#A0522D',
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
    marginRight: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 24,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
    marginRight: 4,
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  menuSection: {
    marginTop: 12,
  },
  infoSliderContainer: {
    marginBottom: 12,
    marginTop: 4,
  },
  infoSliderContent: {
    paddingVertical: 4,
  },
  infoSlideCard: {
    width: 240,
    height: 150,
    marginRight: 12,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  infoSlideImageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  infoSlideIconCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFF5E0',
  },
  infoSlideIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4C4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSlideOverlay: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoSlideTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoSlideLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 4,
  },
  infoSlideDescription: {
    fontSize: 11,
    color: '#7A5A3A',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: 8,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 15,
  },
  footer: {
    marginTop: 32,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#8B4513',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#FFE4C4',
    textAlign: 'center',
  },
});
