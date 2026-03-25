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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetPublicSuppliers } from '../../src/features/supplier/api';
import BottomNav from '../../src/components/BottomNav';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Circle, Image as SvgImage, Defs, ClipPath, G } from 'react-native-svg';

const DA_NANG_COORDS = { latitude: 16.0544, longitude: 108.2022 };

import { shopsStyles as styles, mapDarkStyle } from '../../src/styles/screens/shops.styles';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

const { width } = Dimensions.get('window');

const DISTRICTS = [
  'Hải Châu',
  'Thanh Khê',
  'Sơn Trà',
  'Ngũ Hành Sơn',
  'Liên Chiểu',
  'Cẩm Lệ',
];

const ShopMarker = React.memo(({ shop, isSelected, onPress, onCalloutPress }: any) => {
  const size = isSelected ? 56 : 48;

  return (
    <Marker
      coordinate={shop.coords}
      onPress={onPress}
      tracksViewChanges={true}
    >
      <Image
        source={{ uri: shop.businessAvatar || `https://i.pravatar.cc/150?u=${shop._id}` }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: isSelected ? '#6366F1' : '#FFF',
          backgroundColor: '#FFF',
        }}
        resizeMode="cover"
      />

      <Callout tooltip onPress={onCalloutPress}>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{shop.businessName}</Text>
          <Text style={styles.calloutBtn}>View Hub Details</Text>
        </View>
      </Callout>
    </Marker>
  );
});

const ShopScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = React.useRef<MapView>(null);

  const fetchUserLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions in settings.');
        setIsLocating(false);
        return;
      }

      // Try last known first (fastest)
      let location = await Location.getLastKnownPositionAsync({});

      // If none, get current
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (location) {
        setUserLocation(location.coords);
        if (viewMode === 'map') {
          mapRef.current?.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      }
      setIsLocating(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Missing', 'Make sure GPS/Location is turned ON in your device settings.');
      setIsLocating(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedDistrict) params.district = selectedDistrict;

      const res = await ApiGetPublicSuppliers(params);
      if (res && res.success) {
        const shops = (res.data || []).map((s: any) => {
          const lat = s.warehouseAddress?.lat || (16.05 + (parseInt(s._id.substring(0, 8), 16) % 100) / 2000);
          const lng = s.warehouseAddress?.lng || (108.20 + (parseInt(s._id.substring(8, 16), 16) % 100) / 2000);

          let distance = null;
          if (userLocation) {
            distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lng);
          }

          return { ...s, coords: { latitude: lat, longitude: lng }, distance };
        });
        setSuppliers(shops);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedDistrict, userLocation]);

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
          {item.distance !== null && (
            <Text style={styles.distanceText}>• {item.distance < 1 ? `${(item.distance * 1000).toFixed(0)}m` : `${item.distance.toFixed(1)}km`}</Text>
          )}
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
      <View style={[styles.header, { paddingTop: insets.top + 10, zIndex: 100 }]}>
        <View>
          <Text style={styles.headerTitle}>{viewMode === 'list' ? 'Partner Hubs' : 'Explore Map'}</Text>
          <Text style={styles.headerSubtitle}>
            {viewMode === 'list' ? 'Find professional gear shops' : 'Locating shops around you'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.mapBtn, viewMode === 'map' && styles.activeMapBtn]}
          onPress={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
        >
          <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {viewMode === 'list' ? (
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
        ) : (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                ...DA_NANG_COORDS,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              customMapStyle={mapDarkStyle}
            >
              {suppliers.map((shop) => (
                <ShopMarker
                  key={shop._id}
                  shop={shop}
                  isSelected={selectedShop?._id === shop._id}
                  onPress={() => setSelectedShop(shop)}
                  onCalloutPress={() => router.push(`/supplier/${shop.userId?._id || shop._id}` as any)}
                />
              ))}

              {userLocation && (
                <Marker coordinate={userLocation} title="You're here" pinColor="#6366F1">
                  <View style={styles.userMarker}>
                    <View style={styles.userMarkerCore} />
                    <View style={styles.userMarkerPulse} />
                  </View>
                </Marker>
              )}
            </MapView>

            <View style={styles.mapControls}>
              <TouchableOpacity
                style={styles.mapIconBtn}
                onPress={fetchUserLocation}
              >
                <Ionicons name="location" size={20} color={isLocating ? "#94A3B8" : "#6366F1"} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapIconBtn}
                onPress={() => mapRef.current?.animateToRegion({
                  ...DA_NANG_COORDS,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                })}
              >
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>DN</Text>
              </TouchableOpacity>
            </View>

            {selectedShop && (
              <View style={styles.shopOverlay}>
                <TouchableOpacity
                  style={styles.shopOverlayCard}
                  onPress={() => router.push(`/supplier/${selectedShop.userId?._id || selectedShop._id}` as any)}
                >
                  <Image source={{ uri: selectedShop.businessAvatar }} style={styles.overlayImage} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.overlayName}>{selectedShop.businessName}</Text>
                    <Text style={styles.overlayDistrict}>{selectedShop.warehouseAddress?.district}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#6366F1" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <BottomNav activeTab="shops" />
    </View>
  );
};

export default ShopScreen;
