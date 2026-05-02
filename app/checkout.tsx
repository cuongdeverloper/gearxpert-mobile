import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert, Modal, Dimensions, SafeAreaView, Platform, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { ApiGetCart } from '../src/features/rental/cartApi';
import { ApiCheckout, ApiPreviewContractWithData } from '../src/features/rental/rentalApi';
import { ApiGetMyWallet } from '../src/features/wallet/api';
import { ApiAutoApplyBestVoucher, ApiGetAvailableVouchersForCart, ApiValidateVoucher } from '../src/features/voucher/api';
import { useAuth } from '../src/context/AuthContext';
import { getToken } from '../src/shared/utils/storage';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

const FPT_COORDS = { latitude: 16.0445, longitude: 108.2475 };
const MIN_DELIVERY_FEE = 10000;
const FEE_PER_KM = 5000;

const CheckoutScreen = () => {
  const router = useRouter();
  const { cartType = 'NORMAL' } = useLocalSearchParams<{ cartType: string }>();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  
  // Step 2 Info
  const [address, setAddress] = useState({
    receiverName: user?.fullName || user?.username || '',
    street: '',
    district: '',
    city: 'Đà Nẵng',
    fullAddress: '',
  });
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  
  // Map
  const [mapPosition, setMapPosition] = useState(FPT_COORDS);
  const [distance, setDistance] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showMap, setShowMap] = useState(false);

  // Vouchers
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  // Step 3 Payment
  const [selectedPayment, setSelectedPayment] = useState('BANK');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prevPath) => `${prevPath} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        setPaths((prevPaths) => [...prevPaths, currentPath]);
        setCurrentPath('');
      },
    })
  ).current;

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath('');
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [cartRes, walletRes] = await Promise.all([
          ApiGetCart(cartType),
          ApiGetMyWallet(),
        ]);
        setCart(cartRes.items || []);
        setWallet(walletRes);
        
        // Auto apply voucher
        const vRes = await ApiAutoApplyBestVoucher(cartType);
        if (vRes?.voucher) {
          setAppliedVoucher({
            code: vRes.voucher.code,
            discount: vRes.voucher.discount,
          });
        }
      } catch (err) {
        console.error('Init checkout error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [cartType]);

  const groupedBySupplier = useMemo(() => {
    const groups: any = {};
    cart.forEach((item) => {
      const supplierId = item.deviceId?.supplierId?._id || "unknown";
      const supplierName = item.deviceId?.supplierId?.businessName || item.deviceId?.supplierId?.fullName || "Unknown Supplier";

      if (!groups[supplierId]) {
        groups[supplierId] = { supplierId, supplierName, items: [], subtotal: 0 };
      }
      groups[supplierId].items.push(item);
      const price = item.deviceId?.discountPrice || item.deviceId?.rentPrice?.perDay || 0;
      groups[supplierId].subtotal += price * item.totalDays * item.quantity;
    });
    return Object.values(groups);
  }, [cart]);

  const totals = useMemo(() => {
    const subtotal = groupedBySupplier.reduce((sum: number, g: any) => sum + g.subtotal, 0);
    const totalDeposit = cart.reduce((sum: number, item: any) => sum + ((item.deviceId?.depositAmount || 0) * item.quantity), 0);
    const discount = appliedVoucher?.discount || 0;
    const total = subtotal + totalDeposit + deliveryFee - discount;
    return { subtotal, totalDeposit, discount, total };
  }, [groupedBySupplier, cart, deliveryFee, appliedVoucher]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMapPosition({ latitude, longitude });
    const dist = calculateDistance(FPT_COORDS.latitude, FPT_COORDS.longitude, latitude, longitude);
    const fee = Math.max(MIN_DELIVERY_FEE, Math.round(dist * FEE_PER_KM));
    setDistance(dist);
    setDeliveryFee(fee);

    // Reverse geocode
    try {
      const addrRes = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addrRes.length > 0) {
        const first = addrRes[0];
        setAddress(prev => ({
          ...prev,
          street: first.name || first.street || '',
          district: first.district || first.subregion || '',
          city: first.city || first.region || 'Đà Nẵng',
          fullAddress: `${first.name || ''}, ${first.district || ''}, ${first.city || ''}`
        }));
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    setIsApplyingVoucher(true);
    try {
      const res = await ApiValidateVoucher({ code: voucherCode, cartType });
      if (res.errorCode === 0 || !res.errorCode) {
        setAppliedVoucher({ code: voucherCode, discount: res.discount });
        Alert.alert('Thành công', `Đã áp dụng voucher: -${res.discount.toLocaleString()}đ`);
      } else {
        Alert.alert('Lỗi', res.message || 'Voucher không hợp lệ');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể áp dụng voucher');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      if (!address.street || !phoneNumber) {
        Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin giao hàng');
        return;
      }
      if (deliveryFee === 0) {
        Alert.alert('Thông báo', 'Vui lòng chọn vị trí trên bản đồ để tính phí giao hàng');
        return;
      }
    }
    if (currentStep === 3) {
      if (!agreeTerms) {
        Alert.alert('Thông báo', 'Vui lòng đồng ý với điều khoản dịch vụ');
        return;
      }
      // Note: Signature validation skipped for now as we don't have the canvas yet
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const checkoutData = {
        customerId: user?.id,
        cartType,
        items: cart.map(item => ({
          deviceId: item.deviceId._id,
          deviceName: item.deviceId.name,
          quantity: item.quantity,
          rentPrice: item.deviceId.discountPrice || item.deviceId.rentPrice?.perDay || 0,
          totalDays: item.totalDays,
          rentalStartDate: item.rentalStartDate,
          rentalEndDate: item.rentalEndDate,
        })),
        deliveryAddress: { ...address, fullAddress: address.fullAddress || `${address.street}, ${address.district}, ${address.city}` },
        phoneNumber,
        customerSignature: signatureDataUrl || 'MOBILESIGNATURE', // Placeholder for now
        subtotal: totals.subtotal,
        totalDeposit: totals.totalDeposit,
        shippingFee: deliveryFee,
        total: totals.total,
        customerName: address.receiverName,
        customerEmail: user?.email,
        customerCCCD: user?.cccd,
        notes,
        voucherCode: appliedVoucher?.code,
        paymentMethod: selectedPayment,
      };

      const res = await ApiCheckout(checkoutData);
      if (res.errorCode === 0 || res.paymentLink || res.rentalIds) {
        if (res.paymentLink?.checkoutUrl) {
          await WebBrowser.openBrowserAsync(res.paymentLink.checkoutUrl);
        }
        setCurrentStep(4);
      } else {
        Alert.alert('Lỗi', res.message || 'Thanh toán thất bại');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra trong quá trình thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Kiểm tra đơn hàng</Text>
      {groupedBySupplier.map((group: any) => (
        <View key={group.supplierId} style={styles.reviewCard}>
          <Text style={styles.supplierNameReview}>{group.supplierName}</Text>
          {group.items.map((item: any) => (
            <View key={item._id} style={styles.reviewItem}>
              <Text style={styles.reviewItemName}>{item.deviceId.name}</Text>
              <Text style={styles.reviewItemDetail}>x{item.quantity} • {item.totalDays} ngày</Text>
            </View>
          ))}
        </View>
      ))}
      
      <View style={styles.voucherSection}>
        <TextInput 
          style={styles.voucherInput} 
          placeholder="Nhập mã giảm giá" 
          placeholderTextColor="#64748B"
          value={voucherCode}
          onChangeText={setVoucherCode}
        />
        <TouchableOpacity style={styles.voucherBtn} onPress={handleApplyVoucher} disabled={isApplyingVoucher}>
          {isApplyingVoucher ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.voucherBtnText}>Áp dụng</Text>}
        </TouchableOpacity>
      </View>
      {appliedVoucher && (
        <View style={styles.appliedVoucher}>
          <Text style={styles.appliedText}>Đã áp dụng: {appliedVoucher.code}</Text>
          <Text style={styles.appliedDiscount}>-{appliedVoucher.discount.toLocaleString()}đ</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Người nhận</Text>
        <TextInput style={styles.input} value={address.receiverName} onChangeText={t => setAddress({...address, receiverName: t})} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Số điện thoại</Text>
        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Địa chỉ (Số nhà, tên đường)</Text>
        <TextInput style={styles.input} value={address.street} onChangeText={t => setAddress({...address, street: t})} />
      </View>
      
      <TouchableOpacity style={styles.mapBtn} onPress={() => setShowMap(true)}>
        <Ionicons name="map-outline" size={20} color="#6366F1" />
        <Text style={styles.mapBtnText}>{distance > 0 ? `Đã chọn: ${distance.toFixed(1)}km` : 'Chọn vị trí trên bản đồ'}</Text>
      </TouchableOpacity>

      {deliveryFee > 0 && (
        <View style={styles.feeInfo}>
          <Text style={styles.feeText}>Phí vận chuyển dự kiến:</Text>
          <Text style={styles.feeValue}>{deliveryFee.toLocaleString()}đ</Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ghi chú cho shipper</Text>
        <TextInput style={[styles.input, { height: 80 }]} multiline value={notes} onChangeText={setNotes} placeholder="VD: Gửi ở bảo vệ..." />
      </View>

      <Modal visible={showMap} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Chọn địa chỉ nhận hàng</Text>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Xong</Text>
            </TouchableOpacity>
          </View>
          <MapView 
            style={{ flex: 1 }} 
            initialRegion={{ ...mapPosition, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            onPress={handleMapPress}
          >
            <Marker coordinate={mapPosition} pinColor="#6366F1" />
            <Marker coordinate={FPT_COORDS} title="Kho GearXpert" pinColor="#10B981" />
          </MapView>
          <View style={styles.mapFooter}>
            <Text style={styles.mapAddressText} numberOfLines={2}>{address.fullAddress || 'Nhấn vào bản đồ để chọn vị trí'}</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
      <TouchableOpacity 
        style={[styles.paymentCard, selectedPayment === 'BANK' && styles.selectedPayment]} 
        onPress={() => setSelectedPayment('BANK')}
      >
        <Ionicons name="card-outline" size={24} color={selectedPayment === 'BANK' ? '#FFF' : '#64748B'} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.paymentName, selectedPayment === 'BANK' && { color: '#FFF' }]}>Ngân hàng (VietQR / PayOS)</Text>
          <Text style={styles.paymentDesc}>Tự động xác nhận sau khi chuyển khoản</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.paymentCard, selectedPayment === 'WALLET' && styles.selectedPayment]} 
        onPress={() => setSelectedPayment('WALLET')}
      >
        <Ionicons name="wallet-outline" size={24} color={selectedPayment === 'WALLET' ? '#FFF' : '#64748B'} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.paymentName, selectedPayment === 'WALLET' && { color: '#FFF' }]}>Ví GearXpert</Text>
          <Text style={styles.paymentDesc}>Số dư: {wallet?.balance?.toLocaleString() || 0}đ</Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Ký hợp đồng điện tử</Text>
      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox} {...panResponder.panHandlers}>
          <Svg style={StyleSheet.absoluteFill}>
            {paths.map((path, index) => (
              <Path key={index} d={path} stroke="white" strokeWidth={3} fill="none" />
            ))}
            {currentPath ? (
              <Path d={currentPath} stroke="white" strokeWidth={3} fill="none" />
            ) : null}
          </Svg>
          {paths.length === 0 && !currentPath && (
             <Text style={{ color: '#475569', position: 'absolute' }}>Vui lòng ký vào đây</Text>
          )}
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={clearSignature}>
          <Text style={styles.clearBtnText}>Xóa chữ ký</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.termsRow}>
        <TouchableOpacity onPress={() => setAgreeTerms(!agreeTerms)}>
          <Ionicons name={agreeTerms ? "checkbox" : "square-outline"} size={24} color={agreeTerms ? "#6366F1" : "#64748B"} />
        </TouchableOpacity>
        <Text style={styles.termsText}>Tôi đồng ý với điều khoản thuê và cam kết bảo quản thiết bị.</Text>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <View style={[styles.stepContainer, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
      <Ionicons name="checkmark-circle" size={100} color="#10B981" />
      <Text style={styles.successTitle}>Đặt thuê thành công!</Text>
      <Text style={styles.successSub}>Đơn hàng của bạn đang được xử lý.</Text>
      <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.homeBtnText}>Về trang chủ</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        {[1, 2, 3, 4].map(s => (
          <View key={s} style={[styles.progressStep, s <= currentStep && styles.progressStepActive]} />
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </View>

      {currentStep < 4 && (
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Tổng thanh toán</Text>
              <Text style={styles.summaryTotal}>{totals.total.toLocaleString()}đ</Text>
            </View>
            <TouchableOpacity 
              style={styles.nextBtn} 
              onPress={currentStep === 3 ? handleCheckout : handleNext}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={styles.nextBtnText}>{currentStep === 3 ? 'Xác nhận' : 'Tiếp theo'}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  progressBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressStepActive: { backgroundColor: '#6366F1' },
  stepContainer: { flex: 1, padding: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  supplierNameReview: { color: '#6366F1', fontWeight: 'bold', marginBottom: 8 },
  reviewItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewItemName: { color: '#E2E8F0', flex: 1 },
  reviewItemDetail: { color: '#94A3B8', fontSize: 12 },
  voucherSection: { flexDirection: 'row', gap: 10, marginTop: 10 },
  voucherInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, color: '#FFF', height: 48 },
  voucherBtn: { backgroundColor: '#334155', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  voucherBtnText: { color: '#FFF', fontWeight: 'bold' },
  appliedVoucher: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12 },
  appliedText: { color: '#10B981' },
  appliedDiscount: { color: '#10B981', fontWeight: 'bold' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#94A3B8', fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, color: '#FFF', height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: 16, borderRadius: 12, marginBottom: 20 },
  mapBtnText: { color: '#6366F1', fontWeight: 'bold' },
  feeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  feeText: { color: '#94A3B8' },
  feeValue: { color: '#FFF', fontWeight: 'bold' },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1E293B' },
  mapTitle: { color: '#FFF', fontWeight: 'bold' },
  mapFooter: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#1E293B', padding: 16, borderRadius: 16 },
  mapAddressText: { color: '#FFF', fontSize: 13 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  selectedPayment: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  paymentName: { color: '#E2E8F0', fontWeight: 'bold' },
  paymentDesc: { color: '#64748B', fontSize: 11 },
  signatureContainer: { marginBottom: 20 },
  signatureBox: { height: 200, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  clearBtn: { alignSelf: 'flex-end', marginTop: 8 },
  clearBtnText: { color: '#EF4444', fontSize: 13, fontWeight: 'bold' },
  termsRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  termsText: { color: '#94A3B8', fontSize: 12, flex: 1 },
  footer: { padding: 20, backgroundColor: '#1E293B', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#94A3B8', fontSize: 12 },
  summaryTotal: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  nextBtn: { backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  nextBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  successSub: { color: '#94A3B8', marginTop: 8, marginBottom: 40 },
  homeBtn: { backgroundColor: '#6366F1', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  homeBtnText: { color: '#FFF', fontWeight: 'bold' },
});

export default CheckoutScreen;
