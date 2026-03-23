import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetBlogs, ApiGetFeaturedBlogs } from '../../src/features/blog/api';
import BottomNav from '../../src/components/BottomNav';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps-outline' },
  { id: 'CAMERA', name: 'Cameras', icon: 'camera-outline' },
  { id: 'DRONE', name: 'Drones', icon: 'airplane-outline' },
  { id: 'LIGHTING', name: 'Lighting', icon: 'bulb-outline' },
  { id: 'AI_TECH', name: 'AI Tech', icon: 'hardware-chip-outline' },
  { id: 'AUDIO', name: 'Audio Gear', icon: 'mic-outline' },
  { id: 'CINEMATOGRAPHY', name: 'Cinematography', icon: 'videocam-outline' },
  { id: 'ACCESSORIES', name: 'Accessories', icon: 'construct-outline' },
  { id: 'INDUSTRY_NEWS', name: 'Industry News', icon: 'newspaper-outline' },
];

const BlogScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [blogs, setBlogs] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const fetchData = useCallback(async () => {
    try {
      const [featuredRes, blogsRes] = await Promise.all([
        ApiGetFeaturedBlogs(),
        ApiGetBlogs({ 
          limit: 50, // Increase limit to find more
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchQuery || undefined
        }),
      ]);

      // Combine featured blogs from both sources to be safe
      let featuredList: any[] = [];
      if (Array.isArray(featuredRes)) {
        featuredList = [...featuredRes];
      } else if (featuredRes && featuredRes._id) {
        featuredList = [featuredRes];
      }

      if (blogsRes && blogsRes.blogs) {
        setBlogs(blogsRes.blogs);
        
        // Also find featured blogs in the main list that might have been missed
        const extraFeatured = blogsRes.blogs.filter((b: any) => 
          b.isFeatured === true && !featuredList.some(f => f._id === b._id)
        );
        featuredList = [...featuredList, ...extraFeatured];
      }
      
      setFeatured(featuredList);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Auto-scroll (Timer)
  useEffect(() => {
    if (featured.length <= 1 || selectedCategory !== 'all') {
      return;
    }

    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featured.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [featured.length, selectedCategory, featuredIndex]);

  // Synchronize ScrollView with featuredIndex
  useEffect(() => {
    if (scrollRef.current && featured.length > 1) {
      const totalCardWidth = width - 40 + 16;
      scrollRef.current.scrollTo({ x: featuredIndex * totalCardWidth, animated: true });
    }
  }, [featuredIndex]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderFeaturedItem = (item: any) => (
    <TouchableOpacity
      key={item._id}
      style={styles.featuredCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/blog/${item._id}` as any)}
    >
      <Image source={{ uri: item.coverImage }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(15, 23, 42, 1)']}
        style={styles.featuredGradient}
      />
      <View style={styles.featuredContent}>
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>FEATURED</Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.featuredFooter}>
          <View style={styles.avatarMini}>
            {item.author?.avatar ? (
              <Image source={{ uri: item.author.avatar }} style={styles.avatarImageMini} />
            ) : (
              <Text style={styles.avatarText}>
                {item.author?.name?.charAt(0) || item.author?.username?.charAt(0) || 'G'}
              </Text>
            )}
          </View>
          <Text style={styles.featuredAuthor}>{item.author?.name || item.author?.username || 'GearXpert'}</Text>
          <View style={styles.dot} />
          <Text style={styles.featuredTime}>{item.readTime} min read</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBlogItem = (item: any) => (
    <TouchableOpacity
      key={item._id}
      style={styles.blogCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/blog/${item._id}` as any)}
    >
      <Image source={{ uri: item.coverImage }} style={styles.blogImage} />
      <View style={styles.blogInfo}>
        <View style={styles.blogCategoryRow}>
          <Text style={styles.blogCategory}>{item.category}</Text>
          <Text style={styles.blogDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.blogTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.blogDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.blogAuthorRow}>
          <View style={styles.avatarMini}>
            {item.author?.avatar ? (
              <Image source={{ uri: item.author.avatar }} style={styles.avatarImageMini} />
            ) : (
              <Text style={styles.avatarText}>
                {item.author?.name?.charAt(0) || item.author?.username?.charAt(0) || 'G'}
              </Text>
            )}
          </View>
          <Text style={styles.authorNameSmall}>{item.author?.name || item.author?.username || 'GearXpert'}</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.viewsRow}>
            <Ionicons name="eye-outline" size={14} color="#94A3B8" />
            <Text style={styles.viewsText}>{item.views || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>Gear Insights</Text>
          <Text style={styles.headerSubtitle}>Discover the latest in tech</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color="#FFF" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.activeCategoryPill
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={18} 
                color={selectedCategory === cat.id ? '#FFF' : '#94A3B8'} 
              />
              <Text style={[
                styles.categoryPillText,
                selectedCategory === cat.id && styles.activeCategoryPillText
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <>
            {/* Featured Section */}
            {featured.length > 0 && selectedCategory === 'all' && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Stories</Text>
                  <Text style={styles.featuredCount}>{featuredIndex + 1}/{featured.length}</Text>
                </View>
                <View>
                  <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featuredScroll}
                    snapToInterval={width - 40 + 16}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40 + 16));
                      setFeaturedIndex(index);
                    }}
                  >
                    {featured.map(renderFeaturedItem)}
                  </ScrollView>
                  
                  {/* Indicators (Clickable like web) */}
                  {featured.length > 1 && (
                    <View style={styles.indicatorContainer}>
                      {featured.map((_, i) => (
                        <TouchableOpacity 
                          key={i}
                          onPress={() => setFeaturedIndex(i)}
                          style={[
                            styles.paginationDot, 
                            featuredIndex === i ? styles.activeDot : styles.inactiveDot
                          ]} 
                        />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Main List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory === 'all' ? 'Latest Updates' : `${CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
                </Text>
              </View>
              <View style={styles.blogList}>
                {blogs.length > 0 ? (
                  blogs.map(renderBlogItem)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="newspaper-outline" size={64} color="#334155" />
                    <Text style={styles.emptyText}>No articles found</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav activeTab="blog" />
    </View>
  );
};

export default BlogScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#F1F5F9',
    fontSize: 15,
  },
  categoriesScroll: {
    paddingLeft: 24,
    paddingRight: 12,
    gap: 12,
    marginBottom: 24,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  activeCategoryPill: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
  },
  categoryPillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  activeCategoryPillText: {
    color: '#FFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  featuredScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featuredCard: {
    width: width - 40,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#334155',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  featuredBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  featuredBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  featuredTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 28,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredAuthor: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  avatarImageMini: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  featuredCount: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    marginHorizontal: 8,
  },
  featuredTime: {
    color: '#94A3B8',
    fontSize: 13,
  },
  blogList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  blogCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 140,
  },
  blogImage: {
    width: 120,
    height: '100%',
  },
  blogInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  blogCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  blogCategory: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  blogDate: {
    color: '#64748B',
    fontSize: 10,
  },
  blogTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
    height: 40,
  },
  blogDesc: {
    color: '#94A3B8',
    fontSize: 12,
    height: 32,
    marginTop: 2,
  },
  blogAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  authorNameSmall: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 12,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingBottom: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeDot: {
    backgroundColor: '#6366F1',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
