import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SliderItem, getActiveSliders } from '../services/sliders.service';
import { PageContent, getActivePages } from '../services/pages.service';
import { AppSettings, getAppSettings } from '../services/settings.service';

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
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getActiveSliders();
      setSliders(data);
    };
    load();
  }, []);

  useEffect(() => {
    const loadPages = async () => {
      const data = await getActivePages();
      setPages(data);
    };
    loadPages();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getAppSettings();
      setAppSettings(data);
    };
    loadSettings();
  }, []);

  const primaryColor = appSettings?.primaryColor || '#8B4513';
  const headerTitle =
    appSettings?.headerText || appSettings?.parokiName || 'Paroki Santa Maria Bunda Karmel';
  const heroTitle = `Selamat Datang di ${appSettings?.appName || 'Paroki Tomang'}`;
  const footerLines = (appSettings?.footerText || 'Paroki Santa Maria Bunda Karmel (MBK)\nTomang - Jakarta Barat')
    .split('\n')
    .filter((line) => line.trim().length > 0);
  
  // Calculate number of columns based on current window width
  const numColumns = windowWidth >= 1024 ? 5 : windowWidth >= 768 ? 4 : 3;
  
  // Calculate item width dynamically
  const gridHorizontalPadding = 16;
  const menuItemHorizontalMargin = 4;
  const availableWidth = windowWidth - (gridHorizontalPadding * 2);
  const itemWidth =
    (availableWidth / numColumns) - (menuItemHorizontalMargin * 2);

  const handleMenuPress = (route: Href) => {
    router.push(route);
  };

  const handleAvatarPress = () => {
    router.push('/adm' as Href);
  };

  const handleSliderPress = (item: SliderItem) => {
    if (item.targetType === 'page' && item.targetPageSlug) {
      router.push(`/pages/${item.targetPageSlug}` as Href);
      return;
    }

    if (item.targetType === 'url' && item.targetUrl) {
      // Buka URL apa saja (internal / eksternal) di layar webview fullscreen
      const encodedUrl = encodeURIComponent(item.targetUrl);
      const encodedTitle = encodeURIComponent(item.title || 'Tautan');
      router.push(`/slider-webview?url=${encodedUrl}&title=${encodedTitle}` as Href);
    }
  };

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
          <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress}>
            <Ionicons name="person" size={20} color={primaryColor} />
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
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Jadwal Misa</Text>
                <Text style={styles.heroStatValue}>Lihat</Text>
              </View>
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
                >
                  {hasImage ? (
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
                    {!!item.description && (
                      <Text
                        style={styles.infoSlideDescription}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    )}
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
                'icon' in item ? (item as any).icon : (item as any).icon;
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
