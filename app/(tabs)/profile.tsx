import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, Platform, Dimensions, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { getToken } from '../../src/shared/utils/storage';
import { useAuth } from '../../src/context/AuthContext';
import { ApiGetCurrentUser } from '../../src/features/auth/api';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileStyles as styles } from '../../src/styles/screens/profile.styles';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const MenuAction = ({ icon, label, value, hideArrow, onPress }: { icon: string, label: string, value?: string, hideArrow?: boolean, onPress?: () => void }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
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

  const isStaff = userProfile?.role === 'STAFF' || userProfile?.role === 'OPERATION_STAFF' || userProfile?.role === 'ADMIN';

  // Determine Rank Badge Colors
  const isGoldRank = userProfile?.rank?.toLowerCase() === 'gold';
  const rankColors = isGoldRank
    ? { border: 'rgba(245, 158, 11, 0.5)', bg: 'rgba(245, 158, 11, 0.15)', text: '#FCD34D' }
    : { border: 'rgba(226, 232, 240, 0.3)', bg: 'rgba(248, 250, 252, 0.1)', text: '#CBD5E1' };

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
        <View style={[styles.glowOrb, { top: -50, left: -50, backgroundColor: 'rgba(99, 102, 241, 0.3)' }]} />
        <View style={[styles.glowOrb, { bottom: 100, right: -50, backgroundColor: 'rgba(34, 211, 238, 0.2)' }]} />
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
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
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={0.8} 
            onPress={() => router.push('/wallet')}
          >
            <BlurView intensity={20} tint="dark" style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                <Ionicons name="wallet-outline" size={24} color="#22D3EE" />
              </View>
              <Text style={styles.statValue}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(userProfile?.walletBalance || 0)}
              </Text>
              <Text style={styles.statLabel}>My Wallet</Text>
            </BlurView>
          </TouchableOpacity>

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
          {isStaff && (
            <>
              <MenuAction 
                icon="briefcase-outline" 
                label="Staff Dashboard" 
                onPress={() => router.push('/staff/dashboard')} 
              />
              <View style={styles.divider} />
            </>
          )}
          <MenuAction icon="lock-closed-outline" label="Change Password" />
          <View style={styles.divider} />
          <MenuAction icon="time-outline" label="Rental History" />
          <View style={styles.divider} />
          <MenuAction icon="star-outline" label="My Reviews" />
          <View style={styles.divider} />
          <MenuAction icon="cart-outline" label="My Cart" onPress={() => router.push('/cart')} />
          <View style={styles.divider} />
          <MenuAction icon="log-out-outline" label="Logout" hideArrow onPress={handleLogout} />
        </BlurView>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}
