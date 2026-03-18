// app/(tabs)/favorites.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ScrollView, Image,
  Platform, Dimensions, StatusBar, ActivityIndicator, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetUserFavorites } from '../../src/features/equipment/favoriteApi';
import { useFavorites } from '../../src/context/FavoriteContext';
import { getToken } from '../../src/shared/utils/storage';
import BottomNav from '../../src/components/BottomNav';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const res = await ApiGetUserFavorites(token);
      
      const favs = res?.data?.favorites || res?.favorites || [];
      // Usually API returns full device objects or an array of { deviceId: {...} }
      const formattedFavs = favs.map((f: any) => f.deviceId || f);
      setFavorites(formattedFavs);
    } catch (e) {
      console.error('Fetch favorites errored:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const { toggleFavorite } = useFavorites();

  const handleToggleFavorite = async (deviceId: string) => {
    // locally optimistic so the card disappears immediately
    setFavorites(prev => prev.filter(item => item._id !== deviceId));
    await toggleFavorite(deviceId);
  };

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
            onPress={() => handleToggleFavorite(item._id)}
          >
            <Ionicons name="heart" size={16} color="#EF4444" />
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

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgContainer}>
        <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.glowOrb, { top: -80, right: -60, backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} />
        <View style={[styles.glowOrb, { bottom: 100, left: -60, backgroundColor: 'rgba(99, 102, 241, 0.2)' }]} />
      </View>

      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Favourites</Text>
          <Text style={styles.headerSubtitle}>{favorites.length} saved items</Text>
        </View>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Loading collection...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={64} color="#334155" />
          <Text style={styles.emptyTitle}>No saved items</Text>
          <Text style={styles.emptySubtitle}>Tap the heart icon on gear you like to save them here for later.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.exploreBtnText}>Explore Gear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item._id}
          renderItem={renderProductCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* BOTTOM NAV */}
      {/* Intentionally passing undefined so it doesn't highlight any active tab if we came from dropdown */}
      <BottomNav />
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
    paddingBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  exploreBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#6366F1', borderRadius: 16,
  },
  exploreBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

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
