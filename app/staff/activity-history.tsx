import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ApiGetMyOperationLogs } from '../../src/features/staff/api';

const ACTION_CONFIG: any = {
  CONFIRM_PICKUP: { label: 'Xác nhận lấy hàng', color: '#3B82F6', icon: 'truck-outline' },
  CONFIRM_DELIVERY: { label: 'Giao hàng thành công', color: '#10B981', icon: 'checkmark-circle-outline' },
  CONFIRM_RETURN: { label: 'Xác nhận thu hồi', color: '#10B981', icon: 'return-down-back-outline' },
  LOG_DELIVERY_ISSUE: { label: 'Sự cố giao hàng', color: '#F59E0B', icon: 'alert-circle-outline' },
  LOG_RETURN_ISSUE: { label: 'Sự cố thu hồi', color: '#F59E0B', icon: 'alert-circle-outline' },
  HANDOVER_CONFIRM_SUCCESS: { label: 'Bàn giao thành công', color: '#10B981', icon: 'shield-checkmark-outline' },
  HANDOVER_CONFIRM_FAILED: { label: 'Bàn giao thất bại', color: '#EF4444', icon: 'close-circle-outline' },
  RETURN_CONFIRM_SUCCESS: { label: 'Thu hồi thành công', color: '#10B981', icon: 'sync-outline' },
  RETURN_CONFIRM_FAILED: { label: 'Thu hồi thất bại', color: '#EF4444', icon: 'alert-outline' },
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `${timeStr} - Hôm nay`;
  if (diffDays === 1) return `${timeStr} - Hôm qua`;
  return `${timeStr} - ${date.toLocaleDateString('vi-VN')}`;
};

const buildDetail = (log: any) => {
  const d = log.details || {};
  const parts = [];
  if (d.device) parts.push(d.device);
  if (d.customer) parts.push(`KH: ${d.customer}`);
  if (d.issueType) parts.push(`Loại: ${d.issueType}`);
  if (d.reason) parts.push(`Lý do: ${d.reason}`);
  return parts.join(' · ') || `#${String(log.targetId).slice(-6).toUpperCase()}`;
};

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;

  const fetchLogs = useCallback(async (targetPage: number, isInitial = true) => {
    if (isInitial) setLoading(true);
    
    const res = await ApiGetMyOperationLogs(targetPage, LIMIT);
    if (res?.logs) {
      const newLogs = res.logs || [];
      if (isInitial) {
        setLogs(newLogs);
        setPage(1);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
        setPage(targetPage);
      }
      setHasMore(newLogs.length === LIMIT);
    }
    if (isInitial) setLoading(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    await fetchLogs(page + 1, false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchLogs(1, true);
  }, [fetchLogs]);

  const renderItem = ({ item }: { item: any }) => {
    const config = ACTION_CONFIG[item.action] || { label: item.action, color: '#64748B', icon: 'information-circle-outline' };
    
    return (
      <View style={styles.logItem}>
        <View style={styles.timeline}>
          <View style={[styles.dot, { backgroundColor: config.color }]} />
          <View style={styles.line} />
        </View>
        
        <BlurView intensity={10} tint="dark" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.actionType}>
              <Ionicons name={config.icon} size={16} color={config.color} />
              <Text style={[styles.actionLabel, { color: config.color }]}>{config.label}</Text>
            </View>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>
          
          <Text style={styles.detailText}>{buildDetail(item)}</Text>
          {item.targetId && (
            <Text style={styles.targetId}>ID: {item.targetId}</Text>
          )}
        </BlurView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hoạt động</Text>
        <TouchableOpacity onPress={fetchLogs} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading && logs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id + index}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color="#6366F1" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="#334155" />
              <Text style={styles.emptyText}>Chưa có hoạt động nào được ghi lại.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  listContent: { padding: 20, paddingBottom: 40 },
  logItem: { flexDirection: 'row', marginBottom: 4 },
  timeline: { alignItems: 'center', width: 24, marginRight: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, zIndex: 1, marginTop: 18, borderWay: 2, borderColor: '#0F172A' },
  line: { flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,0.05)' },
  card: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  actionType: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  timeText: { color: '#64748B', fontSize: 11 },
  detailText: { color: '#CBD5E1', fontSize: 13, lineHeight: 18 },
  targetId: { color: '#475569', fontSize: 10, marginTop: 8, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#64748B', marginTop: 16, fontSize: 15, textAlign: 'center' },
});
