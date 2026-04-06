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
  FlatList,
  Animated,
  StatusBar,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ApiGetSupplierStorefront,
  ApiGetSupplierStorefrontDevices,
  ApiGetSupplierStorefrontVouchers,
  ApiToggleFollowStore,
  ApiGetFollowStatus,
} from '../../src/features/supplier/api';
import DeviceCard from '../../src/components/DeviceCard';
import { useAuth } from '../../src/context/AuthContext';
import { getConversationApi, ApiCreateConversation } from '../../src/features/chat/api';

const { width } = Dimensions.get('window');

const ShopDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [supplier, setSupplier] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [profileRes, devicesRes, vouchersRes, followRes] = await Promise.all([
        ApiGetSupplierStorefront(id),
        ApiGetSupplierStorefrontDevices(id, { limit: 50 }),
        ApiGetSupplierStorefrontVouchers(id),
        ApiGetFollowStatus(id),
      ]);

      if (profileRes?.success) setSupplier(profileRes.data);
      if (devicesRes?.success) {
        setDevices(devicesRes.data?.devices || []);
        if (devicesRes.data?.categories) setCategories(devicesRes.data.categories);
      }
      if (vouchersRes?.success) setVouchers(vouchersRes.data || []);
      if (followRes?.success) {
        setIsFollowing(followRes.data.isFollowing);
        setFollowerCount(followRes.data.followerCount);
      }
    } catch (error) {
      console.error('Error fetching shop detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFollow = async () => {
    if (!id) return;
    try {
      const res = await ApiToggleFollowStore(id);
      if (res?.success) {
        setIsFollowing(res.data.isFollowing);
        setFollowerCount(res.data.followerCount);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const { user, isAuthenticated } = useAuth();
  const handleContact = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    const receiverId = supplier?.userId?._id || supplier?.userId;
    if (!receiverId) return;

    try {
      const conversations = await getConversationApi();
      const existing = conversations?.find((c: any) => 
        c.members.includes(receiverId) && c.members.includes(user?.id)
      );

      if (existing) {
        router.push(`/messenger/${existing._id}`);
      } else {
        const newConv = await ApiCreateConversation(receiverId);
        if (newConv?.data?._id) {
          router.push(`/messenger/${newConv.data._id}`);
        } else if (newConv?._id) {
          router.push(`/messenger/${newConv._id}`);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${supplier?.businessName} on GearXpert!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchesCategory = !selectedCategory || d.category === selectedCategory;
    const matchesSearch = !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (loading && !supplier) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dynamic Header */}
      <Animated.View style={[styles.stickyHeader, { height: insets.top + 60, opacity: headerOpacity, paddingTop: insets.top }]}>
        <View style={styles.stickyHeaderInner}>
          <Text style={styles.stickyHeaderTitle} numberOfLines={1}>{supplier?.businessName}</Text>
        </View>
      </Animated.View>

      <View style={[styles.topActions, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: supplier?.businessAvatar || supplier?.userId?.avatar }}
            style={styles.bannerImage}
            blurRadius={20}
          />
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.9)', '#0F172A']}
            style={styles.bannerGradient}
          />
          
          <View style={styles.profileMain}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: supplier?.businessAvatar || supplier?.userId?.avatar }} style={styles.avatar} />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#FFF" />
              </View>
            </View>
            
            <Text style={styles.shopName}>{supplier?.businessName}</Text>
            <Text style={styles.shopDesc} numberOfLines={2}>{supplier?.businessDescription || 'Official Equipment Partner'}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{supplier?.deviceCount || 0}</Text>
                <Text style={styles.statLabel}>Gear</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{(supplier?.supplierRating || 0).toFixed(1)}</Text>
                <Text style={styles.statLabel}>{supplier?.supplierReviewCount || 0} reviews</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{followerCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>

            <View style={styles.mainActions}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={handleFollow}
              >
                <Ionicons name={isFollowing ? "notifications" : "heart"} size={18} color={isFollowing ? "#94A3B8" : "#FFF"} />
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Subscribed' : 'Follow Shop'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.contactBtn}
                onPress={handleContact}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
                <Text style={styles.contactBtnText}>Messages</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Vouchers section */}
        {vouchers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop Vouchers</Text>
              <TouchableOpacity>
                <Text style={styles.viewMoreText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voucherList}>
              {vouchers.map((v) => (
                <View key={v._id} style={styles.voucherCard}>
                  <View style={styles.voucherLeft}>
                    <Text style={styles.voucherValue}>
                      {v.discountType === 'PERCENT' ? `${v.discountValue}%` : `${(v.discountValue / 1000).toFixed(0)}k`}
                    </Text>
                    <Text style={styles.voucherOff}>OFF</Text>
                  </View>
                  <View style={styles.voucherRight}>
                    <Text style={styles.voucherCode} numberOfLines={1}>{v.code}</Text>
                    <Text style={styles.voucherMin}>Min. {v.minOrderValue?.toLocaleString('vi-VN')}đ</Text>
                    <TouchableOpacity style={styles.collectBtn}>
                      <Text style={styles.collectBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Grid and Search */}
        <View style={styles.devicesSection}>
          <View style={styles.devicesHeader}>
            <Text style={styles.sectionTitle}>Library</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                placeholder="Search items..."
                placeholderTextColor="#64748B"
                style={styles.searchBar}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.categoryPill, !selectedCategory && styles.activeCategoryPill]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryPillText, !selectedCategory && styles.activeCategoryPillText]}>All Items</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, selectedCategory === cat && styles.activeCategoryPill]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryPillText, selectedCategory === cat && styles.activeCategoryPillText]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Available Items */}
          {filteredDevices.filter(d => (d.stockQuantity || 0) > 0).length > 0 && (
            <View>
              <Text style={styles.subSectionTitle}>Available Items</Text>
              <View style={styles.gridContainer}>
                {filteredDevices.filter(d => (d.stockQuantity || 0) > 0).map((item) => (
                  <View key={item._id} style={styles.gridItem}>
                    <DeviceCard device={item} variant="grid" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Out of Stock Items */}
          {filteredDevices.filter(d => (d.stockQuantity || 0) <= 0).length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.subSectionTitle, { color: '#64748B' }]}>Out of Stock</Text>
              <View style={[styles.gridContainer, { opacity: 0.6 }]}>
                {filteredDevices.filter(d => (d.stockQuantity || 0) <= 0).map((item) => (
                  <View key={item._id} style={styles.gridItem}>
                    <DeviceCard device={item} variant="grid" />
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {filteredDevices.length === 0 && (
            <View style={styles.emptyResults}>
              <Ionicons name="sparkles-outline" size={48} color="#334155" />
              <Text style={styles.emptyResultsText}>No items match your criteria</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 100,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stickyHeaderInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 70,
  },
  stickyHeaderTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  topActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 110,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 0,
  },
  profileSection: {
    height: 420,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: 350,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  profileMain: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#0F172A',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 4,
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  shopName: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  shopDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  },
  mainActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  followBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  followBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  followingBtnText: {
    color: '#94A3B8',
  },
  contactBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  contactBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  subSectionTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  viewMoreText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  voucherList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  voucherCard: {
    width: 200,
    height: 90,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  voucherLeft: {
    width: 60,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  voucherOff: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '800',
  },
  voucherRight: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  voucherCode: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  voucherMin: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '500',
  },
  collectBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  collectBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  devicesSection: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  devicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingHorizontal: 12,
    width: width * 0.45,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchBar: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    marginLeft: 8,
  },
  categoryScroll: {
    gap: 10,
    marginBottom: 24,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activeCategoryPill: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryPillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryPillText: {
    color: '#FFF',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyResultsText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 12,
  },
});

export default ShopDetailScreen;
