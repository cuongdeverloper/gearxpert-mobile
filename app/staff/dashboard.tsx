import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../src/context/AuthContext';

export default function StaffDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảng điều khiển Nhân viên</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Quản lý công việc</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/staff/task-list', params: { type: 'delivery' } })}
          >
            <BlurView intensity={20} tint="dark" style={styles.cardInner}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                <Ionicons name="cube-outline" size={32} color="#22D3EE" />
              </View>
              <Text style={styles.cardTitle}>Giao hàng</Text>
              <Text style={styles.cardSub}>Nhiệm vụ giao thiết bị</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/staff/task-list', params: { type: 'return' } })}
          >
            <BlurView intensity={20} tint="dark" style={styles.cardInner}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(252, 211, 77, 0.15)' }]}>
                <Ionicons name="return-down-back-outline" size={32} color="#FCD34D" />
              </View>
              <Text style={styles.cardTitle}>Thu hồi</Text>
              <Text style={styles.cardSub}>Nhiệm vụ thu hồi thiết bị</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Thao tác</Text>
        
        <TouchableOpacity 
          style={styles.actionRow}
          onPress={() => router.push('/staff/report-issue')}
        >
          <BlurView intensity={20} tint="dark" style={styles.actionRowInner}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="warning-outline" size={20} color="#EF4444" />
              </View>
              <Text style={styles.actionRowText}>Báo cáo sự cố</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionRow}
          onPress={() => {
            Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
              { text: "Hủy", style: "cancel" },
              { text: "Đăng xuất", style: "destructive", onPress: async () => {
                await logout();
                router.replace('/(auth)/login');
              }}
            ]);
          }}
        >
          <BlurView intensity={20} tint="dark" style={styles.actionRowInner}>
            <View style={styles.actionRowLeft}>
              <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Ionicons name="log-out-outline" size={20} color="#FFF" />
              </View>
              <Text style={styles.actionRowText}>Đăng xuất</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </BlurView>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  content: { padding: 20 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginBottom: 16, marginTop: 8 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  card: { width: '48%', borderRadius: 20, overflow: 'hidden' },
  cardInner: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: '#94A3B8', fontSize: 12, textAlign: 'center' },
  actionRow: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  actionRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  actionRowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBoxSmall: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionRowText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
});
