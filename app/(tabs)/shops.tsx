import React, { useEffect, useState, useCallback } from 'react';
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
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetPublicSuppliers } from '../../src/features/supplier/api';
import BottomNav from '../../src/components/BottomNav';

const { width } = Dimensions.get('window');

const DISTRICTS = [
  'Hải Châu',
  'Thanh Khê',
  'Sơn Trà',
  'Ngũ Hành Sơn',
  'Liên Chiểu',
  'Cẩm Lệ',
];

const ShopScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedDistrict) params.district = selectedDistrict;

      const res = await ApiGetPublicSuppliers(params);
      if (res && res.success) {
        setSuppliers(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedDistrict]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderShopItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      key={item._id}
      style={styles.shopCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/supplier/${item.userId?._id || item._id}` as any)}
    >
      <Image source={{ uri: item.businessAvatar }} style={styles.shopImage} />
      <View style={styles.shopInfo}>
        <View style={styles.shopHeaderRow}>
          <Text style={styles.shopName} numberOfLines={1}>{item.businessName}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{item.supplierRating?.toFixed(1) || '0.0'}</Text>
          </View>
        </View>
        
        <View style={styles.shopLocationRow}>
          <Ionicons name="location-outline" size={14} color="#6366F1" />
          <Text style={styles.shopLocationText}>{item.warehouseAddress?.district || 'Đà Nẵng'}</Text>
        </View>

        <View style={styles.shopFooter}>
          <View style={styles.deviceCountBadge}>
            <Ionicons name="cube-outline" size={12} color="#FFF" />
            <Text style={styles.deviceCountText}>{item.deviceCount || 0} gear</Text>
          </View>
          {item.isOnline && (
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Active</Text>
            </View>
          )}
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
          <Text style={styles.headerTitle}>Partner Hubs</Text>
          <Text style={styles.headerSubtitle}>Find professional gear shops</Text>
        </View>
        <TouchableOpacity style={styles.mapBtn}>
          <Ionicons name="map-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item._id}
          renderItem={renderShopItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
          ListHeaderComponent={
            <>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={20} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search shops or areas..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Districts */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.districtsScroll}
              >
                <TouchableOpacity
                  style={[styles.districtPill, selectedDistrict === null && styles.activeDistrictPill]}
                  onPress={() => setSelectedDistrict(null)}
                >
                  <Text style={[styles.districtPillText, selectedDistrict === null && styles.activeDistrictPillText]}>All Đà Nẵng</Text>
                </TouchableOpacity>
                {DISTRICTS.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.districtPill, selectedDistrict === d && styles.activeDistrictPill]}
                    onPress={() => setSelectedDistrict(d)}
                  >
                    <Text style={[styles.districtPillText, selectedDistrict === d && styles.activeDistrictPillText]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={64} color="#334155" />
                <Text style={styles.emptyText}>No partner hubs found</Text>
              </View>
            )
          }
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      </View>

      <BottomNav activeTab="shops" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
    color: '#FFF',
    marginLeft: 12,
    fontSize: 15,
  },
  districtsScroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  districtPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activeDistrictPill: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  districtPillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeDistrictPillText: {
    color: '#FFF',
  },
  listContent: {
    paddingBottom: 20,
  },
  shopCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    height: 120,
  },
  shopImage: {
    width: 120,
    height: '100%',
    backgroundColor: '#1E293B',
  },
  shopInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  shopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  shopLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopLocationText: {
    color: '#64748B',
    fontSize: 13,
  },
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  deviceCountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
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
});

export default ShopScreen;
