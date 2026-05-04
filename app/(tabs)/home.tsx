// app/home.tsx
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, Platform, Dimensions, SafeAreaView, StatusBar, ActivityIndicator, Modal } from 'react-native';
import { getToken } from '../../src/shared/utils/storage';
import { useAuth } from '../../src/context/AuthContext';
import { ApiGetCurrentUser } from '../../src/features/auth/api';
import { ApiGetTrendingDevices } from '../../src/features/equipment/api';
import { useFavorites } from '../../src/context/FavoriteContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../src/components/BottomNav';
import DeviceCard from '../../src/components/DeviceCard';
import { homeStyles as styles } from '../../src/styles/screens/home.styles';

const logoImg = require('../../assets/images/logoGearXpert.png');

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'All Gear', id: 'ALL', icon: 'grid-outline' },
  { name: 'Camera', id: 'CAMERA', icon: 'camera-outline' },
  { name: 'Lighting', id: 'LIGHTING', icon: 'bulb-outline' },
  { name: 'Audio', id: 'AUDIO', icon: 'mic-outline' },
  { name: 'Office', id: 'OFFICE', icon: 'briefcase-outline' },
  { name: 'Gaming', id: 'GAMING', icon: 'game-controller-outline' },
  { name: 'Accessories', id: 'ACCESSORY', icon: 'construct-outline' },
  { name: 'Drone', id: 'DRONE', icon: 'airplane-outline' },
  { name: 'Other', id: 'OTHER', icon: 'apps-outline' },
];

const TOP_BRANDS = [
  { id: 'sony', name: 'Sony', icon: 'camera-outline' },
  { id: 'canon', name: 'Canon', icon: 'aperture-outline' },
  { id: 'dji', name: 'DJI', icon: 'airplane-outline' },
  { id: 'rode', name: 'Rode', icon: 'mic-outline' },
  { id: 'godox', name: 'Godox', icon: 'bulb-outline' },
];

const PACKAGES = [
  { id: 'p1', title: 'Vlog Studio Kit', desc: 'Sony ZV-E10 + Rode Mic', image: 'https://images.unsplash.com/photo-1596710669207-617a221fbad6?auto=format&fit=crop&q=80', color: 'rgba(139, 92, 246, 0.8)' },
  { id: 'p2', title: 'Cinematic Bundle', desc: 'RED Komodo + Prime Lenses', image: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&q=80', color: 'rgba(16, 185, 129, 0.8)' }
];


export default function Homepage() {
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trendingGear, setTrendingGear] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { favoriteIds, toggleFavorite, refreshFavorites } = useFavorites();

  useFocusEffect(
    useCallback(() => {
      refreshFavorites();
    }, [refreshFavorites])
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch User Info
        const token = await getToken();
        if (token) {
          const userRes = await ApiGetCurrentUser(token);
          if (userRes && userRes.errorCode === 0) {
            setUserProfile(userRes.data);
          }
        }

        // Fetch Trending Gear via API layer
        const response = await ApiGetTrendingDevices();
        if (response && response.devices) {
          setTrendingGear(response.devices);
        }
      } catch (error) {
        console.error("Error fetching homepage data", error);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      {/* Background with mesh gradient feel */}
      <View style={styles.bgContainer}>
        <LinearGradient
          colors={['#0F172A', '#1E1B4B']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Glow Effects */}
        <View style={[styles.glowOrb, { top: -100, left: -50, backgroundColor: 'rgba(99, 102, 241, 0.4)' }]} />
        <View style={[styles.glowOrb, { bottom: -50, right: -100, backgroundColor: 'rgba(34, 211, 238, 0.3)' }]} />
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 15 }]}>

        {/* TOP IMMERSIVE HEADER */}
        <View style={styles.topHeader}>
          <Image source={logoImg} style={styles.logoHeader} resizeMode="contain" />
          <TouchableOpacity onPress={() => setShowDropdown(true)} style={styles.avatarContainer}>
            <Image
              source={{ uri: userProfile?.avatar || `https://i.pravatar.cc/150?u=${userProfile?.email || 'guest'}` }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        {/* MODERN SEARCH BAR */}
        <TouchableOpacity 
          style={styles.searchSection} 
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/(tabs)/products', params: { autoFocusSearch: 'true' } })}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search" size={22} color="#94A3B8" />
            <Text style={styles.searchPlaceholder}>Search for drones, cameras...</Text>
            <View style={styles.filterButton}>
              <Ionicons name="options-outline" size={18} color="#FFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* SMART GEAR AI BANNER */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.smartGearCard}
            onPress={() => router.push('/smart-gear')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.smartGearGradient}
            >
              <View style={styles.smartGearContent}>
                <View style={styles.smartGearBadge}>
                  <Ionicons name="sparkles" size={12} color="#FFF" />
                  <Text style={styles.smartGearBadgeText}>AI POWERED</Text>
                </View>
                <Text style={styles.smartGearTitle}>SmartGear AI Assistant</Text>
                <Text style={styles.smartGearSubtitle}>Get personalized gear recommendations based on your creative needs.</Text>
                <View style={styles.smartGearAction}>
                  <Text style={styles.smartGearActionText}>Try it now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#22D3EE" />
                </View>
              </View>
              <View style={styles.smartGearIconBox}>
                <Ionicons name="hardware-chip-outline" size={60} color="rgba(34, 211, 238, 0.2)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* PILL CATEGORIES */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {CATEGORIES.map((cat, index) => {
            const isActive = cat.id === 'ALL';
            return (
              <TouchableOpacity
                key={cat.id || index}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => router.push({ pathname: '/(tabs)/products', params: { category: cat.id } })}
              >
                <Ionicons name={cat.icon as any} size={16} color={isActive ? "#FFF" : "#F8FAFC"} />
                <Text style={isActive ? styles.categoryPillTextActive : styles.categoryPillText}>{cat.name}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* PREMIUM TRENDING LIST */}
        <View style={[styles.sectionContainer, styles.rowBetween]}>
          <Text style={styles.sectionTitle}>Most Popular</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList} snapToInterval={width * 0.75 + 20} decelerationRate="fast">
          {trendingGear.map((item) => (
            <DeviceCard
              key={item._id}
              device={item}
              variant="horizontal"
              isFavorite={favoriteIds.includes(item._id)}
              onFavoriteToggle={toggleFavorite}
            />
          ))}
        </ScrollView>

        {/* TOP BRANDS */}
        <View style={[styles.sectionContainer, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Top Brands</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandList}>
          {TOP_BRANDS.map(b => (
            <TouchableOpacity key={b.id} style={styles.brandCard}>
              <View style={styles.brandIconContainer}>
                <Ionicons name={b.icon as any} size={26} color="#22D3EE" />
              </View>
              <Text style={styles.brandText}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* HERO BANNER - Weekend Promo */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1542496658-e32689368832?q=80&w=800&auto=format&fit=crop' }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>WEEKEND PROMO</Text>
            </View>
            <Text style={styles.heroTitle}>Level up your content.</Text>
            <Text style={styles.heroSubtitle}>Get 20% off all Sony lenses</Text>
          </View>
        </View>

        {/* CURATED KITS */}
        <View style={[styles.sectionContainer, styles.rowBetween, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Curated Kits</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
        </View>
        <View style={styles.kitsContainer}>
          {PACKAGES.map(pkg => (
            <TouchableOpacity key={pkg.id} style={styles.kitCard} activeOpacity={0.85}>
              <Image source={{ uri: pkg.image }} style={styles.kitImage} />
              <LinearGradient colors={['transparent', pkg.color]} style={styles.kitGradient} />
              <View style={styles.kitInfo}>
                <Text style={styles.kitTitle}>{pkg.title}</Text>
                <Text style={styles.kitDesc}>{pkg.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav activeTab="home" />
      {/* Profile Dropdown Modal */}

      <Modal visible={showDropdown} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => {
                setShowDropdown(false);
                router.push('/(tabs)/profile');
              }}
            >
              <View style={styles.dropdownHeaderLeft}>
                <Image
                  source={{ uri: userProfile?.avatar || `https://i.pravatar.cc/150?u=${userProfile?.email || 'guest'}` }}
                  style={styles.dropdownAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownName} numberOfLines={1}>{userProfile?.fullName || 'Creative Explorer'}</Text>
                  <Text style={styles.dropdownEmail} numberOfLines={1} ellipsizeMode="tail">{userProfile?.email || 'user@gearxpert.com'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            {/* RANK & WALLET */}
            <View style={styles.statsContainer}>
              <LinearGradient
                colors={
                  userProfile?.rank === 'GOLD' ? ['#F59E0B', '#FCD34D'] :
                    userProfile?.rank === 'SILVER' ? ['#94A3B8', '#CBD5E1'] :
                      ['#B45309', '#D97706']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rankCard}
              >
                <View style={styles.rankContent}>
                  <Ionicons name="medal" size={20} color="rgba(0,0,0,0.5)" />
                  <View>
                    <Text style={styles.rankLabel}>Hạng {userProfile?.rank || 'BRONZE'}</Text>
                    <Text style={styles.rankPoints}>{(userProfile?.rewardPoints || 0).toLocaleString()} điểm</Text>
                  </View>
                </View>
              </LinearGradient>

              <TouchableOpacity
                style={styles.walletCard}
                onPress={() => {
                  setShowDropdown(false);
                  router.push('/(tabs)/wallet' as any);
                }}
              >
                <View style={styles.walletHeader}>
                  <Ionicons name="wallet-outline" size={18} color="#10B981" />
                  <Text style={styles.walletLabel}>Ví GearXpert</Text>
                </View>
                <Text style={styles.walletBalance} numberOfLines={1}>
                  {(userProfile?.walletBalance || 0).toLocaleString('vi-VN')}đ
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownDivider} />

            <View style={styles.menuContainer}>
              {[
                { label: 'Đơn thuê của tôi', icon: 'receipt-outline', path: '/(tabs)/rental' },
                { label: 'Vouchers', icon: 'ticket-outline', path: '/(tabs)/vouchers' },
                { label: 'Yêu thích', icon: 'heart-outline', path: '/(tabs)/favorites' },
                { label: 'Cài đặt', icon: 'settings-outline', path: '/(tabs)/settings' },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    router.push(item.path as any);
                  }}
                >
                  <View style={styles.dropdownIconBox}>
                    <Ionicons name={item.icon as any} size={18} color="#22D3EE" />
                  </View>
                  <Text style={styles.dropdownItemText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#475569" />
                </TouchableOpacity>
              ))}

              <View style={[styles.dropdownDivider, { marginVertical: 8 }]} />

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
              >
                <View style={[styles.dropdownIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
