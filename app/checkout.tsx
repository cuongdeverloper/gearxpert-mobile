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
import { useSocket } from '../src/context/SocketContext';
import { getToken } from '../src/shared/utils/storage';
import * as WebBrowser from 'expo-web-browser';
import { ApiGetRentalById } from '../src/features/rental/rentalApi';

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

  // Payment tracking
  const { socket } = useSocket();
  const [isWaitingPayment, setIsWaitingPayment] = useState(false);
  const [tempRentalIds, setTempRentalIds] = useState<string[]>([]);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const pollingInterval = useRef<any>(null);

  // States
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const [useSavedSignature, setUseSavedSignature] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');

  // Step 2 Info
  const [address, setAddress] = useState({
    receiverName: user?.fullName || '',
    street: '',
    district: '',
    city: 'Đà Nẵng',
    fullAddress: ''
  });
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Map
  const [mapPosition, setMapPosition] = useState(FPT_COORDS);
  const [distance, setDistance] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  // Step 3 Payment
  const [selectedPayment, setSelectedPayment] = useState('BANK');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Listen for socket notifications (Payment success)
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: any) => {
      console.log("[CHECKOUT] Received notification:", notif);
      if (notif.type === 'PAYMENT' && isWaitingPayment) {
        checkAllRentalsStatus();
      }
    };

    socket.on('newNotification', handleNewNotification);
    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket, isWaitingPayment, tempRentalIds]);

  const checkAllRentalsStatus = async () => {
    if (tempRentalIds.length === 0) return;

    try {
      let allPaid = true;
      for (const id of tempRentalIds) {
        const res = await ApiGetRentalById(id);
        if (res.success && res.rental.paymentStatus !== 'PAID') {
          allPaid = false;
          break;
        }
      }

      if (allPaid) {
        stopPolling();
        setIsWaitingPayment(false);
        setCurrentStep(4);
      }
    } catch (err) {
      console.error('Check payment status error:', err);
    }
  };

  const startPolling = () => {
    if (pollingInterval.current) return;
    pollingInterval.current = setInterval(() => {
      console.log("[CHECKOUT] Polling payment status...");
      checkAllRentalsStatus();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await ApiGetAvailableVouchersForCart(cartType);
        setAvailableVouchers(res?.vouchers || []);
      } catch (err) {
        console.error('Fetch vouchers error:', err);
      }
    };
    if (currentStep === 1) fetchVouchers();
  }, [currentStep, cartType]);

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    Alert.alert('Thông báo', 'Đã hủy chọn mã giảm giá');
  };

  const handleApplyVoucher = async (code: string) => {
    setIsApplyingVoucher(true);
    try {
      console.log(`Applying voucher: ${code} for cartType: ${cartType}`);
      const res = await ApiValidateVoucher({ code, cartType: cartType || 'NORMAL' });
      if (res.success) {
        setAppliedVoucher({ code: res.code, discount: res.discount });
        setVoucherCode(res.code);
        setShowVoucherModal(false);
        Alert.alert('Thành công', res.message || 'Đã áp dụng mã giảm giá');
      } else {
        Alert.alert('Lỗi', res.message || 'Mã giảm giá không hợp lệ');
      }
    } catch (err: any) {
      console.error('Apply voucher error:', err);
      Alert.alert('Lỗi', 'Không thể áp dụng mã giảm giá lúc này');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handlePreviewContract = async () => {
    setIsPreviewLoading(true);
    try {
      const previewData = {
        items: cart,
        deliveryAddress: address,
        phoneNumber,
        customerName: user?.fullName || user?.username,
        subtotal: totals.subtotal,
        totalDeposit: totals.totalDeposit,
        shippingFee: deliveryFee,
        total: totals.total,
      };
      const res = await ApiPreviewContractWithData(previewData);
      if (res.previewUrl) {
        await WebBrowser.openBrowserAsync(res.previewUrl);
      } else {
        Alert.alert('Lỗi', 'Không thể tạo bản xem trước hợp đồng');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearchAddress = async () => {
    if (!address.street) return;
    try {
      const geo = await Location.geocodeAsync(`${address.street}, Đà Nẵng`);
      if (geo.length > 0) {
        const { latitude, longitude } = geo[0];
        setMapPosition({ latitude, longitude });
        const dist = calculateDistance(FPT_COORDS.latitude, FPT_COORDS.longitude, latitude, longitude);
        const fee = Math.max(MIN_DELIVERY_FEE, Math.round(dist * FEE_PER_KM));
        setDistance(dist);
        setDeliveryFee(fee);
        Alert.alert('Thành công', `Đã tìm thấy vị trí. Khoảng cách: ${dist.toFixed(1)}km. Phí ship: ${fee.toLocaleString()}đ`);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy địa chỉ này');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Lỗi khi tìm kiếm địa chỉ');
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMapPosition({ latitude, longitude });
    const dist = calculateDistance(FPT_COORDS.latitude, FPT_COORDS.longitude, latitude, longitude);
    const fee = Math.max(MIN_DELIVERY_FEE, Math.round(dist * FEE_PER_KM));
    setDistance(dist);
    setDeliveryFee(fee);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress(prev => ({ ...prev, street: 'Vị trí đã chọn (Chưa có địa chỉ cụ thể)' }));
        return;
      }
      
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
    } catch (err) { console.error(err); }
  };

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
    let sub = 0;
    let deposit = 0;
    cart.forEach((item) => {
      sub += (item.deviceId?.discountPrice || item.deviceId?.rentPrice?.perDay || 0) * item.totalDays * item.quantity;
      deposit += (item.deviceId?.depositAmount || 0) * item.quantity;
    });
    const discountedTotal = sub + deposit + deliveryFee - (appliedVoucher?.discount || 0);
    return { subtotal: sub, totalDeposit: deposit, total: Math.max(0, discountedTotal) };
  }, [cart, deliveryFee, appliedVoucher]);

  const handleNextStep = () => {
    if (currentStep === 2) {
      if (deliveryType === 'DELIVERY') {
        if (!address.street || !phoneNumber) {
          Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin giao hàng');
          return;
        }
        if (deliveryFee === 0) {
          Alert.alert('Thông báo', 'Vui lòng chọn vị trí trên bản đồ để tính phí giao hàng');
          return;
        }
      } else {
        if (!phoneNumber) {
          Alert.alert('Thông báo', 'Vui lòng nhập số điện thoại');
          return;
        }
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const useDefaultInfo = () => {
    if (user) {
      setAddress({
        receiverName: user.fullName || user.username || '',
        street: user.address?.street || '',
        district: user.address?.district || '',
        city: user.address?.city || 'Đà Nẵng',
        fullAddress: user.address?.fullAddress || ''
      });
      setPhoneNumber(user.phone || '');
      Alert.alert('Thành công', 'Đã lấy thông tin từ hồ sơ của bạn');
    }
  };

  const handleCheckout = async () => {
    if (currentStep === 3 && !isSigned) {
      Alert.alert('Lưu ý', 'Vui lòng ký xác nhận hợp đồng điện tử');
      return;
    }
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
        customerSignature: useSavedSignature ? user?.signatureUrl : 'ELECTRONIC_SIGNED_MOBILE',
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
        setCheckoutResult(res);
        if (res.paymentLink?.checkoutUrl) {
          setTempRentalIds(res.rentalIds || []);
          setIsWaitingPayment(true);
          startPolling();
          await WebBrowser.openBrowserAsync(res.paymentLink.checkoutUrl);
        } else {
          setCurrentStep(4);
        }
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
    <ScrollView style={styles.stepContainer} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {groupedBySupplier.map((group: any, idx: number) => (
        <View key={idx} style={styles.supplierCard}>
          <LinearGradient colors={['rgba(99, 102, 241, 0.1)', 'transparent']} style={styles.supplierHeader}>
            <View style={styles.supplierInfo}>
              <Ionicons name="storefront-outline" size={20} color="#6366F1" />
              <Text style={styles.supplierName}>{group.supplierName}</Text>
            </View>
            <View style={styles.supplierBadge}>
              <Text style={styles.supplierCount}>{group.items.length} món</Text>
            </View>
          </LinearGradient>
          {group.items.map((item: any, i: number) => (
            <View key={item._id} style={[styles.itemCard, i === 0 && { borderTopWidth: 0 }]}>
              <Image source={{ uri: item.deviceId?.images?.[0] }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.deviceId?.name}</Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>{(item.deviceId?.discountPrice || item.deviceId?.rentPrice?.perDay || 0).toLocaleString()}đ <Text style={styles.itemUnit}>/ngày</Text></Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemSubDetail}>{item.totalDays} ngày thuê</Text>
                  <Text style={styles.itemSubtotal}>{((item.deviceId?.discountPrice || item.deviceId?.rentPrice?.perDay || 0) * (item.totalDays || 0) * (item.quantity || 0)).toLocaleString()}đ</Text>
                </View>
              </View>
            </View>
          ))}
          <View style={styles.supplierFooter}>
            <Text style={styles.supplierFooterLabel}>Tạm tính Shop:</Text>
            <Text style={styles.supplierFooterValue}>{(group.subtotal || 0).toLocaleString()}đ</Text>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.voucherCard} onPress={() => setShowVoucherModal(true)}>
        <View style={styles.voucherMain}>
          <View style={styles.voucherIconBox}>
            <Ionicons name="ticket-outline" size={24} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.voucherLabel}>Ưu đãi từ GearXpert</Text>
            <Text style={styles.voucherValue}>
              {appliedVoucher ? `Giảm ${(appliedVoucher.discount || 0).toLocaleString()}đ` : 'Chọn hoặc nhập mã giảm giá'}
            </Text>
          </View>
          {appliedVoucher && (
            <TouchableOpacity style={styles.removeVoucherBtn} onPress={handleRemoveVoucher}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
        {!appliedVoucher && <Ionicons name="chevron-forward" size={20} color="#94A3B8" />}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.typePicker}>
        <TouchableOpacity
          style={[styles.typeBtn, deliveryType === 'PICKUP' && styles.typeBtnActive]}
          onPress={() => {
            setDeliveryType('PICKUP');
            setDeliveryFee(0);
            setDistance(0);
            setAddress({ ...address, street: 'Kho GearXpert', district: 'Liên Chiểu' });
          }}
        >
          <Ionicons name="business-outline" size={20} color={deliveryType === 'PICKUP' ? "#FFF" : "#94A3B8"} />
          <Text style={[styles.typeBtnText, deliveryType === 'PICKUP' && styles.typeBtnTextActive]}>Nhận tại kho</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.typeBtn, deliveryType === 'DELIVERY' && styles.typeBtnActive]}
          onPress={() => setDeliveryType('DELIVERY')}
        >
          <Ionicons name="car-outline" size={20} color={deliveryType === 'DELIVERY' ? "#FFF" : "#94A3B8"} />
          <Text style={[styles.typeBtnText, deliveryType === 'DELIVERY' && styles.typeBtnTextActive]}>Giao tận nơi</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Thông tin người nhận</Text>
          <TouchableOpacity onPress={useDefaultInfo}>
            <Text style={styles.useSavedText}>Dùng mặc định</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tên người nhận</Text>
          <TextInput style={styles.input} value={address.receiverName} onChangeText={(txt) => setAddress({ ...address, receiverName: txt })} placeholder="Nhập tên người nhận" placeholderTextColor="#64748B" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Nhập số điện thoại" placeholderTextColor="#64748B" keyboardType="phone-pad" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Địa chỉ cụ thể (Tên đường, phường...)</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput 
              style={[styles.input, { flex: 1 }]} 
              value={address.street} 
              onChangeText={(txt) => setAddress({ ...address, street: txt })} 
              placeholder="Nhập địa chỉ của bạn" 
              placeholderTextColor="#64748B" 
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearchAddress}>
              <Ionicons name="search" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {deliveryType === 'DELIVERY' && (
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
            {distance > 0 && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>
              </View>
            )}
          </View>
          <View style={styles.addressDisplay}>
            <Ionicons name="location" size={20} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText} numberOfLines={1}>{address.street || 'Chưa chọn vị trí'}</Text>
              {deliveryFee > 0 && <Text style={{ color: '#10B981', fontSize: 13, fontWeight: 'bold', marginTop: 2 }}>Phí vận chuyển dự kiến: {deliveryFee.toLocaleString()}đ</Text>}
            </View>
          </View>
          <View style={styles.mapContainer}>
            <MapView style={StyleSheet.absoluteFill} initialRegion={{ ...mapPosition, latitudeDelta: 0.05, longitudeDelta: 0.05 }} onPress={handleMapPress}>
              <Marker coordinate={mapPosition} />
              <Marker coordinate={FPT_COORDS} pinColor="#10B981" title="Kho GearXpert" />
            </MapView>
            <View style={styles.mapOverlay}><Text style={styles.mapHint}>Chạm vào bản đồ để chọn vị trí</Text></View>
          </View>
        </View>
      )}

      {deliveryType === 'PICKUP' && (
        <View style={styles.pickupCard}>
          <Ionicons name="information-circle-outline" size={24} color="#6366F1" />
          <View style={styles.pickupInfo}>
            <Text style={styles.pickupTitle}>Địa điểm nhận hàng:</Text>
            <Text style={styles.pickupAddr}>Trường Đại học FPT Đà Nẵng, Khu đô thị FPT, Ngũ Hành Sơn, Đà Nẵng</Text>
            <Text style={styles.pickupFree}>Miễn phí vận chuyển 100%</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
        <TouchableOpacity style={[styles.paymentOption, selectedPayment === 'BANK' && styles.paymentOptionActive]} onPress={() => setSelectedPayment('BANK')}>
          <View style={styles.paymentMain}>
            <View style={[styles.paymentIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}><Ionicons name="qr-code-outline" size={24} color="#6366F1" /></View>
            <View>
              <Text style={styles.paymentName}>Chuyển khoản (VietQR / PayOS)</Text>
              <Text style={styles.paymentDesc}>Tự động xác nhận ngay lập tức</Text>
            </View>
          </View>
          <Ionicons name={selectedPayment === 'BANK' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedPayment === 'BANK' ? "#6366F1" : "#334155"} />
        </TouchableOpacity>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.paymentOption, selectedPayment === 'WALLET' && styles.paymentOptionActive]} 
          onPress={() => setSelectedPayment('WALLET')}
        >
          <View style={styles.paymentMain}>
            <View style={[styles.paymentIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}><Ionicons name="wallet-outline" size={24} color="#F59E0B" /></View>
            <View>
              <Text style={styles.paymentName}>Ví GearXpert</Text>
              <Text style={styles.paymentDesc}>Số dư: {(wallet?.balance || 0).toLocaleString()}đ</Text>
            </View>
          </View>
          <Ionicons name={selectedPayment === 'WALLET' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedPayment === 'WALLET' ? "#6366F1" : "#334155"} />
        </TouchableOpacity>

        {selectedPayment === 'WALLET' && (
          <View style={[styles.balanceNotice, (wallet?.balance || 0) >= totals.total ? styles.balanceCheckOk : styles.balanceCheckFail]}>
            <Ionicons
              name={(wallet?.balance || 0) >= totals.total ? "checkmark-circle" : "alert-circle"}
              size={18}
              color={(wallet?.balance || 0) >= totals.total ? "#10B981" : "#EF4444"}
            />
            <Text style={[styles.balanceNoticeText, { color: (wallet?.balance || 0) >= totals.total ? "#10B981" : "#EF4444" }]}>
              {(wallet?.balance || 0) >= totals.total ? 'Số dư đủ để thanh toán' : 'Không đủ số dư trong ví'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Hợp đồng thuê điện tử</Text>
          <TouchableOpacity onPress={handlePreviewContract} disabled={isPreviewLoading}><Text style={styles.previewBtnText}>{isPreviewLoading ? 'Đang tải...' : 'Xem hợp đồng'}</Text></TouchableOpacity>
        </View>
        <Text style={styles.contractNote}>Vui lòng kiểm tra kỹ nội dung hợp đồng trước khi ký và thanh toán.</Text>

        {user?.signatureUrl && (
          <TouchableOpacity
            style={[styles.savedSigOption, useSavedSignature && styles.savedSigOptionActive]}
            onPress={() => {
              setUseSavedSignature(!useSavedSignature);
              if (!useSavedSignature) setIsSigned(true);
            }}
          >
            <View style={styles.savedSigHeader}>
              <Ionicons name={useSavedSignature ? "checkbox" : "square-outline"} size={20} color={useSavedSignature ? "#6366F1" : "#94A3B8"} />
              <Text style={styles.savedSigTitle}>Sử dụng chữ ký từ hồ sơ</Text>
            </View>
            <Image source={{ uri: user.signatureUrl }} style={styles.savedSigImage} />
          </TouchableOpacity>
        )}

        {!useSavedSignature && (
          <TouchableOpacity style={[styles.signatureBox, isSigned && styles.signatureBoxActive]} onPress={() => setIsSigned(!isSigned)}>
            {isSigned ? (
              <View style={styles.signedContent}><Ionicons name="checkmark-circle" size={40} color="#10B981" /><Text style={styles.signedText}>Đã ký xác nhận điện tử</Text></View>
            ) : (
              <View style={styles.unsignedContent}><Ionicons name="pencil" size={24} color="#94A3B8" /><Text style={styles.unsignedText}>Chạm để ký xác nhận</Text></View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: 'center', marginVertical: 30 }}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
        <Text style={styles.successTitle}>Đặt thuê thành công!</Text>
        <Text style={styles.successDesc}>Đơn hàng của bạn đã được ghi nhận và đang được xử lý.</Text>
      </View>

      <View style={styles.orderSummaryCard}>
        <Text style={styles.orderSummaryTitle}>Chi tiết đơn hàng</Text>

        <View style={styles.orderSummaryRow}>
          <Text style={styles.orderSummaryLabel}>Tạm tính</Text>
          <Text style={styles.orderSummaryValue}>{(totals.subtotal || 0).toLocaleString()}đ</Text>
        </View>

        <View style={styles.orderSummaryRow}>
          <Text style={styles.orderSummaryLabel}>Tiền đặt cọc</Text>
          <Text style={styles.orderSummaryValue}>{(totals.totalDeposit || 0).toLocaleString()}đ</Text>
        </View>

        <View style={styles.orderSummaryRow}>
          <Text style={styles.orderSummaryLabel}>Phí vận chuyển</Text>
          <Text style={styles.orderSummaryValue}>{(deliveryFee || 0).toLocaleString()}đ</Text>
        </View>

        {appliedVoucher && (
          <View style={styles.orderSummaryRow}>
            <Text style={[styles.orderSummaryLabel, { color: '#10B981' }]}>Giảm giá ({appliedVoucher.code})</Text>
            <Text style={[styles.orderSummaryValue, { color: '#10B981' }]}>-{(appliedVoucher.discount || 0).toLocaleString()}đ</Text>
          </View>
        )}

        <View style={[styles.orderSummaryRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={[styles.orderSummaryLabel, { color: '#FFF', fontWeight: 'bold' }]}>Tổng thanh toán</Text>
          <Text style={[styles.orderSummaryValue, { color: '#6366F1', fontSize: 18, fontWeight: 'bold' }]}>{(totals.total || 0).toLocaleString()}đ</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Thông tin nhận hàng</Text>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons name="person-outline" size={16} color="#94A3B8" />
            <Text style={{ color: '#F1F5F9' }}>{address.receiverName}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons name="call-outline" size={16} color="#94A3B8" />
            <Text style={{ color: '#F1F5F9' }}>{phoneNumber}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons name="location-outline" size={16} color="#94A3B8" />
            <Text style={{ color: '#F1F5F9', flex: 1 }}>{deliveryType === 'PICKUP' ? 'Nhận tại kho GearXpert' : address.fullAddress || `${address.street}, ${address.district}`}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.homeBtnText}>Về trang chủ</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.progressBar}>{[1, 2, 3, 4].map((s) => <View key={s.toString()} style={[styles.progressStep, s <= currentStep && styles.progressStepActive]} />)}</View>
      <View style={{ flex: 1 }}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </View>
      <Modal visible={isWaitingPayment} transparent animationType="fade">
        <View style={styles.overlayContainer}>
          <View style={styles.waitingCard}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.waitingTitle}>Đang chờ thanh toán...</Text>
            <Text style={styles.waitingDesc}>Vui lòng hoàn tất thanh toán trong trình duyệt.</Text>
          </View>
        </View>
      </Modal>
      {currentStep < 4 && (
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.totalValue}>{(totals.total || 0).toLocaleString()}đ</Text>
                {appliedVoucher && <Text style={styles.discountBadge}>-{(appliedVoucher.discount || 0).toLocaleString()}đ</Text>}
              </View>
            </View>
            <TouchableOpacity style={[styles.nextBtn, isProcessing && { opacity: 0.5 }]} onPress={currentStep === 3 ? handleCheckout : handleNextStep} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={styles.nextBtnText}>{currentStep === 3 ? 'Thanh toán' : 'Tiếp theo'}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Modal visible={showVoucherModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn mã giảm giá</Text>
              <TouchableOpacity onPress={() => setShowVoucherModal(false)}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
            </View>
            <View style={styles.voucherInputRow}>
              <TextInput style={styles.modalInput} placeholder="Nhập mã voucher..." placeholderTextColor="#94A3B8" value={voucherCode} onChangeText={setVoucherCode} />
              <TouchableOpacity style={styles.applySmallBtn} onPress={() => handleApplyVoucher(voucherCode)}><Text style={styles.applySmallBtnText}>Áp dụng</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.voucherList}>
              {availableVouchers.map((v) => (
                <TouchableOpacity key={v.code} style={styles.voucherItem} onPress={() => handleApplyVoucher(v.code)}>
                  <View style={styles.voucherItemLeft}><Ionicons name="ticket" size={30} color="#10B981" /></View>
                  <View style={styles.voucherItemCenter}>
                    <Text style={styles.voucherCodeText}>{v.code}</Text>
                    <Text style={styles.voucherDescText}>Giảm {(v.discount || v.potentialDiscount || 0).toLocaleString()}đ</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  supplierCard: { backgroundColor: '#1E293B', borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  supplierHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  supplierInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  supplierName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  supplierBadge: { backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  supplierCount: { color: '#6366F1', fontSize: 12, fontWeight: '700' },
  supplierFooter: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'flex-end', gap: 8, alignItems: 'center' },
  supplierFooterLabel: { color: '#94A3B8', fontSize: 14 },
  supplierFooterValue: { color: '#6366F1', fontWeight: 'bold', fontSize: 16 },
  itemCard: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  itemImage: { width: 70, height: 70, borderRadius: 12 },
  itemInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  itemName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  itemPriceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  itemPrice: { color: '#FFF', fontSize: 14 },
  itemUnit: { color: '#64748B', fontSize: 12 },
  itemQty: { color: '#6366F1', fontWeight: '700' },
  itemDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  itemSubDetail: { color: '#94A3B8', fontSize: 12 },
  itemSubtotal: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  voucherCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#10B981', marginBottom: 20 },
  voucherMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  voucherIconBox: { width: 44, height: 44, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  voucherLabel: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  voucherValue: { color: '#10B981', fontSize: 13, marginTop: 2 },
  infoCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, marginBottom: 20 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  input: { height: 50, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  typePicker: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: { flex: 1, height: 60, borderRadius: 20, backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  typeBtnActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  typeBtnText: { color: '#94A3B8', fontWeight: 'bold' },
  typeBtnTextActive: { color: '#FFF' },
  useSavedText: { color: '#6366F1', fontWeight: 'bold' },
  pickupCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' },
  pickupInfo: { flex: 1 },
  pickupTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  pickupAddr: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },
  pickupFree: { color: '#10B981', fontWeight: 'bold', fontSize: 12, marginTop: 8 },
  balanceNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 4 },
  balanceCheckOk: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  balanceCheckFail: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  balanceNoticeText: { fontSize: 12, fontWeight: '600' },
  savedSigOption: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  savedSigOptionActive: { borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.05)' },
  savedSigHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  savedSigTitle: { color: '#FFF', fontWeight: 'bold' },
  savedSigImage: { width: '100%', height: 60, resizeMode: 'contain', backgroundColor: 'white', borderRadius: 12, padding: 8 },
  distanceBadge: { backgroundColor: '#6366F1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  distanceText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  addressDisplay: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 16, marginBottom: 16 },
  addressText: { color: '#F1F5F9', flex: 1, fontSize: 14 },
  mapContainer: { height: 200, borderRadius: 20, overflow: 'hidden' },
  mapOverlay: { ...StyleSheet.absoluteFillObject, height: 40, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  mapHint: { color: '#FFF', fontSize: 12, fontWeight: '500' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'transparent' },
  paymentOptionActive: { borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.05)' },
  paymentMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  paymentIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  paymentName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  paymentDesc: { color: '#64748B', fontSize: 12, marginTop: 2 },
  previewBtnText: { color: '#6366F1', fontWeight: 'bold' },
  contractNote: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  signatureBox: { height: 120, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderStyle: 'dashed', borderColor: '#475569', justifyContent: 'center', alignItems: 'center' },
  signatureBoxActive: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderStyle: 'solid' },
  unsignedContent: { alignItems: 'center', gap: 8 },
  unsignedText: { color: '#64748B', fontSize: 14 },
  signedContent: { alignItems: 'center', gap: 4 },
  signedText: { color: '#10B981', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#1E293B', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#94A3B8', fontSize: 14 },
  totalValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  discountBadge: { backgroundColor: '#10B981', color: '#FFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  nextBtn: { backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  nextBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  successIconContainer: { width: 120, height: 120, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  successDesc: { color: '#94A3B8', textAlign: 'center', fontSize: 14, marginHorizontal: 30, marginTop: 10 },
  orderSummaryCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  orderSummaryTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  orderSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderSummaryLabel: { color: '#94A3B8', fontSize: 14 },
  orderSummaryValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  homeBtn: { backgroundColor: '#6366F1', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20, width: '100%', alignItems: 'center', marginTop: 20 },
  homeBtnText: { color: '#FFF', fontWeight: 'bold' },
  overlayContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  waitingCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 30, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  waitingTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  waitingDesc: { color: '#94A3B8', textAlign: 'center', marginTop: 12, marginBottom: 24, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  voucherInputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modalInput: { flex: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, color: '#FFF' },
  applySmallBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 },
  applySmallBtnText: { color: '#FFF', fontWeight: 'bold' },
  voucherList: { marginBottom: 20 },
  voucherItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 12 },
  voucherItemLeft: { width: 50, height: 50, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  voucherItemCenter: { flex: 1, marginLeft: 16 },
  voucherCodeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  voucherDescText: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  searchBtn: { backgroundColor: '#6366F1', width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  removeVoucherBtn: { padding: 4 },
});

export default CheckoutScreen;
