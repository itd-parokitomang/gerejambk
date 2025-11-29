import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dummy slider images (base64 placeholders - small colored rectangles)
const DUMMY_SLIDERS = [
  { id: '1', color: '#8B4513', text: 'Selamat Datang di Paroki Tomang' },
  { id: '2', color: '#A0522D', text: 'Jadwal Misa & Acara' },
  { id: '3', color: '#CD853F', text: 'Pelayanan Gereja' },
  { id: '4', color: '#D2691E', text: 'Renungan Harian' },
  { id: '5', color: '#8B6914', text: 'Kegiatan Mendatang' },
];

// Menu items based on screenshot
const MENU_ITEMS = [
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
  const [activeSlide, setActiveSlide] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  // Auto-play slider
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % DUMMY_SLIDERS.length;
        if (Platform.OS !== 'web') {
          pagerRef.current?.setPage(next);
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuPress = (route: string) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="home" size={28} color="#fff" />
            <Text style={styles.headerTitle}>Paroki Tomang</Text>
          </View>
        </View>

        {/* Slider Section */}
        <View style={styles.sliderContainer}>
          {Platform.OS === 'web' ? (
            // Simple web slider
            <View style={styles.webSliderWrapper}>
              <View style={[styles.slide, { backgroundColor: DUMMY_SLIDERS[activeSlide].color }]}>
                <Text style={styles.slideText}>{DUMMY_SLIDERS[activeSlide].text}</Text>
              </View>
              <View style={styles.pagination}>
                {DUMMY_SLIDERS.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === activeSlide && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : (
            // Native slider
            <>
              <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={(e) => setActiveSlide(e.nativeEvent.position)}
              >
                {DUMMY_SLIDERS.map((slide) => (
                  <View key={slide.id} style={[styles.slide, { backgroundColor: slide.color }]}>
                    <Text style={styles.slideText}>{slide.text}</Text>
                  </View>
                ))}
              </PagerView>
              <View style={styles.pagination}>
                {DUMMY_SLIDERS.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === activeSlide && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Menu Grid */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Menu Utama</Text>
          <View style={styles.menuGrid}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={32} color="#8B4513" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Paroki Santa Maria Bunda Karmel (MBK)</Text>
          <Text style={styles.footerSubtext}>Tomang - Jakarta Barat</Text>
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
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  sliderContainer: {
    height: 220,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webSliderWrapper: {
    height: 220,
    position: 'relative',
  },
  pagerView: {
    height: 220,
  },
  slide: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  slideText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 16,
    paddingLeft: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: Platform.OS === 'web' ? '31%' : (SCREEN_WIDTH - 64) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  menuIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 18,
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
