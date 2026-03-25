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
import DeviceCard from '../../src/components/DeviceCard';
import { useFocusEffect } from 'expo-router';
import { favoritesStyles as styles } from '../../src/styles/screens/favorites.styles';

const { width } = Dimensions.get('window');

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

  const renderProductCard = ({ item }: { item: any }) => (
    <DeviceCard
      device={item}
      variant="grid"
      isFavorite={true} // In favorites screen, it's always favorite
      onFavoriteToggle={handleToggleFavorite}
    />
  );

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
