import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetSmartGearSuggestion } from '../../src/features/equipment/api';

const { width } = Dimensions.get('window');

export default function SmartGearScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSuggest = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await ApiGetSmartGearSuggestion(prompt);
      if (res.success) {
        setResult(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderCombo = (title: string, combo: any, icon: string, color: string) => {
    if (!combo) return null;
    return (
      <View style={styles.comboCard}>
        <LinearGradient colors={[color, 'rgba(15, 23, 42, 0.9)']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.comboHeader}>
          <Ionicons name={icon as any} size={24} color="#FFF" />
          <Text style={styles.comboTitle}>{combo.comboName || title}</Text>
        </LinearGradient>
        <View style={styles.comboContent}>
          <Text style={styles.comboDesc}>{combo.description}</Text>
          <Text style={styles.priceLabel}>Tổng cộng: <Text style={styles.priceValue}>{combo.totalPricePerDay?.toLocaleString()}đ</Text>/ngày</Text>
          
          <View style={styles.divider} />
          
          {combo.devices.map((dev: any, idx: number) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.deviceItem}
              onPress={() => router.push(`/(tabs)/products?search=${dev.name}`)}
            >
              <View style={styles.deviceDot} />
              <View style={{flex: 1}}>
                <Text style={styles.deviceName}>{dev.name}</Text>
                <Text style={styles.deviceReason}>{dev.reason}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SmartGear AI</Text>
        <View style={{width: 40}} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introSection}>
            <View style={styles.aiIconContainer}>
              <Ionicons name="hardware-chip-outline" size={40} color="#22D3EE" />
            </View>
            <Text style={styles.introTitle}>Tư vấn thiết bị thông minh</Text>
            <Text style={styles.introSubtitle}>
              Hãy cho AI biết nhu cầu của bạn (ví dụ: "Tôi muốn quay vlog du lịch", "Setup phòng livestream game") để nhận gợi ý combo phù hợp nhất.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập nhu cầu của bạn tại đây..."
              placeholderTextColor="#64748B"
              multiline
              value={prompt}
              onChangeText={setPrompt}
            />
            <TouchableOpacity 
              style={[styles.suggestBtn, !prompt.trim() && { opacity: 0.5 }]} 
              onPress={handleSuggest}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.suggestBtnText}>Gợi ý cho tôi</Text>
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Gợi ý từ SmartGear:</Text>
              {renderCombo("Cơ bản", result.budget, "leaf-outline", "#10B981")}
              {renderCombo("Tiêu chuẩn", result.standard, "star-outline", "#3B82F6")}
              {renderCombo("Cao cấp", result.premium, "diamond-outline", "#8B5CF6")}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  inputContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    color: '#FFF',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  suggestBtn: {
    backgroundColor: '#22D3EE',
    height: 54,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  suggestBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultsContainer: {
    marginTop: 40,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
  },
  comboCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    marginBottom: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  comboHeader: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comboTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  comboContent: {
    padding: 20,
  },
  comboDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  priceLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  priceValue: {
    color: '#22D3EE',
    fontWeight: '700',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 15,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  deviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22D3EE',
  },
  deviceName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceReason: {
    color: '#64748B',
    fontSize: 12,
  },
});
