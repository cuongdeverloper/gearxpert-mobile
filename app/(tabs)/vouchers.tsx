import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Modal, 
  Platform,
  Dimensions,
  Image,
  StatusBar,
  Alert
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ApiGetVouchers } from '../../src/features/voucher/api';
import { vouchersStyles as styles } from '../../src/styles/screens/vouchers.styles';
import BottomNav from '../../src/components/BottomNav';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'Tất cả', id: 'ALL', icon: 'grid-outline' },
  { name: 'Hệ thống', id: 'GLOBAL', icon: 'globe-outline' },
  { name: 'Cửa hàng', id: 'SUPPLIER', icon: 'cart-outline' },
];

export default function VouchersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await ApiGetVouchers();
      if (res && res.success) {
        setVouchers(res.vouchers);
      }
    } catch (error) {
      console.error("Error fetching vouchers", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVouchers = vouchers.filter(v => {
    const matchesFilter = activeFilter === 'ALL' || v.type === activeFilter;
    const matchesSearch = (v.code || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (v.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handleCopy = async (code: string) => {
    if (code) {
      await Clipboard.setStringAsync(code);
    }
  };

  const VoucherCard = ({ voucher }: { voucher: any }) => {
    const isGlobal = voucher.type === 'GLOBAL';
    return (
      <TouchableOpacity 
        style={styles.voucherCardOuter} 
        activeOpacity={0.9}
        onPress={() => {
          setSelectedVoucher(voucher);
          setModalVisible(true);
        }}
      >
        <View style={styles.ticketContainer}>
          {/* Ticket Notches */}
          <View style={styles.ticketNotchTop} />
          <View style={styles.ticketNotchBottom} />

          {/* Left Side: Category Icon */}
          <View style={[styles.voucherLeftSection, isGlobal && { backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}>
            <View style={[styles.iconGlow, isGlobal && { borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
              <Ionicons 
                name={isGlobal ? "trophy" : "storefront"} 
                size={34} 
                color={isGlobal ? "#818CF8" : "#94A3B8"} 
                style={styles.voucherIcon}
              />
            </View>
            <View style={styles.typeBadge}>
               <Text style={[styles.voucherTypeText, isGlobal && { color: '#818CF8' }]}>{isGlobal ? 'Global' : 'Shop'}</Text>
            </View>
          </View>

          {/* Right Side: Content */}
          <View style={styles.voucherRightSection}>
            <View style={styles.voucherHeaderRow}>
               <View>
                  <Text style={styles.discountLabel}>{isGlobal ? 'Ưu đãi hệ thống' : 'Ưu đãi shop'}</Text>
                  <Text style={styles.discountValue}>
                    {voucher.discountType === 'PERCENT' ? `${voucher.discountValue}% OFF` : ` Giảm ${voucher.discountValue.toLocaleString()}đ`}
                  </Text>
               </View>
               <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopy(voucher.code)}>
                  <Ionicons name="copy-outline" size={16} color="#94A3B8" />
               </TouchableOpacity>
            </View>

            <View style={styles.codeRow}>
               <Text style={styles.voucherCode}>{voucher.code}</Text>
            </View>

            <Text style={styles.voucherDesc} numberOfLines={1}>{voucher.description}</Text>

            <View style={styles.divider} />

            <View style={styles.footerRow}>
               <View style={styles.expiryBox}>
                  <Ionicons name="calendar-outline" size={12} color="#64748B" />
                  <Text style={styles.expiryText}>{formatDate(voucher.expiredAt)}</Text>
               </View>
               <TouchableOpacity 
                 style={[styles.actionBtn, isGlobal && { backgroundColor: '#6366F1' }]}
                 onPress={() => {
                   setSelectedVoucher(voucher);
                   setModalVisible(true);
                 }}
               >
                 <Text style={styles.actionBtnText}>Dùng ngay</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Dynamic Background */}
      <View style={styles.bgContainer}>
        <LinearGradient
          colors={['#0F172A', '#1E1B4B', '#0F172A']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.glowOrb, { top: -50, left: -50, backgroundColor: 'rgba(99, 102, 241, 0.4)' }]} />
        <View style={[styles.glowOrb, { top: 200, right: -100, backgroundColor: 'rgba(34, 211, 238, 0.2)' }]} />
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Vouchers</Text>
            </View>
            <View style={styles.countBadge}>
               <Text style={styles.countText}>{filteredVouchers.length} Sẵn có</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Sưu tầm ưu đãi độc quyền để tối ưu ngân sách thuê thiết bị của bạn.</Text>
        </View>

        {/* Search & Categories */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Tìm theo mã hoặc nội dung..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryPill, activeFilter === cat.id && styles.categoryPillActive]}
              onPress={() => setActiveFilter(cat.id)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={16} 
                color={activeFilter === cat.id ? "#FFF" : "#94A3B8"} 
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryPillText, activeFilter === cat.id && styles.categoryPillTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List Content */}
        {loading ? (
          <View style={{ marginTop: 100 }}>
            <ActivityIndicator size="large" color="#22D3EE" />
          </View>
        ) : (
          <View style={styles.vouchersList}>
            {filteredVouchers.length > 0 ? (
              filteredVouchers.map((v, i) => <VoucherCard key={v._id || i} voucher={v} />)
            ) : (
              <View style={styles.emptyBox}>
                <View style={styles.emptyGraphic}>
                  <Ionicons name="ticket-outline" size={60} color="rgba(34, 211, 238, 0.2)" />
                </View>
                <Text style={styles.emptyTitle}>Kho voucher đang trống</Text>
                <Text style={styles.emptySubtitle}>Hãy thử xóa bộ lọc hoặc quay lại vào lần tới nhé!</Text>
              </View>
            )}
            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>

      {/* DETAIL MODAL PREMIUM */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[styles.modalContent, { paddingBottom: insets.bottom }]}
          >
            <View style={styles.modalHandle} />
            
            {selectedVoucher && (
              <>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalVoucherCard}>
                     <View style={[styles.modalIconFrame, { backgroundColor: selectedVoucher.type === 'GLOBAL' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(51, 65, 85, 0.3)' }]}>
                        <Ionicons 
                          name={selectedVoucher.type === 'GLOBAL' ? "ribbon" : "storefront"} 
                          size={54} 
                          color={selectedVoucher.type === 'GLOBAL' ? "#818CF8" : "#94A3B8"} 
                        />
                     </View>
                     <Text style={styles.modalDiscountText}>
                       {selectedVoucher.discountType === 'PERCENT' ? `${selectedVoucher.discountValue}% GIẢM` : ` Giảm ${selectedVoucher.discountValue.toLocaleString()}đ`}
                     </Text>
                     <TouchableOpacity style={styles.modalCodeShell} onPress={() => handleCopy(selectedVoucher.code)}>
                        <Text style={styles.modalCodeText}>{selectedVoucher.code}</Text>
                        <Ionicons name="copy" size={18} color="#6366F1" />
                     </TouchableOpacity>
                  </View>

                  <View style={styles.infoContainer}>
                     <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}>
                           <Ionicons name="gift-outline" size={24} color="#6366F1" />
                        </View>
                        <View>
                           <Text style={styles.infoLabel}>Ưu đãi dành cho</Text>
                           <Text style={styles.infoValue}>{selectedVoucher.description}</Text>
                        </View>
                     </View>

                     <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}>
                           <Ionicons name="time-outline" size={24} color="#6366F1" />
                        </View>
                        <View>
                           <Text style={styles.infoLabel}>Có hiệu lực đến</Text>
                           <Text style={styles.infoValue}>{formatDate(selectedVoucher.expiredAt)}</Text>
                        </View>
                     </View>

                     <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}>
                           <Ionicons name="card-outline" size={24} color="#6366F1" />
                        </View>
                        <View>
                           <Text style={styles.infoLabel}>Điều kiện tối thiểu</Text>
                           <Text style={styles.infoValue}>Đơn hàng từ {selectedVoucher.minOrderValue.toLocaleString()}đ</Text>
                        </View>
                     </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.submitBtn}
                    onPress={() => {
                      handleCopy(selectedVoucher.code);
                      setModalVisible(false);
                      router.push('/(tabs)/products' as any);
                    }}
                  >
                    <LinearGradient
                      colors={['#818CF8', '#6366F1']}
                      style={styles.submitBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.submitBtnText}>Sao chép & Sử dụng ngay</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={{ height: 16 }} />
                </ScrollView>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <BottomNav activeTab="profile" />
    </View>
  );
}
