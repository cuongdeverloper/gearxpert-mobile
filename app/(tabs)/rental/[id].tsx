import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiGetRentalById, ApiCancelRental, ApiConfirmReceived } from '../../../src/features/rental/rentalApi';

export default function RentalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    const res = await ApiGetRentalById(id as string);
    if (res && res.success && res.rental) {
      setOrder(res.rental);
    } else if (res && !res.errorCode && res._id) {
      setOrder(res);
    } else {
      Alert.alert('Lỗi', res.message || 'Không tìm thấy thông tin đơn thuê');
    }
    setLoading(false);
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

  const handleCancel = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn thuê này?', [
      { text: 'Quay lại', style: 'cancel' },
      { text: 'Hủy đơn', style: 'destructive', onPress: async () => {
        const res = await ApiCancelRental(id);
        if (res.success || res.errorCode === 0) {
          Alert.alert('Thành công', 'Đã hủy đơn thuê');
          fetchDetail();
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
          fetchDetail();
        } else {
          Alert.alert('Lỗi', res.message || 'Thao tác thất bại');
        }
      }}
    ]);
  };

  const handlePay = async (id: string) => {
    try {
      const { ApiRepaySingleRental } = require('../../../src/features/rental/rentalApi');
      const res = await ApiRepaySingleRental(id);
      if (res && res.success && res.paymentLink) {
        const WebBrowser = require('expo-web-browser');
        await WebBrowser.openBrowserAsync(res.paymentLink);
        fetchDetail();
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể tạo link thanh toán');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể khởi tạo thanh toán');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'APPROVED': return 'Đã duyệt';
      case 'DELIVERING': return 'Đang giao';
      case 'DELIVERED': return 'Chờ nhận hàng';
      case 'RENTING': return 'Đang thuê';
      case 'COMPLETED': return 'Hoàn tất';
      case 'RETURNING': return 'Đang thu hồi';
      case 'CANCELLED': return 'Đã hủy';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#22D3EE" /></View>;
  if (!order) return <View style={styles.center}><Text style={{ color: '#FFF' }}>Không tìm thấy dữ liệu</Text></View>;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/rental' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn thuê</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.statusTitle}>Trạng thái đơn hàng</Text>
              <Text style={styles.statusValue}>{getStatusLabel(order.status)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.contractBtn} 
              onPress={() => {
                const url = `https://gearxpert.id.vn/contract/preview/${order._id}`;
                const WebBrowser = require('expo-web-browser');
                WebBrowser.openBrowserAsync(url);
              }}
            >
              <Ionicons name="document-text-outline" size={24} color="#22D3EE" />
              <Text style={{ color: '#22D3EE', fontSize: 12 }}>Hợp đồng</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.orderDate}>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</Text>
          <View style={styles.dateRangeBox}>
             <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
             <Text style={styles.dateRangeText}>
               {formatDate(order.rentalStartDate || order.rentStartDate || order.items?.[0]?.rentalStartDate)} — {formatDate(order.rentalEndDate || order.rentEndDate || order.items?.[0]?.rentalEndDate)}
               {` (${calculateDuration(order)} ngày)`}
             </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm thuê</Text>
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemCard}>
              <Image source={{ uri: item.deviceId?.images?.[0] }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.deviceId?.name || 'Thiết bị'}</Text>
                <Text style={styles.itemMeta}>Số lượng: {item.quantity} | Số ngày: {item.totalDays || calculateDuration(item)}</Text>
                <Text style={styles.itemPrice}>{(item.rentPrice || 0).toLocaleString()}đ / ngày</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Tạm tính:</Text><Text style={styles.infoValue}>{(order.rentPriceTotal || 0).toLocaleString()}đ</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Tiền cọc:</Text><Text style={styles.infoValue}>{(order.depositAmount || 0).toLocaleString()}đ</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Phí ship:</Text><Text style={styles.infoValue}>{(order.deliveryFee || 0).toLocaleString()}đ</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Giảm giá:</Text><Text style={styles.infoValue}>-{(order.voucherDiscount || 0).toLocaleString()}đ</Text></View>
          <View style={styles.divider} />
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Tổng cộng:</Text><Text style={styles.totalValue}>{(order.totalAmount || 0).toLocaleString()}đ</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
          <Text style={styles.addressText}>{order.deliveryAddress?.fullAddress || 'N/A'}</Text>
          <Text style={styles.addressText}>Người nhận: {order.deliveryAddress?.receiverName}</Text>
          <Text style={styles.addressText}>SĐT: {order.phoneNumber}</Text>
        </View>

        {order.status === 'PENDING' && (
          <View style={{ gap: 12 }}>
            <TouchableOpacity style={[styles.actionBtn, styles.payBtn]} onPress={() => handlePay(order._id)}>
              <Text style={[styles.actionBtnText, { color: '#22D3EE' }]}>Thanh toán ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => handleCancel(order._id)}>
              <Text style={styles.actionBtnText}>Hủy đơn thuê</Text>
            </TouchableOpacity>
          </View>
        )}
        {order.status === 'DELIVERING' && (
          <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={() => handleConfirmReceived(order._id)}>
            <Text style={styles.actionBtnText}>Xác nhận đã nhận hàng</Text>
          </TouchableOpacity>
        )}

        {order.status === 'COMPLETED' && !order.isReviewed && (
          <TouchableOpacity style={[styles.actionBtn, styles.reviewBtn]} onPress={() => Alert.alert("Đánh giá", "Vui lòng sử dụng bản web để gửi đánh giá chi tiết.")}>
            <Ionicons name="star" size={18} color="#FBBF24" style={{ marginRight: 8 }} />
            <Text style={[styles.actionBtnText, { color: '#FBBF24' }]}>Gửi đánh giá</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  statusCard: { backgroundColor: 'rgba(34, 211, 238, 0.1)', padding: 20, borderRadius: 20, marginBottom: 20 },
  statusTitle: { color: '#94A3B8', fontSize: 13, marginBottom: 4 },
  statusValue: { color: '#22D3EE', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  orderDate: { color: '#64748B', fontSize: 12 },
  section: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  itemCard: { flexDirection: 'row', marginBottom: 16 },
  itemImage: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#1E293B' },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemMeta: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  itemPrice: { color: '#22D3EE', fontSize: 14, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { color: '#94A3B8', fontSize: 14 },
  infoValue: { color: '#FFF', fontSize: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },
  totalValue: { color: '#22D3EE', fontSize: 18, fontWeight: 'bold' },
  addressText: { color: '#FFF', fontSize: 14, marginBottom: 4 },
  actionBtn: { height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  cancelBtn: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: '#EF4444' },
  confirmBtn: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 1, borderColor: '#10B981' },
  payBtn: { backgroundColor: 'rgba(34, 211, 238, 0.2)', borderWidth: 1, borderColor: '#22D3EE' },
  reviewBtn: { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderWidth: 1, borderColor: '#FBBF24', flexDirection: 'row' },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  contractBtn: { alignItems: 'center' },
  dateRangeBox: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 10 },
  dateRangeText: { color: '#F8FAFC', fontSize: 13, marginLeft: 8 },
});
