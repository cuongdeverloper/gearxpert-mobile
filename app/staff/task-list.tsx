import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ApiGetDeliveringRentals,
  ApiGetReturningRentals,
  ApiClaimTask,
  ApiConfirmPickup,
} from '../../src/features/staff/api';

export default function TaskListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  const isDelivery = type === 'delivery';

  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = isDelivery ? await ApiGetDeliveringRentals() : await ApiGetReturningRentals();
      setTasks(res?.rentals || []);
    } catch {
      Alert.alert("Lỗi", "Không tải được danh sách nhiệm vụ.");
    } finally {
      setIsLoading(false);
    }
  }, [isDelivery]);

  // Refresh khi màn hình được focus lại (quay lại từ biên bản)
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  // ── Step 1: Nhận đơn ──────────────────────────────────────────────────────
  const handleClaimTask = async (taskId: string, rentalId: string) => {
    if (!taskId) return Alert.alert("Lỗi", "Không tìm thấy mã task.");
    setProcessingId(rentalId);
    try {
      const res = await ApiClaimTask(taskId);
      // Backend: { success: true, message, task, rentalId }
      if (res?.success || res?.task) {
        Alert.alert("Thành công", "Nhận đơn thành công! Tiếp theo hãy xác nhận lấy hàng khi đã tới kho.");
        fetchTasks();
      } else {
        Alert.alert("Lỗi", res?.message || "Không thể nhận đơn");
      }
    } catch {
      Alert.alert("Lỗi", "Lỗi kết nối mạng");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Step 2: Xác nhận lấy hàng ─────────────────────────────────────────────
  const handleConfirmPickup = async (rentalId: string) => {
    setProcessingId(rentalId);
    try {
      const res = await ApiConfirmPickup(rentalId);
      // Backend: { message: 'Pickup confirmed', pickedUpAt, handoverId } — no "success" field
      if (res?.pickedUpAt || res?.handoverId || res?.message === 'Pickup confirmed') {
        Alert.alert("Thành công", "Xác nhận lấy hàng thành công!\nBạn có thể mở biên bản bàn giao ngay bây giờ.");
        fetchTasks();
      } else {
        Alert.alert("Lỗi", res?.message || "Lỗi khi xác nhận lấy hàng");
      }
    } catch {
      Alert.alert("Lỗi", "Lỗi kết nối mạng");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Delivery step indicator ───────────────────────────────────────────────
  const getDeliveryStep = (item: any) => {
    const task = item.deliveryTask;
    if (!task) return { step: 0, label: 'Chưa có task', color: '#64748B' };
    if (task.status === 'PENDING')    return { step: 1, label: 'Bước 1: Nhận đơn',        color: '#94A3B8' };
    if (task.status === 'ASSIGNED' && !item.pickedUpAt) return { step: 2, label: 'Bước 2: Xác nhận lấy hàng', color: '#F59E0B' };
    if (item.pickedUpAt || task.status === 'IN_TRANSIT') return { step: 3, label: 'Bước 3: Mở biên bản bàn giao', color: '#10B981' };
    return { step: 0, label: task.status, color: '#64748B' };
  };

  const renderDeliveryTask = ({ item }: { item: any }) => {
    const task = item.deliveryTask;
    const customerName = item.customerId?.fullName || 'Khách hàng';
    const phone = item.phoneNumber || item.customerId?.phoneNumber || '—';
    const address = item.deliveryAddress?.fullAddress || item.deliveryAddress?.street || 'Chưa có địa chỉ';
    const isProcessing = processingId === item._id;
    const step = getDeliveryStep(item);

    // Step conditions based on actual data from backend
    const canClaim    = task?.status === 'PENDING' && !task?.deliveryStaffId;
    const canPickup   = task?.status === 'ASSIGNED' && !item.pickedUpAt;
    const canHandover = Boolean(item.pickedUpAt) || task?.status === 'IN_TRANSIT';

    return (
      <View style={s.card}>
        {/* Header */}
        <View style={s.cardHeader}>
          <Text style={s.cardId}>#{item._id?.substring(0, 8)}</Text>
          <View style={[s.stepBadge, { backgroundColor: step.color + '22', borderColor: step.color + '66' }]}>
            <Text style={[s.stepText, { color: step.color }]}>{step.label}</Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={s.infoBlock}>
          <View style={s.infoRow}>
            <Ionicons name="person-outline" size={15} color="#94A3B8" />
            <Text style={s.infoText}>{customerName}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="call-outline" size={15} color="#94A3B8" />
            <Text style={s.infoText}>{phone}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={15} color="#94A3B8" />
            <Text style={s.infoText} numberOfLines={2}>{address}</Text>
          </View>
          {item.pickedUpAt && (
            <View style={s.infoRow}>
              <Ionicons name="checkmark-circle" size={15} color="#10B981" />
              <Text style={[s.infoText, { color: '#10B981' }]}>Đã lấy hàng lúc {new Date(item.pickedUpAt).toLocaleTimeString('vi-VN')}</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          {canClaim && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#3B82F6' }, isProcessing && s.disabled]}
              onPress={() => handleClaimTask(task._id, item._id)}
              disabled={isProcessing}
            >
              {isProcessing
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><Ionicons name="hand-right-outline" size={16} color="#FFF" /><Text style={s.btnText}>Nhận đơn</Text></>
              }
            </TouchableOpacity>
          )}

          {canPickup && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#F59E0B' }, isProcessing && s.disabled]}
              onPress={() => handleConfirmPickup(item._id)}
              disabled={isProcessing}
            >
              {isProcessing
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><Ionicons name="cube-outline" size={16} color="#FFF" /><Text style={s.btnText}>Xác nhận lấy hàng</Text></>
              }
            </TouchableOpacity>
          )}

          {canHandover && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#10B981' }]}
              onPress={() => router.push({
                pathname: `/staff/handover/${item._id}`,
                params: { taskId: task?._id }
              })}
            >
              <Ionicons name="clipboard-outline" size={16} color="#FFF" />
              <Text style={s.btnText}>Mở biên bản bàn giao</Text>
            </TouchableOpacity>
          )}

          {!canClaim && !canPickup && !canHandover && (
            <View style={s.waitBadge}>
              <Text style={s.waitText}>Đang chờ gán hoặc xử lý</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderReturnTask = ({ item }: { item: any }) => {
    const customerName = item.customerId?.fullName || 'Khách hàng';
    const phone = item.phoneNumber || item.customerId?.phoneNumber || '—';
    const address = item.deliveryAddress?.fullAddress || item.deliveryAddress?.street || 'Chưa có địa chỉ';

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardId}>#{item._id?.substring(0, 8)}</Text>
          <View style={[s.stepBadge, { backgroundColor: 'rgba(252,211,77,0.15)', borderColor: 'rgba(252,211,77,0.4)' }]}>
            <Text style={[s.stepText, { color: '#FCD34D' }]}>Thu hồi</Text>
          </View>
        </View>

        <View style={s.infoBlock}>
          <View style={s.infoRow}>
            <Ionicons name="person-outline" size={15} color="#94A3B8" />
            <Text style={s.infoText}>{customerName}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="call-outline" size={15} color="#94A3B8" />
            <Text style={s.infoText}>{phone}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={15} color="#94A3B8" />
            <Text style={s.infoText} numberOfLines={2}>{address}</Text>
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: '#FCD34D' }]}
            onPress={() => router.push(`/staff/return/${item._id}`)}
          >
            <Ionicons name="return-down-back-outline" size={16} color="#0F172A" />
            <Text style={[s.btnText, { color: '#0F172A' }]}>Mở biên bản thu hồi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />

      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isDelivery ? 'Nhiệm vụ Giao Hàng' : 'Nhiệm vụ Thu Hồi'}</Text>
        <TouchableOpacity onPress={fetchTasks} style={s.backBtn}>
          <Ionicons name="refresh" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Step guide for delivery */}
      {isDelivery && (
        <View style={s.guideBar}>
          {['Nhận đơn', 'Lấy hàng', 'Bàn giao'].map((label, i) => (
            <View key={i} style={s.guideStep}>
              <View style={[s.guideCircle, { backgroundColor: i === 0 ? '#3B82F6' : i === 1 ? '#F59E0B' : '#10B981' }]}>
                <Text style={s.guideNum}>{i + 1}</Text>
              </View>
              <Text style={s.guideLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={isDelivery ? '#22D3EE' : '#FCD34D'} />
          <Text style={{ color: '#94A3B8', marginTop: 12 }}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={isDelivery ? renderDeliveryTask : renderReturnTask}
          contentContainerStyle={s.listContent}
          refreshing={isLoading}
          onRefresh={fetchTasks}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Ionicons name="clipboard-outline" size={48} color="#334155" />
              <Text style={s.emptyText}>Chưa có nhiệm vụ nào.</Text>
              <Text style={s.emptySubText}>Kéo xuống để làm mới danh sách.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  guideBar: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
  },
  guideStep: { alignItems: 'center', gap: 4 },
  guideCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  guideNum: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  guideLabel: { color: '#94A3B8', fontSize: 11 },
  listContent: { padding: 16, paddingBottom: 60 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardId: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  stepBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  stepText: { fontSize: 11, fontWeight: '700' },
  infoBlock: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { color: '#CBD5E1', fontSize: 14, flex: 1 },
  actions: { gap: 8 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
  },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  waitBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  waitText: { color: '#64748B', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#475569', fontSize: 13 },
});
