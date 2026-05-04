import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ScrollView, Image,
  Platform, Dimensions, StatusBar, ActivityIndicator, TextInput, FlatList, Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetDevices } from '../../src/features/equipment/api';
import { useFavorites } from '../../src/context/FavoriteContext';
import BottomNav from '../../src/components/BottomNav';
import DeviceCard from '../../src/components/DeviceCard';
import { productsStyles as styles } from '../../src/styles/screens/products.styles';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'All Gear', id: null, icon: 'grid-outline' },
  { name: 'Camera', id: 'CAMERA', icon: 'camera-outline' },
  { name: 'Lighting', id: 'LIGHTING', icon: 'bulb-outline' },
  { name: 'Audio', id: 'AUDIO', icon: 'mic-outline' },
  { name: 'Office', id: 'OFFICE', icon: 'briefcase-outline' },
  { name: 'Gaming', id: 'GAMING', icon: 'game-controller-outline' },
  { name: 'Accessories', id: 'ACCESSORY', icon: 'construct-outline' },
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
  const params = useLocalSearchParams<{ category?: string; autoFocusSearch?: string }>();
  const searchInputRef = useRef<TextInput>(null);

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
      Keyboard.dismiss();
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

  // Handle auto-focus from Home search bar
  useEffect(() => {
    if (params.autoFocusSearch === 'true') {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [params.autoFocusSearch]);

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

  const renderProductCard = ({ item }: { item: any }) => (
    <DeviceCard
      device={item}
      variant="grid"
      isFavorite={favoriteIds.includes(item._id)}
      onFavoriteToggle={toggleFavorite}
    />
  );

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
            ref={searchInputRef}
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
              onPress={() => {
                setSelectedCategory(cat.id);
                Keyboard.dismiss();
              }}
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
