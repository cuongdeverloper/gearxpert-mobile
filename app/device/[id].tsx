import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ApiGetDeviceDetail,
  ApiGetDeviceAddons,
  ApiGetRelatedDevices,
} from '../../src/features/equipment/api';
import DeviceCard from '../../src/components/DeviceCard';
import { useFavorites } from '../../src/context/FavoriteContext';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  imageSection: {
    width: width,
    height: 450,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  thumbnailScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeThumbnail: {
    borderColor: '#22D3EE',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  statusBadgeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  contentSection: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -30,
    padding: 24,
    minHeight: 500,
  },
  mainInfo: {
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  categoryText: {
    color: '#22D3EE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ratingCount: {
    color: '#64748B',
    fontSize: 12,
  },
  deviceName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  pricingCard: {
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  pricingCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    justifyContent: 'space-between',
  },
  pricingLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  pricingValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  depositValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 32,
  },
  supplierAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#334155',
  },
  supplierAvatar: {
    width: '100%',
    height: '100%',
  },
  supplierTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  supplierName: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 16,
  },
  supplierSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#22D3EE',
    fontWeight: '700',
    fontSize: 14,
  },
  description: {
    color: '#94A3B8',
    lineHeight: 24,
    fontSize: 15,
  },
  specsContainer: {
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  specLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  specValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
  },
  configContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  configLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configLabel: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#334155',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
  },
  configDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 4,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  dateText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  durationBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 12,
  },
  durationText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  addonsList: {
    gap: 12,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedAddonCard: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    color: '#E2E8F0',
    fontWeight: 'bold',
    fontSize: 15,
  },
  selectedAddonText: {
    color: '#FFF',
  },
  addonPrice: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  relatedScroll: {
    paddingRight: 24,
    gap: 16,
  },
  relatedItemWrapper: {
    width: width * 0.45,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  cartButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rentButton: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rentPriceBox: {
    alignItems: 'flex-start',
  },
  rentPriceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rentPriceValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  rentActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
  },
  // Picker Modal
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: 450,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  dateList: {
    flex: 1,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  dateItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  dateItemText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  dateItemTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
});

const DeviceDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { favoriteIds, toggleFavorite } = useFavorites();

  const [device, setDevice] = useState<any>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 86400000)); // Default +1 day
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickingDateType, setPickingDateType] = useState<'start' | 'end'>('start');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [deviceRes, addonsRes, relatedRes] = await Promise.all([
        ApiGetDeviceDetail(id as string),
        ApiGetDeviceAddons(id as string),
        ApiGetRelatedDevices(id as string),
      ]);

      if (deviceRes && !deviceRes.errorCode) {
        setDevice(deviceRes);
      }
      if (Array.isArray(addonsRes)) {
        setAddons(addonsRes);
      }
      if (Array.isArray(relatedRes)) {
        setRelated(relatedRes);
      }
    } catch (error) {
      console.error('Error fetching device detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Device not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = Array.isArray(device.images) && device.images.length > 0 
    ? device.images 
    : ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32'];

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(device.rentPrice?.perDay || 0);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId) 
        : [...prev, addonId]
    );
  };

  const handleIncrement = () => {
    if (quantity < device.stockQuantity) setQuantity(prev => prev + 1);
  };
  const handleDecrement = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleDateSelect = (date: Date) => {
    if (pickingDateType === 'start') {
      setStartDate(date);
      // If end date is before new start date, update it
      if (endDate <= date) {
        setEndDate(new Date(date.getTime() + 86400000));
      }
    } else {
      if (date > startDate) {
        setEndDate(date);
      }
    }
  };

  const rentalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const addonTotal = addons
    .filter(a => selectedAddons.includes(a._id))
    .reduce((sum, a) => sum + (a.rentPrice?.perDay || 0), 0);
  
  const totalPrice = (device.rentPrice?.perDay + addonTotal) * quantity * rentalDays;

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: images[selectedImage] }} 
            style={styles.mainImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.6)', 'transparent', 'transparent', 'rgba(15, 23, 42, 0.8)']}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Header Buttons */}
          <View style={[styles.headerButtons, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}>
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.circleButton}>
                <Ionicons name="share-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.circleButton}
                onPress={() => toggleFavorite(id as string)}
              >
                <Ionicons 
                  name={favoriteIds.includes(id as string) ? "heart" : "heart-outline"} 
                  size={24} 
                  color={favoriteIds.includes(id as string) ? "#EF4444" : "#FFF"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thumbnails */}
          {images.length > 1 && (
            <View style={styles.thumbnailContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScroll}>
                {images.map((img: string, index: number) => (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => setSelectedImage(index)}
                    style={[
                      styles.thumbnailWrapper,
                      selectedImage === index && styles.activeThumbnail
                    ]}
                  >
                    <Image source={{ uri: img }} style={styles.thumbnail} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: device.stockQuantity > 0 ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>
                {device.stockQuantity > 0 ? 'AVAILABLE' : 'OUT OF STOCK'}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.mainInfo}>
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{device.category}</Text>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingValue}>{device.ratingAvg?.toFixed(1) || 'N/A'}</Text>
                <Text style={styles.ratingCount}>({device.reviewCount || 0} reviews)</Text>
              </View>
            </View>
            <Text style={styles.deviceName}>{device.name}</Text>
            
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#94A3B8" />
              <Text style={styles.locationText}>{device.location?.city || 'Unknown'}</Text>
            </View>
          </View>

          {/* Pricing Highlight */}
          <View style={styles.pricingCard}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pricingCardGradient}
            >
              <View>
                <Text style={styles.pricingLabel}>Daily Rent</Text>
                <Text style={styles.pricingValue}>{formattedPrice}</Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={styles.pricingLabel}>Deposit</Text>
                <Text style={styles.depositValue}>
                  {new Intl.NumberFormat('vi-VN').format(device.depositAmount || 0)}đ
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Supplier Info */}
          {device.supplierId && (
            <TouchableOpacity 
              style={styles.supplierCard}
              onPress={() => router.push(`/supplier/${device.supplierId?.userId?._id || device.supplierId?._id}` as any)}
            >
              <View style={styles.supplierAvatarContainer}>
                <Image 
                  source={{ uri: device.supplierId.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d' }} 
                  style={styles.supplierAvatar} 
                />
              </View>
              <View style={styles.supplierTextContent}>
                <Text style={styles.supplierName}>{device.supplierId.businessName || device.supplierId.fullName}</Text>
                <Text style={styles.supplierSubtitle}>Verified Supplier • Response time: fast</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.description}>{device.description}</Text>
          </View>

          {/* Technical Specs */}
          {device.specs && Object.keys(device.specs).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technical Specs</Text>
              <View style={styles.specsContainer}>
                {Object.entries(device.specs).map(([key, value]: any) => (
                  <View key={key} style={styles.specItem}>
                    <Text style={styles.specLabel}>{key}</Text>
                    <Text style={styles.specValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rental Configuration: Quantity & Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Period & Quantity</Text>
            <View style={styles.configContainer}>
              {/* Quantity */}
              <View style={styles.configRow}>
                <View style={styles.configLabelBox}>
                  <Ionicons name="cube-outline" size={20} color="#6366F1" />
                  <Text style={styles.configLabel}>Order Quantity</Text>
                </View>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity onPress={handleDecrement} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity onPress={handleIncrement} style={styles.qtyBtn}>
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.configDivider} />

              {/* Date Selection */}
              <View style={styles.configRow}>
                <View style={styles.configLabelBox}>
                  <Ionicons name="calendar-outline" size={20} color="#10B981" />
                  <Text style={styles.configLabel}>Rental Dates</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity 
                    style={styles.datePickerBtn}
                    onPress={() => { setPickingDateType('start'); setShowDatePicker(true); }}
                  >
                    <Text style={styles.dateText}>
                      {startDate.toLocaleDateString('vi-VN')}
                    </Text>
                  </TouchableOpacity>
                  <Ionicons name="arrow-forward" size={16} color="#475569" style={{ alignSelf: 'center' }} />
                  <TouchableOpacity 
                    style={styles.datePickerBtn}
                    onPress={() => { setPickingDateType('end'); setShowDatePicker(true); }}
                  >
                    <Text style={styles.dateText}>
                      {endDate.toLocaleDateString('vi-VN')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>Total Duration: {rentalDays} day(s)</Text>
              </View>
            </View>
          </View>

          {/* Addons */}
          {addons.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Essential Add-ons</Text>
              <View style={styles.addonsList}>
                {addons.map((addon) => (
                  <TouchableOpacity 
                    key={addon._id}
                    onPress={() => toggleAddon(addon._id)}
                    style={[
                      styles.addonCard,
                      selectedAddons.includes(addon._id) && styles.selectedAddonCard
                    ]}
                  >
                    <View style={styles.addonInfo}>
                      <Text style={[
                        styles.addonName,
                        selectedAddons.includes(addon._id) && styles.selectedAddonText
                      ]}>{addon.name}</Text>
                      <Text style={styles.addonPrice}>
                        +{new Intl.NumberFormat('vi-VN').format(addon.rentPrice?.perDay || 0)}đ/day
                      </Text>
                    </View>
                    <Ionicons 
                      name={selectedAddons.includes(addon._id) ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={selectedAddons.includes(addon._id) ? "#6366F1" : "#94A3B8"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Similar Gear */}
          {related.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Similar Gear</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScroll}
              >
                {related.map((item) => (
                  <View key={item._id} style={styles.relatedItemWrapper}>
                    <DeviceCard 
                      device={item} 
                      variant="grid" 
                      isFavorite={favoriteIds.includes(item._id)}
                      onFavoriteToggle={toggleFavorite}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Padding for Bottom Bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.95)']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
        <View style={styles.bottomBarContent}>
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart-outline" size={24} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.rentButton,
              device.stockQuantity <= 0 && styles.disabledButton
            ]}
            disabled={device.stockQuantity <= 0}
          >
            <View style={styles.rentPriceBox}>
              <Text style={styles.rentPriceLabel}>Total Price</Text>
              <Text style={styles.rentPriceValue}>
                {new Intl.NumberFormat('vi-VN').format(totalPrice)}đ
              </Text>
            </View>
            <View style={styles.rentActionBox}>
              <Text style={styles.rentButtonText}>Rent Now</Text>
              <Ionicons name="flash" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal (Basic Implementation) */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>
                Select {pickingDateType === 'start' ? 'Start Date' : 'End Date'}
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateList}>
              {[...Array(14)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i + (pickingDateType === 'end' ? 1 : 0));
                
                const isSelected = pickingDateType === 'start' 
                  ? date.toLocaleDateString() === startDate.toLocaleDateString()
                  : date.toLocaleDateString() === endDate.toLocaleDateString();

                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.dateItem, isSelected && styles.dateItemActive]}
                    onPress={() => {
                      handleDateSelect(date);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.dateItemText, isSelected && styles.dateItemTextActive]}>
                      {date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#6366F1" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeviceDetailScreen;

