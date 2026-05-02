import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiGetCart, ApiRemoveCartItem, ApiUpdateCartItem } from '../src/features/rental/cartApi';

const CartScreen = () => {
  const router = useRouter();
  const { type = 'NORMAL' } = useLocalSearchParams<{ type: string }>();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await ApiGetCart(type);
      setCart(res.items || []);
    } catch (err) {
      console.error('Fetch cart error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [type]);

  const handleRemove = async (itemId: string) => {
    Alert.alert('Xác nhận', 'Bạn có muốn xóa sản phẩm này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const res = await ApiRemoveCartItem(itemId);
          if (res.errorCode === 0 || !res.errorCode) {
            setCart(prev => prev.filter(item => item._id !== itemId));
          } else {
            Alert.alert('Lỗi', res.message || 'Không thể xóa sản phẩm');
          }
        },
      },
    ]);
  };

  const groupedBySupplier = useMemo(() => {
    const groups: any = {};
    cart.forEach((item) => {
      const supplierId = item.deviceId?.supplierId?._id || "unknown";
      const supplierName = item.deviceId?.supplierId?.businessName || item.deviceId?.supplierId?.fullName || "Unknown Supplier";

      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplierId,
          supplierName,
          items: [],
          subtotal: 0,
        };
      }

      groups[supplierId].items.push(item);
      const now = new Date();
      const discountExpiry = item.deviceId?.discountExpiry ? new Date(item.deviceId.discountExpiry) : null;
      const isDiscountValid = item.deviceId?.discountPrice && discountExpiry && discountExpiry > now;
      const effectivePrice = isDiscountValid ? item.deviceId.discountPrice : (item.deviceId?.rentPrice?.perDay || 0);
      
      groups[supplierId].subtotal += effectivePrice * item.totalDays * item.quantity;
    });

    return Object.values(groups);
  }, [cart]);

  const subtotal = useMemo(() => {
    return groupedBySupplier.reduce((sum: number, group: any) => sum + group.subtotal, 0);
  }, [groupedBySupplier]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={80} color="#334155" />
            <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/home')}>
              <Text style={styles.shopBtnText}>Tiếp tục mua sắm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedBySupplier.map((group: any, idx: number) => (
            <View key={group.supplierId} style={styles.supplierSection}>
              <View style={styles.supplierHeader}>
                <Ionicons name="storefront-outline" size={20} color="#6366F1" />
                <Text style={styles.supplierName}>{group.supplierName}</Text>
              </View>
              {group.items.map((item: any) => {
                const now = new Date();
                const discountExpiry = item.deviceId?.discountExpiry ? new Date(item.deviceId.discountExpiry) : null;
                const isDiscountValid = item.deviceId?.discountPrice && discountExpiry && discountExpiry > now;
                const price = isDiscountValid ? item.deviceId.discountPrice : item.deviceId?.rentPrice?.perDay;

                return (
                  <View key={item._id} style={styles.itemCard}>
                    <Image source={{ uri: item.deviceId?.images?.[0] }} style={styles.itemImage} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.deviceId?.name}</Text>
                      <Text style={styles.itemPrice}>{price?.toLocaleString()}đ/ngày</Text>
                      <View style={styles.itemMeta}>
                        <Text style={styles.itemDetail}>{item.totalDays} ngày x {item.quantity}</Text>
                        <TouchableOpacity onPress={() => handleRemove(item._id)}>
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tạm tính:</Text>
            <Text style={styles.totalValue}>{subtotal.toLocaleString()}đ</Text>
          </View>
          <TouchableOpacity 
            style={styles.checkoutBtn}
            onPress={() => router.push({ pathname: '/checkout', params: { cartType: type } })}
          >
            <Text style={styles.checkoutBtnText}>Thanh toán ngay</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  emptyCart: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 20, marginBottom: 30 },
  shopBtn: { backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: '#FFF', fontWeight: 'bold' },
  supplierSection: { marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  supplierHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12 },
  supplierName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  itemCard: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  itemImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#1E293B' },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemName: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  itemPrice: { color: '#6366F1', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  itemMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDetail: { color: '#94A3B8', fontSize: 12 },
  footer: { padding: 20, backgroundColor: '#1E293B', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { color: '#94A3B8', fontSize: 16 },
  totalValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#6366F1', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  checkoutBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
});

export default CartScreen;
