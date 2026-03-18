import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, Platform, Dimensions, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { getToken, removeToken } from '../../src/shared/utils/storage';
import { ApiGetCurrentUser } from '../../src/features/auth/api';

import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rentals, setRentals] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        if (token) {
          const userRes = await ApiGetCurrentUser(token);
          if (userRes && userRes.errorCode === 0) {
            setUserProfile(userRes.data);
          }
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const MenuAction = ({ icon, label, value, hideArrow }: { icon: string, label: string, value?: string, hideArrow?: boolean }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
      <View style={styles.menuIconBox}>
        <Ionicons name={icon as any} size={20} color="#22D3EE" />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {value ? (
         <Text style={styles.menuValue}>{value}</Text>
      ) : null}
      {!hideArrow && (
         <Ionicons name="chevron-forward" size={18} color="#475569" style={styles.menuArrow} />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  // Determine Rank Badge Colors
  const isGoldRank = userProfile?.rank?.toLowerCase() === 'gold';
  const rankColors = isGoldRank 
    ? { border: 'rgba(245, 158, 11, 0.5)', bg: 'rgba(245, 158, 11, 0.15)', text: '#FCD34D' }
    : { border: 'rgba(226, 232, 240, 0.3)', bg: 'rgba(248, 250, 252, 0.1)', text: '#CBD5E1' };

  return (
    <View style={styles.container}>
      {/* Background with mesh gradient feel */}
      <View style={styles.bgContainer}>
        <LinearGradient
          colors={['#0F172A', '#1E1B4B']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Glow Effects */}
        <View style={[styles.glowOrb, { top: -50, left: -50, backgroundColor: 'rgba(99, 102, 241, 0.3)' }]} />
        <View style={[styles.glowOrb, { bottom: 100, right: -50, backgroundColor: 'rgba(34, 211, 238, 0.2)' }]} />
      </View>

      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* TOP NAVIGATION */}
      <View style={[styles.navbar, { top: insets.top + 10, left: 20, right: 20 }]}>
        <TouchableOpacity style={styles.glassButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.glassButton}>
          <Ionicons name="create-outline" size={24} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      {/* SCROLL CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70 }]}
      >
        {/* Profile Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: userProfile?.avatar || 'https://i.pravatar.cc/150?img=33' }} 
              style={styles.avatarImage} 
            />
            <TouchableOpacity style={styles.cameraIconBadge}>
               <Ionicons name="camera" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.fullName}>{userProfile?.fullName || 'Creative Explorer'}</Text>
          <Text style={styles.email}>{userProfile?.email || 'user@gearxpert.com'}</Text>

          <View style={[styles.rankBadge, { backgroundColor: rankColors.bg, borderColor: rankColors.border }]}>
             <Ionicons name="star" size={12} color={rankColors.text} style={{ marginRight: 4 }} />
             <Text style={[styles.rankBadgeText, { color: rankColors.text }]}>{userProfile?.rank || 'SILVER'} MEMBER</Text>
          </View>
        </View>

        {/* Stats Section / Wallet & Points */}
        <View style={styles.statsContainer}>
          <BlurView intensity={20} tint="dark" style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
               <Ionicons name="wallet-outline" size={24} color="#22D3EE" />
            </View>
            <Text style={styles.statValue}>
               {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(userProfile?.walletBalance || 0)}
            </Text>
            <Text style={styles.statLabel}>My Wallet</Text>
          </BlurView>
          
          <BlurView intensity={20} tint="dark" style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(252, 211, 77, 0.15)' }]}>
               <Ionicons name="trophy-outline" size={24} color="#FCD34D" />
            </View>
            <Text style={styles.statValue}>{userProfile?.rewardPoints || 0}</Text>
            <Text style={styles.statLabel}>Reward Points</Text>
          </BlurView>
        </View>

        {/* Settings Menu Sections */}
        <Text style={styles.sectionHeader}>Personal Info</Text>
        <BlurView intensity={20} tint="dark" style={styles.menuSection}>
          <MenuAction icon="call-outline" label="Phone Number" value={userProfile?.phone || 'Not provided'} hideArrow />
          <View style={styles.divider} />
          <MenuAction icon="location-outline" label="Address" value={userProfile?.address?.city || 'Update Delivery'} />
          <View style={styles.divider} />
          <MenuAction icon="shield-checkmark-outline" label="Identity Verfication (eKYC)" value={userProfile?.isVerifiedEkyc ? 'Verified' : 'Pending'} />
        </BlurView>

        <Text style={styles.sectionHeader}>Actions</Text>
        <BlurView intensity={20} tint="dark" style={styles.menuSection}>
          <MenuAction icon="lock-closed-outline" label="Change Password" />
          <View style={styles.divider} />
          <MenuAction icon="time-outline" label="Rental History" />
          <View style={styles.divider} />
          <MenuAction icon="star-outline" label="My Reviews" />
        </BlurView>
        
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0F172A',
  },
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
  // ------ PROFILES STYLES ------
  scrollContent: {
    paddingBottom: 100,
  },
  // top nav
  navbar: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    padding: 3, 
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.5)',
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#0F172A',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.5)',
  },
  fullName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginHorizontal: 32,
    marginTop: 36,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  menuSection: {
    borderRadius: 24,
    marginHorizontal: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  menuValue: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 8,
  },
  menuArrow: {
    // optional spacing
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 68,
  }
});
