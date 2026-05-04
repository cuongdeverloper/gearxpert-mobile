import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, Platform, Dimensions, SafeAreaView, StatusBar, ActivityIndicator, TextInput, Alert } from 'react-native';
import { getToken } from '../../src/shared/utils/storage';
import { useAuth } from '../../src/context/AuthContext';
import { ApiGetCurrentUser, ApiUpdateProfile } from '../../src/features/auth/api';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { profileStyles as styles } from '../../src/styles/screens/profile.styles';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    district: '',
    city: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      if (token) {
        const userRes = await ApiGetCurrentUser(token);
        if (userRes && userRes.errorCode === 0) {
          setUserProfile(userRes.data);
          setFormData({
            fullName: userRes.data.fullName || '',
            phone: userRes.data.phone || '',
            street: userRes.data.address?.street || '',
            district: userRes.data.address?.district || '',
            city: userRes.data.address?.city || '',
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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

  const handleLogout = async () => {
    await logout();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    setSavingProfile(true);
    try {
      const token = await getToken();
      if (!token) return;

      const submitFormData = new FormData();
      submitFormData.append('fullName', formData.fullName);
      submitFormData.append('phone', formData.phone);
      submitFormData.append('street', formData.street);
      submitFormData.append('district', formData.district);
      submitFormData.append('city', formData.city);

      if (selectedImage) {
        const uriParts = selectedImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        submitFormData.append('avatar', {
          uri: selectedImage,
          name: `avatar.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await ApiUpdateProfile(token, submitFormData);
      if (response?.errorCode === 0) {
        Alert.alert("Thành công", "Cập nhật thông tin thành công");
        setIsEditing(false);
        fetchProfile();
      } else {
        Alert.alert("Lỗi", response?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Error updating profile", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setSavingProfile(false);
    }
  };

  const isGoldRank = userProfile?.rank?.toLowerCase() === 'gold';
  const rankColors = isGoldRank
    ? { border: 'rgba(245, 158, 11, 0.5)', bg: 'rgba(245, 158, 11, 0.15)', text: '#FCD34D' }
    : { border: 'rgba(226, 232, 240, 0.3)', bg: 'rgba(248, 250, 252, 0.1)', text: '#CBD5E1' };

  return (
    <View style={styles.container}>
      <View style={styles.bgContainer}>
        <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.glowOrb, { top: -50, left: -50, backgroundColor: 'rgba(99, 102, 241, 0.3)' }]} />
        <View style={[styles.glowOrb, { bottom: 100, right: -50, backgroundColor: 'rgba(34, 211, 238, 0.2)' }]} />
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>

      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.navbar, { top: insets.top + 10, left: 20, right: 20 }]}>
        <TouchableOpacity style={styles.glassButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.glassButton, isEditing && { backgroundColor: 'rgba(34, 211, 238, 0.2)', borderColor: '#22D3EE' }]} 
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color={isEditing ? "#22D3EE" : "#F8FAFC"} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70 }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: selectedImage || userProfile?.avatar || 'https://i.pravatar.cc/150?img=33' }} 
              style={styles.avatarImage} 
            />
            {isEditing && (
              <TouchableOpacity style={styles.cameraIconBadge} onPress={pickImage}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
          {!isEditing ? (
            <>
              <Text style={styles.fullName}>{userProfile?.fullName || 'Creative Explorer'}</Text>
              <Text style={styles.email}>{userProfile?.email || 'user@gearxpert.com'}</Text>
              <View style={[styles.rankBadge, { backgroundColor: rankColors.bg, borderColor: rankColors.border }]}>
                <Ionicons name="star" size={12} color={rankColors.text} style={{ marginRight: 4 }} />
                <Text style={[styles.rankBadgeText, { color: rankColors.text }]}>{userProfile?.rank || 'SILVER'} MEMBER</Text>
              </View>
            </>
          ) : (
            <Text style={styles.fullName}>Chỉnh sửa hồ sơ</Text>
          )}
        </View>

        {!isEditing ? (
          <>
            <View style={styles.statsContainer}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push('/(tabs)/wallet' as any)}>
                <BlurView intensity={20} tint="dark" style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}><Ionicons name="wallet-outline" size={24} color="#22D3EE" /></View>
                  <Text style={styles.statValue}>{(userProfile?.walletBalance || 0).toLocaleString()}đ</Text>
                  <Text style={styles.statLabel}>Ví của tôi</Text>
                </BlurView>
              </TouchableOpacity>
              <View style={{ width: 15 }} />
              <BlurView intensity={20} tint="dark" style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(252, 211, 77, 0.15)' }]}><Ionicons name="trophy-outline" size={24} color="#FCD34D" /></View>
                <Text style={styles.statValue}>{userProfile?.rewardPoints || 0}</Text>
                <Text style={styles.statLabel}>Điểm thưởng</Text>
              </BlurView>
            </View>

            <Text style={styles.sectionHeader}>Thông tin cá nhân</Text>
            <BlurView intensity={20} tint="dark" style={styles.menuSection}>
              <MenuAction icon="call-outline" label="Số điện thoại" value={userProfile?.phone || 'Chưa cập nhật'} hideArrow />
              <View style={styles.divider} />
              <MenuAction icon="location-outline" label="Địa chỉ" value={userProfile?.address?.city || 'Đà Nẵng'} />
              <View style={styles.divider} />
              <MenuAction icon="shield-checkmark-outline" label="Định danh (eKYC)" value={userProfile?.isVerifiedEkyc ? 'Đã xác minh' : 'Chưa xác minh'} />
            </BlurView>
          </>
        ) : (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Địa chỉ (Số nhà, tên đường)</Text>
              <TextInput
                style={styles.input}
                value={formData.street}
                onChangeText={(text) => setFormData({ ...formData, street: text })}
                placeholder="Nhập địa chỉ"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Quận/Huyện</Text>
                <TextInput
                  style={styles.input}
                  value={formData.district}
                  onChangeText={(text) => setFormData({ ...formData, district: text })}
                  placeholder="Quận/Huyện"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Tỉnh/Thành phố</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="Tỉnh/Thành phố"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, savingProfile && { opacity: 0.7 }]} 
              onPress={handleUpdateProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionHeader}>Quản lý & Hành động</Text>
        <BlurView intensity={20} tint="dark" style={styles.menuSection}>
          {isStaff && (
            <>
              <MenuAction icon="briefcase-outline" label="Khu vực nhân viên" onPress={() => router.push('/staff/dashboard')} />
              <View style={styles.divider} />
            </>
          )}
          <MenuAction icon="time-outline" label="Quản lý đơn thuê" onPress={() => router.push('/(tabs)/rental' as any)} />
          <View style={styles.divider} />
          <MenuAction icon="star-outline" label="Đánh giá của tôi" />
          <View style={styles.divider} />
          <MenuAction icon="cart-outline" label="Giỏ hàng của tôi" onPress={() => router.push('/cart')} />
          <View style={styles.divider} />
          <MenuAction icon="time-outline" label="Lịch sử hoạt động" onPress={() => router.push('/staff/activity-history')} />
          <View style={styles.divider} />
          <MenuAction icon="lock-closed-outline" label="Đổi mật khẩu" />
          <View style={styles.divider} />
          <MenuAction icon="log-out-outline" label="Đăng xuất" hideArrow onPress={handleLogout} />
        </BlurView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
