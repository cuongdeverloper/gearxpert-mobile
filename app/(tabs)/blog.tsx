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
import { blogStyles as styles } from '../../src/styles/screens/blog.styles';

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
