import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface DeviceCardProps {
  device: any;
  variant?: 'horizontal' | 'grid';
  onPress?: (device: any) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (deviceId: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  variant = 'horizontal',
  onPress,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const router = useRouter();
  
  const imageUrl = Array.isArray(device.images) && device.images.length > 0
    ? device.images[0]
    : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32';

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(device.rentPrice?.perDay || 0);

  const handlePress = () => {
    if (onPress) {
      onPress(device);
    } else {
      const deviceId = device._id || device.id;
      if (deviceId) {
        router.push(`/device/${deviceId}` as any);
      }
    }
  };

  const handleFavoritePress = (e: any) => {
    const deviceId = device._id || device.id;
    if (onFavoriteToggle && deviceId) onFavoriteToggle(deviceId);
  };

  if (variant === 'grid') {
    const CARD_WIDTH = (width - 48 - 12) / 2;
    return (
      <TouchableOpacity
        style={[styles.productCard, { width: CARD_WIDTH }]}
        activeOpacity={0.85}
        onPress={handlePress}
      >
        <View style={styles.productImageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
          {device.ratingAvg > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={styles.ratingText}>{device.ratingAvg.toFixed(1)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={handleFavoritePress}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={16}
              color={isFavorite ? "#EF4444" : "#FFF"}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productCategory}>{device.category || 'GEAR'}</Text>
          <Text style={styles.productName} numberOfLines={2}>{device.name}</Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>
              {formattedPrice}
              <Text style={styles.perDay}>/day</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default: horizontal (premium card from home)
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.premiumCard}
      onPress={handlePress}
    >
      <View style={styles.premiumCardInner}>
        <View style={styles.premiumImageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.premiumImage} resizeMode="cover" />
          <View style={styles.premiumRatingBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.premiumRatingText}>
              {device.ratingAvg > 0 ? device.ratingAvg.toFixed(1) : 'New'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.premiumHeartButton}
            onPress={handleFavoritePress}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#EF4444" : "#0F172A"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.premiumCardBody}>
          <Text style={styles.premiumCategoryText}>{device.category || 'GEAR'}</Text>
          <Text style={styles.premiumTitle} numberOfLines={1}>{device.name}</Text>
          <View style={styles.premiumFooter}>
            <View style={styles.premiumPriceContainer}>
              <Text style={styles.premiumPriceValue}>{formattedPrice}</Text>
              <Text style={styles.premiumPricePeriod}>/day</Text>
            </View>
            <View style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DeviceCard;

const styles = StyleSheet.create({
  // Grid Variant Styles (from products.tsx)
  productCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  productImageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#FFF',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22D3EE',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
    lineHeight: 18,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6366F1',
  },
  perDay: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },

  // Horizontal Variant Styles (from home.tsx)
  premiumCard: {
    width: width * 0.75,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  premiumCardInner: {
    backgroundColor: '#1E293B',
    borderRadius: 32,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  premiumImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  premiumImage: {
    width: '100%',
    height: '100%',
  },
  premiumRatingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  premiumRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  premiumHeartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumCardBody: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  premiumCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  premiumFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumPriceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  premiumPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#22D3EE',
  },
  premiumPricePeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 3,
    marginLeft: 2,
  },
  bookButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bookButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
