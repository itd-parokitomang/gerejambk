import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import RichTextRenderer from '../../components/common/RichTextRenderer';
import {
  getPageBySlug,
  getChildPages,
  PageContent,
} from '../../services/pages.service';
import {
  getCustomIconById,
  getCustomIconId,
  isCustomIconRef,
} from '../../services/icons.service';

export default function PageDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [page, setPage] = useState<PageContent | null>(null);
  const [children, setChildren] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const [webViewCanGoBack, setWebViewCanGoBack] = useState(false);
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      const p = await getPageBySlug(String(slug));
      if (p) {
        setPage(p);
        if (p.type === 'parent') {
          const subs = await getChildPages(p.id);
          setChildren(subs);
        } else if (p.type === 'youtube_video' && p.youtubeVideos?.length) {
          setActiveVideoIndex(0);
        }
      } else {
        setPage(null);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    const ids = new Set<string>();
    if (page?.icon && isCustomIconRef(page.icon)) {
      ids.add(getCustomIconId(page.icon));
    }
    for (const child of children) {
      if (child.icon && isCustomIconRef(child.icon)) {
        ids.add(getCustomIconId(child.icon));
      }
    }
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
  }, [children, customIcons, page?.icon]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Memuat halaman...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!page) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.placeholderContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D2691E" />
          <Text style={styles.title}>Halaman tidak ditemukan</Text>
          <Text style={styles.description}>
            Halaman yang Anda cari tidak tersedia atau telah dihapus.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isParent = page.type === 'parent';
  const childColumns = windowWidth >= 1024 ? 3 : windowWidth >= 768 ? 2 : 1;
  const childGridPaddingX = 16 * 2;
  const childGridGap = 12;
  const childCardWidth = Math.max(
    180,
    Math.floor(
      (windowWidth - childGridPaddingX - childGridGap * (childColumns - 1)) /
        childColumns,
    ),
  );

  const openYouTubeExternal = (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url).catch((err) =>
      console.warn('Failed to open YouTube URL', err),
    );
  };

  const getYouTubeChannelUrl = () => {
    if (!page) return undefined;
    if (page.youtubeChannelUrl) return page.youtubeChannelUrl;
    if (page.youtubeChannelId) {
      return `https://www.youtube.com/channel/${page.youtubeChannelId}`;
    }
    return undefined;
  };

  const openYouTubeChannel = () => {
    const url = getYouTubeChannelUrl();
    if (!url) return;
    Linking.openURL(url).catch((err) =>
      console.warn('Failed to open YouTube channel URL', err),
    );
  };

  const backToApp = () => {
    const canGoBack = (router as any).canGoBack?.();
    if (canGoBack) {
      router.back();
      return;
    }
    router.replace('/' as any);
  };

  const handleWebviewBack = () => {
    if (Platform.OS !== 'web' && webViewCanGoBack) {
      webViewRef.current?.goBack();
      return;
    }
    backToApp();
  };

  // Halaman khusus tipe webview: fullscreen web content (tanpa judul & "Segera hadir")
  if (page.type === 'webview' && page.webviewUrl) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleWebviewBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#8B4513" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            {page.icon && isCustomIconRef(page.icon) ? (
              customIcons[getCustomIconId(page.icon)] ? (
                <Image
                  source={{ uri: customIcons[getCustomIconId(page.icon)] }}
                  style={styles.headerCustomIcon}
                />
              ) : (
                <Ionicons
                  name="image-outline"
                  size={26}
                  color="#8B4513"
                />
              )
            ) : (
              <Ionicons
                name={(page.icon || 'document-text-outline') as any}
                size={32}
                color="#8B4513"
              />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              {page.title}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {Platform.OS === 'web' ? (
            <iframe
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              src={page.webviewUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={page.title || 'Embedded page'}
            />
          ) : (
            <WebView
              ref={webViewRef}
              style={{ flex: 1 }}
              source={{ uri: page.webviewUrl! }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              onNavigationStateChange={(navState) =>
                setWebViewCanGoBack(Boolean(navState.canGoBack))
              }
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const tableColumns = page.tableColumns ?? [];
  const tableData = page.tableData ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#8B4513" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons
              name={(page.icon || 'document-text-outline') as any}
              size={32}
              color="#8B4513"
            />
          </View>
          <View style={styles.headerText}>
            <Text
              style={isParent ? styles.parentTitle : styles.title}
              numberOfLines={2}
            >
              {page.title}
            </Text>
            {isParent ? (
              <Text style={styles.subtitle}>
                Pilih salah satu sub halaman di bawah ini.
              </Text>
            ) : (
              <Text style={styles.subtitle}>Segera hadir</Text>
            )}
          </View>
        </View>

        {isParent ? (
          children.length > 0 ? (
            <View style={styles.cardsGrid}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.card, { width: childCardWidth }]}
                  onPress={() => router.push(`/pages/${child.slug}` as Href)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardIcon}>
                    {child.icon && isCustomIconRef(child.icon) ? (
                      customIcons[getCustomIconId(child.icon)] ? (
                        <Image
                          source={{ uri: customIcons[getCustomIconId(child.icon)] }}
                          style={styles.cardCustomIcon}
                        />
                      ) : (
                        <Ionicons
                          name="image-outline"
                          size={20}
                          color="#8B4513"
                        />
                      )
                    ) : (
                      <Ionicons
                        name={(child.icon || 'document-text-outline') as any}
                        size={24}
                        color="#8B4513"
                      />
                    )}
                  </View>
                  <Text style={styles.cardTitle}>{child.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color="#D2691E"
              />
              <Text style={styles.subtitle}>Belum ada sub halaman</Text>
              <Text style={styles.description}>
                Tambahkan sub halaman baru melalui menu Kelola Halaman di admin.
              </Text>
            </View>
          )
        ) : page.type === 'static' ? (
          page.richTextContent ? (
            <View style={styles.staticContentSection}>
              <View style={styles.staticCard}>
                {Platform.OS === 'web' ? (
                  <RichTextRenderer html={page.richTextContent} />
                ) : (
                  <RichTextRenderer
                    html={page.richTextContent}
                    contentWidth={windowWidth - 32}
                  />
                )}
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color="#D2691E"
              />
              <Text style={styles.subtitle}>Belum ada konten</Text>
              <Text style={styles.description}>
                Tambahkan konten untuk halaman ini melalui editor di menu
                Kelola Halaman.
              </Text>
            </View>
          )
        ) : page.type === 'youtube_channel' ? (
          getYouTubeChannelUrl() ? (
            <View style={styles.youtubeChannelSection}>
              <View style={styles.youtubeChannelCard}>
                <View style={styles.youtubeChannelHeader}>
                  <View style={styles.youtubeChannelIcon}>
                    <Ionicons name="logo-youtube" size={28} color="#FF0000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.youtubeChannelTitle} numberOfLines={1}>
                      {page.youtubeChannelName || 'Channel YouTube'}
                    </Text>
                    <Text
                      style={styles.youtubeChannelUrlText}
                      numberOfLines={1}
                    >
                      {getYouTubeChannelUrl()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.youtubeChannelDescription}>
                  Anda akan diarahkan ke channel YouTube resmi di browser atau
                  aplikasi YouTube.
                </Text>

                <TouchableOpacity
                  style={styles.youtubeChannelButton}
                  activeOpacity={0.9}
                  onPress={openYouTubeChannel}
                >
                  <Ionicons
                    name="open-outline"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.youtubeChannelButtonText}>
                    Buka Channel di YouTube
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="logo-youtube" size={64} color="#D2691E" />
              <Text style={styles.subtitle}>Channel belum diatur</Text>
              <Text style={styles.description}>
                Isi URL beranda channel (atau Channel ID) pada tipe halaman ini
                melalui Kelola Halaman.
              </Text>
            </View>
          )
        ) : page.type === 'youtube_video' && page.youtubeVideos ? (
          page.youtubeVideos.length > 0 ? (
            <View style={styles.videoSection}>
              {/* Video unggulan */}
              {(() => {
                const [first, ...rest] = page.youtubeVideos!;
                const active =
                  page.youtubeVideos![activeVideoIndex] ?? first;

                return (
                  <>
                    <View style={styles.videoFeaturedCard}>
                      <View style={styles.videoPlayerContainer}>
                        {Platform.OS === 'web' ? (
                          // Di web gunakan iframe langsung (didukung React DOM)
                          <iframe
                            style={{
                              width: '100%',
                              height: '100%',
                              border: 'none',
                            }}
                            src={`https://www.youtube.com/embed/${active.videoId}?rel=0&playsinline=1&controls=1`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={active.title || 'YouTube video player'}
                          />
                        ) : (
                          <WebView
                            style={styles.videoPlayer}
                            source={{
                              uri: `https://www.youtube.com/embed/${active.videoId}?rel=0&playsinline=1&controls=1`,
                            }}
                            javaScriptEnabled
                            domStorageEnabled
                            allowsInlineMediaPlayback
                          />
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => openYouTubeExternal(active.videoId)}
                        activeOpacity={0.9}
                      >
                        <Text
                          style={styles.videoFeaturedTitle}
                          numberOfLines={2}
                        >
                          {active.title || 'Video Utama'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Grid 2 kolom untuk video lain */}
                    {rest.length > 0 && (
                      <View style={styles.videoGrid}>
                        {page.youtubeVideos!.map((video, index) => {
                          if (index === activeVideoIndex) return null;
                          const thumb =
                            video.thumbnailUrl ||
                            `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;

                          return (
                            <TouchableOpacity
                              key={video.id}
                              style={styles.videoGridItem}
                              onPress={() => setActiveVideoIndex(index)}
                              activeOpacity={0.9}
                            >
                              <Text
                                style={styles.videoGridTitle}
                                numberOfLines={2}
                              >
                                {video.title || 'Video YouTube'}
                              </Text>
                              <Image
                                source={{ uri: thumb }}
                                style={styles.videoGridImage}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="videocam-outline" size={64} color="#D2691E" />
              <Text style={styles.subtitle}>Belum ada video</Text>
              <Text style={styles.description}>
                Tambahkan video pada tipe halaman ini melalui Kelola Halaman di
                admin.
              </Text>
            </View>
          )
        ) : page.type === 'webview' && page.webviewUrl ? (
          <View style={styles.webviewSection}>
            <View style={styles.webviewCard}>
              <View style={styles.webviewContainer}>
                {Platform.OS === 'web' ? (
                  <iframe
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    src={page.webviewUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={page.title || 'Embedded page'}
                  />
                ) : (
                  <WebView
                    style={styles.webviewPlayer}
                    source={{ uri: page.webviewUrl! }}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsInlineMediaPlayback
                  />
                )}
              </View>
            </View>
          </View>
        ) : page.type === 'data_table' && tableColumns.length > 0 ? (
          tableData.length > 0 ? (
            <View style={styles.tableSection}>
              {page.tableTitle && (
                <Text style={styles.tableTitle}>{page.tableTitle}</Text>
              )}
              <View style={styles.tableCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    {/* Table Header */}
                    <View style={styles.tableHeaderRow}>
                      {tableColumns.map((column) => (
                        <View
                          key={column.id}
                          style={[
                            styles.tableHeaderCell,
                            { minWidth: 120 },
                          ]}
                        >
                          <Text style={styles.tableHeaderText}>
                            {column.label || column.id}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {/* Table Rows */}
                    {tableData.map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        style={[
                          styles.tableRow,
                          rowIndex % 2 === 0 && styles.tableRowEven,
                        ]}
                      >
                        {tableColumns.map((column) => (
                          <View
                            key={column.id}
                            style={[
                              styles.tableCell,
                              { minWidth: 120 },
                            ]}
                          >
                            <Text style={styles.tableCellText}>
                              {String(row[column.id] || '-')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="grid-outline" size={64} color="#D2691E" />
              <Text style={styles.subtitle}>Belum ada data</Text>
              <Text style={styles.description}>
                Tambahkan data baris melalui menu Kelola Halaman di admin.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="document-text" size={80} color="#D2691E" />
            <Text style={styles.subtitle}>Segera Hadir</Text>
            <Text style={styles.description}>
              Konten untuk halaman ini akan ditambahkan melalui admin panel.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCustomIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 4,
  },
  parentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A5A3A',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardCustomIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D4037',
  },
  videoSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  videoFeaturedCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  videoFeaturedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 8,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 10,
  },
  videoPlayer: {
    flex: 1,
  },
  videoFeaturedImage: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    backgroundColor: '#DDD',
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  videoGridItem: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  videoGridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 6,
  },
  videoGridImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    backgroundColor: '#DDD',
  },
  webviewSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  webviewCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  webviewContainer: {
    width: '100%',
    height: 400,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  webviewPlayer: {
    flex: 1,
  },
  staticContentSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  staticCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  staticHtmlBase: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5D4037',
  },
  youtubeChannelSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  youtubeChannelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  youtubeChannelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  youtubeChannelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  youtubeChannelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
  },
  youtubeChannelId: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  youtubeChannelDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  youtubeChannelUrlText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  youtubeChannelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FF0000',
  },
  youtubeChannelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tableSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#8B4513',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderCell: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  tableCellText: {
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 18,
  },
});
