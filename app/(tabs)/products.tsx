import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ScrollView, Image,
  Platform, Dimensions, StatusBar, ActivityIndicator, TextInput, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetDevices } from '../../src/features/equipment/api';
import { useFavorites } from '../../src/context/FavoriteContext';
import BottomNav from '../../src/components/BottomNav';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2; // 2-col grid with padding

const CATEGORIES = [
  { name: 'All Gear', id: null, icon: 'grid-outline' },
  { name: 'Camera', id: 'CAMERA', icon: 'camera-outline' },
  { name: 'Lighting', id: 'LIGHTING', icon: 'bulb-outline' },
  { name: 'Audio', id: 'AUDIO', icon: 'mic-outline' },
  { name: 'Accessory', id: 'ACCESSORY', icon: 'construct-outline' },
  { name: 'Drone', id: 'DRONE', icon: 'airplane-outline' },
  { name: 'Other', id: 'OTHER', icon: 'apps-outline' },
];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
];

export default function ProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [devices, setDevices] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { favoriteIds, toggleFavorite, refreshFavorites } = useFavorites();
  const params = useLocalSearchParams<{ category?: string }>();

  useFocusEffect(
    useCallback(() => {
      refreshFavorites();
    }, [refreshFavorites])
  );

  useEffect(() => {
    if (params.category !== undefined) {
      if (params.category === 'ALL') {
        setSelectedCategory(null);
      } else {
        setSelectedCategory(params.category);
      }
    }
  }, [params.category]);

  // Fetch all devices
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await ApiGetDevices({ limit: 100 });
        setDevices(res?.devices || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Apply filters + sort
  useEffect(() => {
    let result = [...devices];

    if (selectedCategory) {
      result = result.filter(d => d.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const removeDiacritics = (str: string) => {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      };

      const q = removeDiacritics(searchQuery);
      result = result.filter(d => {
        const nameText = removeDiacritics(d.name);
        const descText = removeDiacritics(d.description);
        return nameText.includes(q) || descText.includes(q);
      });
    }
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => (a.rentPrice?.perDay || 0) - (b.rentPrice?.perDay || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.rentPrice?.perDay || 0) - (a.rentPrice?.perDay || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        break;
    }
    setFiltered(result);
  }, [devices, selectedCategory, searchQuery, sortBy]);

  const renderProductCard = ({ item }: { item: any }) => {
    const imageUrl = Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32';
    const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.rentPrice?.perDay || 0);

    return (
      <TouchableOpacity style={styles.productCard} activeOpacity={0.85}>
        <View style={styles.productImageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
          {item.ratingAvg > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={styles.ratingText}>{item.ratingAvg.toFixed(1)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => toggleFavorite(item._id)}
          >
            <Ionicons
              name={favoriteIds.includes(item._id) ? "heart" : "heart-outline"}
              size={16}
              color={favoriteIds.includes(item._id) ? "#EF4444" : "#FFF"}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productCategory}>{item.category || 'GEAR'}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>{price}<Text style={styles.perDay}>/day</Text></Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Featured';

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgContainer}>
        <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.glowOrb, { top: -80, right: -60, backgroundColor: 'rgba(34, 211, 238, 0.25)' }]} />
        <View style={[styles.glowOrb, { bottom: 100, left: -60, backgroundColor: 'rgba(99, 102, 241, 0.3)' }]} />
      </View>

      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gear Catalog</Text>
          <Text style={styles.headerSubtitle}>{filtered.length} products</Text>
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortPicker(!showSortPicker)}>
          <Ionicons name="swap-vertical-outline" size={20} color="#22D3EE" />
          <Text style={styles.sortBtnText}>{currentSortLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSortPicker && (
        <View style={[styles.sortDropdown, { top: insets.top + 70 }]}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortOption, sortBy === opt.value && styles.sortOptionActive]}
              onPress={() => { setSortBy(opt.value); setShowSortPicker(false); }}
            >
              <Text style={[styles.sortOptionText, sortBy === opt.value && styles.sortOptionTextActive]}>
                {opt.label}
              </Text>
              {sortBy === opt.value && (
                <Ionicons name="checkmark" size={16} color="#22D3EE" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search Bar & Dropdown */}
      <View style={[styles.searchContainer, { zIndex: 50 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cameras, drones, audio..."
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              // slight delay so we can register the tap on dropdown items
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              // Keep focus to easily type again, or dismiss
            }}>
              <Ionicons name="close-circle" size={18} color="#475569" />
            </TouchableOpacity>
          )}
        </View>

        {/* Predictive Search Dropdown */}
        {isSearchFocused && searchQuery.length > 0 && (
          <View style={styles.searchDropdown}>
            {filtered.slice(0, 5).map((item) => {
              const url = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32';
              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.searchDropdownItem}
                  onPress={() => {
                    setSearchQuery(item.name);
                    setIsSearchFocused(false);
                  }}
                >
                  <Image source={{ uri: url }} style={styles.searchDropdownImage} />
                  <View style={styles.searchDropdownInfo}>
                    <Text style={styles.searchDropdownName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.searchDropdownCat}>{item.category || 'GEAR'}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
            {filtered.length === 0 && (
              <View style={styles.searchDropdownEmpty}>
                <Text style={styles.searchDropdownEmptyText}>No matches found</Text>
              </View>
            )}
            {filtered.length > 5 && (
              <TouchableOpacity style={styles.searchDropdownMore}>
                <Text style={styles.searchDropdownMoreText}>See all {filtered.length} results</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Category Pills */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          style={{ flexGrow: 0, maxHeight: 50 }}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.name}
              style={[styles.catPill, selectedCategory === cat.id && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={selectedCategory === cat.id ? '#FFF' : '#94A3B8'}
              />
              <Text style={[styles.catPillText, selectedCategory === cat.id && styles.catPillTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading gear...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#334155" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
          <TouchableOpacity style={styles.clearBtn} onPress={() => { setSearchQuery(''); setSelectedCategory(null); }}>
            <Text style={styles.clearBtnText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderProductCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* BOTTOM NAV */}
      <BottomNav activeTab="search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  bgContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glowOrb: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    filter: [{ blur: 60 }] as any, opacity: 0.7,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: '#22D3EE' },

  // Sort Dropdown
  sortDropdown: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  sortOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, minWidth: 160,
  },
  sortOptionActive: { backgroundColor: 'rgba(34,211,238,0.08)' },
  sortOptionText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  sortOptionTextActive: { color: '#F8FAFC', fontWeight: '700' },

  // Search
  searchContainer: { paddingHorizontal: 20, marginBottom: 16, position: 'relative' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, paddingHorizontal: 16, height: 50,
    gap: 10,
  },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 15 },

  // Search Dropdown
  searchDropdown: {
    position: 'absolute', top: 56, left: 20, right: 20,
    backgroundColor: '#1E293B', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 15,
    overflow: 'hidden', paddingVertical: 8,
  },
  searchDropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchDropdownImage: {
    width: 36, height: 36, borderRadius: 8, marginRight: 12, backgroundColor: '#334155'
  },
  searchDropdownInfo: { flex: 1, justifyContent: 'center' },
  searchDropdownName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', marginBottom: 2 },
  searchDropdownCat: { fontSize: 11, color: '#64748B', fontWeight: 'bold' },
  searchDropdownEmpty: { padding: 16, alignItems: 'center' },
  searchDropdownEmptyText: { color: '#64748B', fontSize: 13 },
  searchDropdownMore: { paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  searchDropdownMoreText: { color: '#6366F1', fontSize: 13, fontWeight: '700' },

  // Categories
  categoriesRow: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  catPillActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  catPillText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  catPillTextActive: { color: '#FFF' },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  clearBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#6366F1', borderRadius: 16,
  },
  clearBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Grid
  grid: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 12 },

  // Product Card
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  productImageContainer: {
    width: '100%', height: 150,
    backgroundColor: '#FFF',
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%' },
  ratingBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  productInfo: { padding: 12 },
  productCategory: {
    fontSize: 10, fontWeight: '700', color: '#22D3EE',
    letterSpacing: 0.8, marginBottom: 4,
  },
  productName: {
    fontSize: 13, fontWeight: '700', color: '#F1F5F9',
    lineHeight: 18, marginBottom: 8,
  },
  productFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productPrice: { fontSize: 15, fontWeight: '800', color: '#6366F1' },
  perDay: { fontSize: 11, fontWeight: '400', color: '#64748B' },
});
