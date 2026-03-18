// app/home.tsx
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, Platform, Dimensions, SafeAreaView, StatusBar, ActivityIndicator, Modal } from 'react-native';
import { getToken, removeToken } from '../../src/shared/utils/storage';
import { ApiGetCurrentUser } from '../../src/features/auth/api';
import { ApiGetTrendingDevices } from '../../src/features/equipment/api';
import { useFavorites } from '../../src/context/FavoriteContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../src/components/BottomNav';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'All Gear', id: 'ALL', icon: 'grid-outline' },
  { name: 'Camera', id: 'CAMERA', icon: 'camera-outline' },
  { name: 'Lighting', id: 'LIGHTING', icon: 'bulb-outline' },
  { name: 'Audio', id: 'AUDIO', icon: 'mic-outline' },
  { name: 'Accessory', id: 'ACCESSORY', icon: 'construct-outline' },
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
    await removeToken();
    router.replace('/(auth)/login');
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
      </View>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 15 }]}>
        
        {/* TOP IMMERSIVE HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderIntro}>
             <Text style={styles.greetingText}>Good Morning,</Text>
             <Text style={styles.userText}>{userProfile?.fullName || 'Creative Explorer'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => setShowDropdown(true)} style={styles.avatarContainer}>
             <Image 
               source={{ uri: userProfile?.avatar || 'https://i.pravatar.cc/100?img=33' }} 
               style={styles.avatar} 
             />
          </TouchableOpacity>
        </View>

        {/* MODERN SEARCH BAR */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
             <Ionicons name="search" size={22} color="#94A3B8" />
             <Text style={styles.searchPlaceholder}>Search for drones, cameras...</Text>
             <View style={styles.filterButton}>
                <Ionicons name="options-outline" size={18} color="#FFF" />
             </View>
          </View>
        </View>

        {/* HERO BANNER - Soft, rounded, immersive */}
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
          {trendingGear.map((item) => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.rentPrice.perDay);
            const imageUrl = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32';
            
            return (
              <TouchableOpacity key={item._id} activeOpacity={0.9} style={styles.premiumCard}>
                 <View style={styles.premiumCardInner}>
                    <View style={styles.premiumImageContainer}>
                        <Image source={{ uri: imageUrl }} style={styles.premiumImage} resizeMode="cover" />
                        <View style={styles.premiumRatingBadge}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.premiumRatingText}>{item.ratingAvg > 0 ? item.ratingAvg.toFixed(1) : 'New'}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.heartButton}
                            onPress={() => toggleFavorite(item._id)}
                        >
                            <Ionicons 
                                name={favoriteIds.includes(item._id) ? "heart" : "heart-outline"} 
                                size={20} 
                                color={favoriteIds.includes(item._id) ? "#EF4444" : "#0F172A"} 
                            />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.premiumCardBody}>
                        <Text style={styles.premiumCategoryText}>{item.category || 'GEAR'}</Text>
                        <Text style={styles.premiumTitle} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.premiumFooter}>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceValue}>{formattedPrice}</Text>
                                <Text style={styles.pricePeriod}>/day</Text>
                            </View>
                            <View style={styles.bookButton}>
                               <Text style={styles.bookButtonText}>Book</Text>
                            </View>
                        </View>
                    </View>
                 </View>
              </TouchableOpacity>
            );
          })}
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
             <View style={styles.dropdownHeader}>
               <Text style={styles.dropdownName} numberOfLines={1}>{userProfile?.fullName || 'Creative Explorer'}</Text>
               <Text style={styles.dropdownEmail} numberOfLines={1}>{userProfile?.email || 'user@gearxpert.com'}</Text>
             </View>
             
             <View style={styles.dropdownDivider} />
             
             <TouchableOpacity 
               style={styles.dropdownItem}
               onPress={() => {
                 setShowDropdown(false);
                 router.push('/(tabs)/profile');
               }}
             >
                <View style={styles.dropdownIconBox}>
                  <Ionicons name="person-outline" size={18} color="#475569" />
                </View>
                <Text style={styles.dropdownItemText}>My Profile</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={styles.dropdownArrow} />
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.dropdownItem}
               onPress={() => {
                 setShowDropdown(false);
                 router.push('/(tabs)/favorites');
               }}
             >
                <View style={styles.dropdownIconBox}>
                  <Ionicons name="heart-outline" size={18} color="#EF4444" />
                </View>
                <Text style={styles.dropdownItemText}>Favourites</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={styles.dropdownArrow} />
             </TouchableOpacity>
             <TouchableOpacity style={styles.dropdownItem}>
                <View style={styles.dropdownIconBox}>
                  <Ionicons name="settings-outline" size={18} color="#475569" />
                </View>
                <Text style={styles.dropdownItemText}>Settings</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={styles.dropdownArrow} />
             </TouchableOpacity>
             
             <View style={styles.dropdownDivider} />
             
             <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowDropdown(false); handleLogout(); }}>
                <View style={[styles.dropdownIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>Log Out</Text>
             </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F172A',
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: [{ blur: 60 }] as any, 
    opacity: 0.8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  topHeaderIntro: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  userText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.5)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    color: '#94A3B8',
    fontSize: 15,
  },
  filterButton: {
    backgroundColor: '#6366F1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    marginHorizontal: 24,
    height: 180,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 36,
    backgroundColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    backdropFilter: 'blur(10px)', // Web polyfill, ignored on native but concepts map
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22D3EE',
  },
  categoriesList: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  categoryPillTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  trendingList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  premiumCard: {
    width: width * 0.75,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  premiumCardInner: {
    backgroundColor: '#1E293B', // Solid slate dark to prevent blur rendering bugs over images
    borderRadius: 32,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  premiumImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#FFF', // Solid white to show transparent product images cleanly
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  premiumImage: {
    width: '100%',
    height: '100%',
  },
  premiumRatingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  premiumRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumCardBody: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  premiumCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  premiumFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#22D3EE',
  },
  pricePeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 3,
    marginLeft: 2,
  },
  bookButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bookButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  // === Dropdown Styles ===
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)', // Very subtle dimming
  },
  dropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 60,
    right: 24,
    width: 260,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  dropdownEmail: {
    fontSize: 13,
    color: '#94A3B8',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  dropdownIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  dropdownArrow: {
    marginLeft: 'auto',
  },

  // BRANDS
  brandList: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 16,
  },
  brandCard: {
    alignItems: 'center',
    gap: 8,
  },
  brandIconContainer: {
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  brandText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // KITS
  kitsContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 16,
  },
  kitCard: {
    width: '100%',
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
  },
  kitImage: {
    width: '100%', height: '100%',
  },
  kitGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  kitInfo: {
    position: 'absolute',
    bottom: 16, left: 20, right: 20,
  },
  kitTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#FFF',
    marginBottom: 4, letterSpacing: -0.5,
  },
  kitDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)',
  }
});
