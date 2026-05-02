import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, RefreshControl, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ApiGetMyRentals, ApiCancelRental, ApiConfirmReceived, ApiRepaySingleRental } from '../../../src/features/rental/rentalApi';

const STATUS_TABS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đang giao', value: 'DELIVERING' },
  { label: 'Chờ nhận', value: 'DELIVERED' },
  { label: 'Đang thuê', value: 'RENTING' },
  { label: 'Hoàn tất', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

export default function RentalManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rentals, setRentals] = useState<any[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRentals = async () => {
    setIsLoading(true);
    const res = await ApiGetMyRentals();
    if (res && res.rentals && Array.isArray(res.rentals)) {
      setRentals(res.rentals);
      filterList(res.rentals, activeTab, searchQuery);
    } else if (res && Array.isArray(res)) {
      // Fallback in case raw array is returned
      setRentals(res);
      filterList(res, activeTab, searchQuery);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const filterList = (list: any[], tab: string, query: string) => {
    let filtered = list;
    if (tab !== 'ALL') {
      filtered = filtered.filter(r => r.status === tab);
    }
    if (query) {
      filtered = filtered.filter(r => 
        r._id.toLowerCase().includes(query.toLowerCase()) || 
        (r.items?.[0]?.deviceId?.name || '').toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredRentals(filtered);
  };

  const calculateDuration = (item: any) => {
    const start = item.rentalStartDate || item.rentStartDate || item.items?.[0]?.rentalStartDate;
    const end = item.rentalEndDate || item.rentEndDate || item.items?.[0]?.rentalEndDate;
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diff = e.getTime() - s.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleExtend = (id: string) => {
    Alert.alert("Gia hạn", "Tính năng gia hạn đơn thuê yêu cầu tính toán phụ phí. Để đảm bảo chính xác, vui lòng thực hiện trên trang Web hoặc liên hệ Hotline.");
  };

  const handleReport = (id: string) => {
    Alert.alert("Báo cáo sự cố", "Bạn muốn báo cáo sự cố cho thiết bị nào?", [
      { text: "Hủy", style: "cancel" },
      { text: "Báo cáo ngay", onPress: () => Alert.alert("Thông báo", "Vui lòng chụp ảnh sự cố và gửi qua trang web để chúng tôi xác nhận nhanh nhất.") }
    ]);
  };

  useEffect(() => {
    filterList(rentals, activeTab, searchQuery);
  }, [activeTab, rentals, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRentals();
    setRefreshing(false);
  };

  const handleCancel = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn thuê này?', [
      { text: 'Quay lại', style: 'cancel' },
      { text: 'Hủy đơn', style: 'destructive', onPress: async () => {
        const res = await ApiCancelRental(id);
        if (res.success || res.errorCode === 0) {
          Alert.alert('Thành công', 'Đã hủy đơn thuê');
          fetchRentals();
        } else {
          Alert.alert('Lỗi', res.message || 'Không thể hủy đơn');
        }
      }}
    ]);
  };

  const handleConfirmReceived = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn đã nhận được thiết bị và kiểm tra kỹ?', [
      { text: 'Chưa', style: 'cancel' },
      { text: 'Đã nhận', onPress: async () => {
        const res = await ApiConfirmReceived(id);
        if (res.success || res.errorCode === 0) {
          Alert.alert('Thành công', 'Đã xác nhận nhận thiết bị');
          fetchRentals();
        } else {
          Alert.alert('Lỗi', res.message || 'Thao tác thất bại');
        }
      }}
    ]);
  };

   const handlePay = async (id: string) => {
    try {
      const res = await ApiRepaySingleRental(id);
      if (res && res.success && res.paymentLink) {
        const WebBrowser = require('expo-web-browser');
        await WebBrowser.openBrowserAsync(res.paymentLink);
        fetchRentals();
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể tạo link thanh toán');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tạo link thanh toán');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: '#F59E0B', label: 'Chờ xác nhận' };
      case 'APPROVED': return { color: '#6366F1', label: 'Đã duyệt' };
      case 'DELIVERING': return { color: '#3B82F6', label: 'Đang giao' };
      case 'DELIVERED': return { color: '#6366F1', label: 'Chờ nhận hàng' };
      case 'RENTING': return { color: '#10B981', label: 'Đang thuê' };
      case 'COMPLETED': return { color: '#94A3B8', label: 'Hoàn tất' };
      case 'RETURNING': return { color: '#F59E0B', label: 'Đang thu hồi' };
      case 'CANCELLED': return { color: '#EF4444', label: 'Đã hủy' };
      case 'REJECTED': return { color: '#EF4444', label: 'Đã từ chối' };
      default: return { color: '#FFF', label: status };
    }
  };

  const renderRentalItem = ({ item }: { item: any }) => {
    const status = getStatusStyle(item.status);
    const firstItem = item.items?.[0]?.deviceId || {};

    return (
      <TouchableOpacity 
        style={styles.rentalCard} 
        activeOpacity={0.8}
        onPress={() => router.push(`/(tabs)/rental/${item._id}` as any)}
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item._id?.slice(-8).toUpperCase()}</Text>
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>
        <View style={styles.supplierHeader}>
          <View style={styles.supplierInfo}>
            <View style={styles.supplierAvatar}>
              <Ionicons name="business" size={16} color="#94A3B8" />
            </View>
            <Text style={styles.supplierName}>
              {firstItem.deviceId?.supplierId?.businessName || item.supplierId?.fullName || 'Nhà cung cấp'}
            </Text>
          </View>
          <View style={styles.addressBox}>
            <Ionicons name="location-outline" size={12} color="#94A3B8" />
            <Text style={styles.addressText} numberOfLines={1}>{item.deliveryAddress?.city || 'Toàn quốc'}</Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {item.items?.map((rentalItem: any, idx: number) => {
            const device = rentalItem.deviceId || {};
            const snapshot = rentalItem.deviceSnapshot || {};
            const name = device.name || snapshot.name || 'Thiết bị';
            const imageUrl = device.images?.[0] || snapshot.images?.[0] || 'https://via.placeholder.com/100';
            
            return (
              <View key={idx} style={styles.itemRow}>
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                <View style={styles.itemMainInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemDuration}>{rentalItem.totalDays || calculateDuration(rentalItem)} ngày</Text>
                    <View style={styles.metaDivider} />
                    <Text style={styles.itemQuantity}>x{rentalItem.quantity || 1}</Text>
                  </View>
                </View>
                <View style={styles.itemPriceBox}>
                   <Text style={styles.itemPrice}>{(rentalItem.rentPrice || 0).toLocaleString()}đ</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryRow}>
           <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Thời gian thuê:</Text>
              <Text style={styles.dateValue}>
                {formatDate(item.rentalStartDate || item.rentStartDate || item.items?.[0]?.rentalStartDate)} — {formatDate(item.rentalEndDate || item.rentEndDate || item.items?.[0]?.rentalEndDate)}
              </Text>
           </View>
           <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalValue}>{(item.totalAmount || 0).toLocaleString()}đ</Text>
              <Text style={{ color: '#64748B', fontSize: 10 }}>({calculateDuration(item)} ngày)</Text>
           </View>
        </View>

        <View style={styles.cardFooter}>
          {item.status === 'PENDING' && (
            <>
              {(item.paymentStatus === 'UNPAID' || !item.paymentStatus) && (
                <TouchableOpacity style={[styles.btn, styles.payBtn]} onPress={() => handlePay(item._id)}>
                  <Ionicons name="card-outline" size={16} color="#22D3EE" style={{ marginRight: 4 }} />
                  <Text style={[styles.btnText, { color: '#22D3EE' }]}>Thanh toán</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => handleCancel(item._id)}>
                <Text style={styles.btnText}>Hủy đơn</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === 'APPROVED' && (
            <TouchableOpacity style={[styles.btn, styles.detailBtn]} onPress={() => router.push(`/(tabs)/rental/${item._id}` as any)}>
              <Text style={styles.btnText}>Chờ staff nhận</Text>
            </TouchableOpacity>
          )}

          {(item.status === 'DELIVERING' || item.status === 'DELIVERED') && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {item.status === 'DELIVERED' && (
                <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={() => handleConfirmReceived(item._id)}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={[styles.btnText, { color: '#10B981' }]}>Đã nhận hàng</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.btn, styles.reportBtn]} onPress={() => Alert.alert("Báo cáo", "Tính năng đang được phát triển")}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={[styles.btnText, { color: '#EF4444' }]}>Báo cáo deli</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === 'RENTING' && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.btn, styles.extendBtn]} onPress={() => handleExtend(item._id)}>
                <Ionicons name="time-outline" size={16} color="#6366F1" style={{ marginRight: 4 }} />
                <Text style={[styles.btnText, { color: '#6366F1' }]}>Gia hạn</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.reportBtn]} onPress={() => handleReport(item._id)}>
                <Ionicons name="construct-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={[styles.btnText, { color: '#EF4444' }]}>Báo cáo sự cố</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === 'COMPLETED' && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!item.isReviewed && (
                <TouchableOpacity style={[styles.btn, styles.reviewBtn]} onPress={() => router.push(`/(tabs)/rental/${item._id}` as any)}>
                  <Ionicons name="star-outline" size={16} color="#FBBF24" style={{ marginRight: 4 }} />
                  <Text style={[styles.btnText, { color: '#FBBF24' }]}>Đánh giá</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.btn, styles.reRentBtn]} onPress={() => Alert.alert("Thông báo", "Vui lòng chọn lại thiết bị từ trang chủ để thuê tiếp")}>
                <Ionicons name="refresh-outline" size={16} color="#94A3B8" style={{ marginRight: 4 }} />
                <Text style={[styles.btnText, { color: '#94A3B8' }]}>Thuê lại</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={[styles.btn, styles.detailBtn]} onPress={() => router.push(`/(tabs)/rental/${item._id}` as any)}>
            <Text style={styles.btnText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý đơn thuê</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Tìm theo mã đơn hoặc tên thiết bị..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={item => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.tab, activeTab === item.value && styles.activeTab]} 
              onPress={() => setActiveTab(item.value)}
            >
              <Text style={[styles.tabText, activeTab === item.value && styles.activeTabText]}>{item.label}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22D3EE" />
        </View>
      ) : (
        <FlatList
          data={filteredRentals}
          keyExtractor={item => item._id}
          renderItem={renderRentalItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22D3EE" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#334155" />
              <Text style={styles.emptyText}>Không có đơn thuê nào trong mục này</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  tabsContainer: { height: 50, marginBottom: 10 },
  tab: { paddingHorizontal: 20, height: '100%', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#22D3EE' },
  tabText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  activeTabText: { color: '#22D3EE', fontWeight: 'bold' },
  listContent: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#64748B', marginTop: 16, fontSize: 14 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 15 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14 },

  rentalCard: { borderRadius: 24, marginBottom: 20, overflow: 'hidden', backgroundColor: 'rgba(30, 41, 59, 1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)' },
  orderId: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  statusLabel: { fontSize: 12, fontWeight: '800' },
  
  supplierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  supplierInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  supplierAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  supplierName: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  addressBox: { flexDirection: 'row', alignItems: 'center' },
  addressText: { color: '#94A3B8', fontSize: 12, marginLeft: 4, maxWidth: 100 },
  
  itemsList: { padding: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 16 },
  itemImage: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#1E293B' },
  itemMainInfo: { flex: 1, marginLeft: 12 },
  itemName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemDuration: { color: '#94A3B8', fontSize: 12 },
  itemQuantity: { color: '#22D3EE', fontSize: 12, fontWeight: '700' },
  metaDivider: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },
  itemPriceBox: { alignItems: 'flex-end' },
  itemPrice: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 16 },
  dateBox: { flex: 1 },
  dateLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  dateValue: { color: '#CBD5E1', fontSize: 12 },
  totalBox: { alignItems: 'flex-end' },
  totalLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  totalValue: { color: '#22D3EE', fontSize: 18, fontWeight: '900' },
  
  cardFooter: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', justifyContent: 'flex-end' },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  
  payBtn: { backgroundColor: 'rgba(34, 211, 238, 0.1)', borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.3)' },
  cancelBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  confirmBtn: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  detailBtn: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  reviewBtn: { backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' },
  reportBtn: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.1)' },
  extendBtn: { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  reRentBtn: { backgroundColor: 'rgba(148, 163, 184, 0.05)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.1)' },
});
