import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image, TextInput, Switch
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ApiGetHandoverByRental, ApiCreateHandoverDraft, ApiStartHandover,
  ApiSaveHandoverInspection, ApiConfirmHandoverSuccess, ApiFailHandover
} from '../../../src/features/staff/api';

const FAIL_REASONS = [
  { value: 'NO_SHOW', label: 'Khách không đến' },
  { value: 'CUSTOMER_REJECT', label: 'Khách từ chối' },
  { value: 'MISSING_ACCESSORY', label: 'Thiếu phụ kiện' },
  { value: 'DEVICE_MISMATCH', label: 'Sai thiết bị' },
  { value: 'DAMAGED_ITEM_AT_DELIVERY', label: 'TB hư hỏng' },
  { value: 'OTHER', label: 'Lý do khác' },
];

/** Build items payload từ attempt (giống makeInspectionPayload bên web) */
const buildItems = (attempt: any) => {
  const src = attempt?.inspection?.items?.length
    ? attempt.inspection.items
    : attempt?.prefetchedSnapshot?.items || [];
  return src.map((it: any) => ({
    rentalItemId: it.rentalItemId,
    deviceId: it.deviceId,
    deliveredDeviceItemIds: Array.isArray(it.deliveredDeviceItemIds) ? it.deliveredDeviceItemIds.filter(Boolean) : [],
    deliveredSerialNumbers: Array.isArray(it.deliveredSerialNumbers) ? it.deliveredSerialNumbers.filter(Boolean) : [],
    accessories: Array.isArray(it.accessories) ? it.accessories : [],
    deviceCondition: it.deviceCondition || 'UNKNOWN',
    mismatchNote: it.mismatchNote || '',
    operatorNote: it.operatorNote || '',
    evidenceUrls: Array.isArray(it.evidenceUrls) ? it.evidenceUrls : [],
  }));
};

export default function HandoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: rentalId, taskId } = useLocalSearchParams<{ id: string; taskId?: string }>();

  const [record, setRecord] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');

  // Inspection checklist
  const [checklist, setChecklist] = useState({
    customerPresent: false,
    customerIdentityVerified: false,
    deliveryAddressMatched: false,
  });
  const [inspectionNote, setInspectionNote] = useState('');

  // Confirm form
  const [confirmerName, setConfirmerName] = useState('');
  const [confirmerPhone, setConfirmerPhone] = useState('');
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmImages, setConfirmImages] = useState<string[]>([]);

  // Fail form
  const [failReason, setFailReason] = useState('');
  const [failNote, setFailNote] = useState('');
  const [failImages, setFailImages] = useState<string[]>([]);

  const hydrateFromAttempt = useCallback((attempt: any) => {
    if (!attempt) return;
    const cl = attempt.inspection?.checklist;
    if (cl) {
      setChecklist({
        customerPresent: Boolean(cl.customerPresent),
        customerIdentityVerified: Boolean(cl.customerIdentityVerified),
        deliveryAddressMatched: Boolean(cl.deliveryAddressMatched),
      });
      setInspectionNote(attempt.inspection?.operatorNote || '');
    }
    const snap = attempt.prefetchedSnapshot;
    const name = snap?.deliveryAddress?.receiverName || '';
    const phone = snap?.phoneNumber || '';
    if (name) setConfirmerName(name);
    if (phone) setConfirmerPhone(phone);
  }, []);

  /** Tương đương resolveReadyAttempt bên web */
  const resolveAttempt = useCallback(async () => {
    let listRes = await ApiGetHandoverByRental(rentalId);
    let handovers: any[] = listRes?.handovers || [];
    setAttempts(handovers);
    let active = handovers.find((x: any) => ['DRAFT', 'IN_PROGRESS'].includes(x.status));

    if (!active) {
      const dr = await ApiCreateHandoverDraft(rentalId, taskId);
      if (!dr?.success) return null;
      active = dr.handover;
      // Re-fetch to include the newly created draft
      listRes = await ApiGetHandoverByRental(rentalId);
      setAttempts(listRes?.handovers || []);
    }
    // Auto-start nếu DRAFT (giống ensureStartedAttempt bên web)
    if (active?.status === 'DRAFT') {
      const sr = await ApiStartHandover(active.id);
      if (sr?.success) active = sr.handover;
    }
    return active;
  }, [rentalId, taskId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const attempt = await resolveAttempt();
      if (attempt) {
        setRecord(attempt);
        hydrateFromAttempt(attempt);
      } else {
        Alert.alert('Lỗi', 'Không thể khởi tạo biên bản bàn giao.');
      }
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  }, [resolveAttempt, hydrateFromAttempt]);

  useEffect(() => { load(); }, []);

  const pickImage = async (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets?.[0]) setter(p => [...p, r.assets[0].uri]);
  };

  const appendImages = (formData: FormData, uris: string[]) => {
    uris.forEach((uri, i) => {
      const name = uri.match(/\/([^\/?#]+)[^\/]*$/)?.[1] || `img_${i}.jpg`;
      formData.append('images', { uri, name, type: 'image/jpeg' } as any);
    });
  };

  const handleSaveInspection = async () => {
    if (!record?.id) return;
    setWorking(true);
    try {
      const items = buildItems(record);
      if (items.length === 0) {
        Alert.alert('Lỗi', 'Không có thông tin thiết bị trong biên bản. Vui lòng tải lại.');
        return;
      }
      const payload = {
        checklist: { ...checklist },
        items,
        operatorNote: inspectionNote,
        evidenceUrls: [],
      };
      const res = await ApiSaveHandoverInspection(record.id, payload);
      if (res?.success) {
        Alert.alert('Thành công', 'Đã lưu kiểm tra thiết bị/phụ kiện.');
        setRecord(res.handover);
      } else {
        Alert.alert('Lỗi', res?.message || 'Không lưu được kiểm tra');
      }
    } catch { Alert.alert('Lỗi', 'Lỗi kết nối mạng'); }
    finally { setWorking(false); }
  };

  const handleConfirmSuccess = async () => {
    // Validation giống web
    const missing = (['customerPresent', 'customerIdentityVerified', 'deliveryAddressMatched'] as const)
      .filter(k => !checklist[k]);
    if (missing.length > 0) {
      Alert.alert('Lỗi', 'Vui lòng hoàn tất Inspection Checklist trước khi xác nhận.');
      return;
    }
    if (!confirmNote.trim()) {
      Alert.alert('Lỗi', 'Vui lòng ghi chú chi tiết kiểm tra thiết bị/phụ kiện.');
      return;
    }
    if (!confirmerName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người xác nhận nhận hàng.');
      return;
    }

    setWorking(true);
    try {
      const attempt = await resolveAttempt();
      if (!attempt) { Alert.alert('Lỗi', 'Không thể chuẩn bị biên bản.'); return; }

      const items = buildItems(attempt);
      const deliveryInspection = {
        checklist: { ...checklist },
        items,
        operatorNote: confirmNote.trim() || inspectionNote,
        evidenceUrls: [],
      };
      const customerConfirmation = {
        confirmed: true,
        confirmerName: confirmerName.trim(),
        confirmerPhone: confirmerPhone.trim(),
        operatorNote: confirmNote.trim(),
        otpVerified: false,
      };
      const formData = new FormData();
      formData.append('inspection', JSON.stringify(deliveryInspection));
      formData.append('customerConfirmation', JSON.stringify(customerConfirmation));
      appendImages(formData, confirmImages);

      const res = await ApiConfirmHandoverSuccess(attempt.id, formData);
      if (res?.success) {
        Alert.alert('Thành công', 'Xác nhận bàn giao thành công. Đơn đã chuyển RENTING.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể xác nhận bàn giao thành công');
      }
    } catch { Alert.alert('Lỗi', 'Lỗi kết nối mạng'); }
    finally { setWorking(false); }
  };

  const handleFail = async () => {
    if (!failReason) { Alert.alert('Lỗi', 'Vui lòng chọn lý do giao thất bại.'); return; }
    if (!failNote.trim()) { Alert.alert('Lỗi', 'Ghi chú chi tiết là bắt buộc.'); return; }

    setWorking(true);
    try {
      const attempt = await resolveAttempt();
      if (!attempt) { Alert.alert('Lỗi', 'Không thể chuẩn bị biên bản.'); return; }

      const items = buildItems(attempt);
      const inspection = { checklist: { ...checklist }, items, operatorNote: inspectionNote, evidenceUrls: [] };
      const failure = {
        reason: failReason,
        detail: failNote,
        operatorNote: failNote,
        missingAccessories: [], mismatchedSerials: [], evidenceUrls: [],
      };
      const formData = new FormData();
      formData.append('inspection', JSON.stringify(inspection));
      formData.append('failure', JSON.stringify(failure));
      appendImages(formData, failImages);

      const res = await ApiFailHandover(attempt.id, formData);
      if (res?.success) {
        Alert.alert('Thành công', 'Đã ghi nhận bàn giao thất bại.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể ghi nhận thất bại');
      }
    } catch { Alert.alert('Lỗi', 'Lỗi kết nối mạng'); }
    finally { setWorking(false); }
  };

  if (isLoading) return (
    <View style={s.screen}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Biên Bản Bàn Giao</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.center}><ActivityIndicator size="large" color="#22D3EE" /></View>
    </View>
  );

  const snap = record?.prefetchedSnapshot;
  const isFinal = ['COMPLETED', 'FAILED', 'VOID'].includes(record?.status);

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Biên Bản Bàn Giao</Text>
        <TouchableOpacity onPress={load} style={s.backBtn}>
          <Ionicons name="refresh" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Info card */}
        <View style={s.infoCard}>
          <Text style={s.infoId}>#{record?.id?.substring(0, 8)} · <Text style={{ color: '#22D3EE' }}>{record?.status}</Text></Text>
          {snap?.deliveryAddress?.fullAddress
            ? <Text style={s.infoSub}><Ionicons name="location-outline" size={13} /> {snap.deliveryAddress.fullAddress}</Text>
            : null}
          {snap?.phoneNumber
            ? <Text style={s.infoSub}><Ionicons name="call-outline" size={13} /> {snap.phoneNumber}</Text>
            : null}
        </View>

        {isFinal ? (
          <View style={s.finalBox}>
            <Ionicons
              name={record?.status === 'COMPLETED' ? 'checkmark-circle' : 'close-circle'}
              size={56}
              color={record?.status === 'COMPLETED' ? '#10B981' : '#EF4444'}
            />
            <Text style={[s.finalText, { color: record?.status === 'COMPLETED' ? '#10B981' : '#EF4444' }]}>
              {record?.status === 'COMPLETED' ? 'Bàn giao thành công!' : `Biên bản ${record?.status}`}
            </Text>
          </View>
        ) : (
          <>
            {/* ── Inspection Checklist ── */}
            <Text style={s.sectionTitle}>Inspection Checklist</Text>
            {[
              { key: 'customerPresent', label: 'Khách có mặt' },
              { key: 'customerIdentityVerified', label: 'Xác minh danh tính' },
              { key: 'deliveryAddressMatched', label: 'Đúng địa chỉ giao' },
            ].map(({ key, label }) => (
              <View key={key} style={s.switchRow}>
                <Text style={s.switchLabel}>{label}</Text>
                <Switch
                  value={(checklist as any)[key]}
                  onValueChange={v => setChecklist(p => ({ ...p, [key]: v }))}
                  trackColor={{ false: '#334155', true: '#22D3EE' }}
                />
              </View>
            ))}
            <Text style={s.fieldLabel}>Ghi chú kiểm tra (tùy chọn)</Text>
            <TextInput
              style={s.textarea}
              placeholder="Ghi chú tình trạng thiết bị, phụ kiện..."
              placeholderTextColor="#64748B"
              multiline
              value={inspectionNote}
              onChangeText={setInspectionNote}
            />
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#334155' }, working && s.disabled]}
              onPress={handleSaveInspection}
              disabled={working}
            >
              {working
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={s.btnText}>Lưu kiểm tra</Text>}
            </TouchableOpacity>

            {/* Device Checklist */}
            <Text style={[s.sectionTitle, { marginTop: 20 }]}>Danh sách thiết bị giao</Text>
            <View style={s.deviceList}>
              {(snap?.items || []).map((item: any, i: number) => {
                const serials = item.expectedSerialNumbers || [];
                return (
                  <View key={i} style={s.deviceItem}>
                    <View style={s.deviceInfo}>
                      <Ionicons name="cube-outline" size={20} color="#94A3B8" />
                      <View style={{ flex: 1 }}>
                        <Text style={s.deviceName}>{item.deviceName || 'Thiết bị'}</Text>
                        {serials.length > 0 && <Text style={s.deviceSerial}>Serial: {serials.join(', ')}</Text>}
                      </View>
                    </View>
                    <View style={s.deviceQtyBox}>
                      <Text style={s.deviceQty}>x{item.expectedQuantity || 1}</Text>
                    </View>
                  </View>
                );
              })}
              {(!snap?.items || snap?.items.length === 0) && (
                <Text style={{ color: '#94A3B8', fontSize: 13, padding: 12 }}>Không có dữ liệu thiết bị.</Text>
              )}
            </View>

            {/* ── SUCCESS / FAIL toggle ── */}
            <View style={s.toggleRow}>
              <TouchableOpacity
                style={[s.toggleBtn, mode === 'SUCCESS' && { backgroundColor: '#059669' }]}
                onPress={() => setMode('SUCCESS')}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                <Text style={s.toggleText}>Giao thành công</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, mode === 'FAILED' && { backgroundColor: '#DC2626' }]}
                onPress={() => setMode('FAILED')}
              >
                <Ionicons name="close-circle-outline" size={16} color="#FFF" />
                <Text style={s.toggleText}>Giao thất bại</Text>
              </TouchableOpacity>
            </View>

            {/* ── SUCCESS form ── */}
            {mode === 'SUCCESS' && (
              <View style={s.successCard}>
                <Text style={s.cardTitle}>Xác nhận giao thành công</Text>
                <Text style={s.fieldLabel}>Tên người nhận xác nhận</Text>
                <TextInput style={s.input} placeholder="Tên người nhận hàng" placeholderTextColor="#64748B" value={confirmerName} onChangeText={setConfirmerName} />
                <Text style={s.fieldLabel}>SĐT người xác nhận</Text>
                <TextInput style={s.input} placeholder="Số điện thoại" placeholderTextColor="#64748B" keyboardType="phone-pad" value={confirmerPhone} onChangeText={setConfirmerPhone} />
                <Text style={s.fieldLabel}>Ghi chú kiểm tra thiết bị/phụ kiện <Text style={{ color: '#10B981' }}>*</Text></Text>
                <TextInput
                  style={[s.textarea, !confirmNote.trim() && { borderColor: '#059669' }]}
                  placeholder="Bắt buộc: Mô tả chi tiết kiểm tra các thiết bị/phụ kiện"
                  placeholderTextColor="#64748B"
                  multiline
                  value={confirmNote}
                  onChangeText={setConfirmNote}
                />
                {!confirmNote.trim() && <Text style={{ color: '#10B981', fontSize: 12, marginTop: 2 }}>⚠ Ghi chú là bắt buộc</Text>}
                <Text style={s.fieldLabel}>Hình ảnh xác nhận</Text>
                <ImageRow images={confirmImages} onAdd={() => pickImage(setConfirmImages)} onRemove={i => setConfirmImages(p => p.filter((_, idx) => idx !== i))} />
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: '#059669', marginTop: 16 }, working && s.disabled]}
                  onPress={handleConfirmSuccess}
                  disabled={working}
                >
                  {working ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnText}>Xác nhận giao thành công</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* ── FAIL form ── */}
            {mode === 'FAILED' && (
              <View style={s.failCard}>
                <Text style={s.cardTitle}>Đánh dấu giao thất bại</Text>
                <Text style={s.fieldLabel}>Lý do thất bại <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <View style={s.chipRow}>
                  {FAIL_REASONS.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      style={[s.chip, failReason === value && s.chipActive]}
                      onPress={() => setFailReason(value)}
                    >
                      <Text style={[s.chipText, failReason === value && s.chipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.fieldLabel}>Ghi chú chi tiết <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <TextInput
                  style={[s.textarea, !failNote.trim() && { borderColor: '#DC2626' }]}
                  placeholder="Bắt buộc: Mô tả chi tiết tại sao giao thất bại"
                  placeholderTextColor="#64748B"
                  multiline
                  value={failNote}
                  onChangeText={setFailNote}
                />
                {!failNote.trim() && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 2 }}>⚠ Ghi chú là bắt buộc</Text>}
                <Text style={s.fieldLabel}>Hình ảnh chứng cứ</Text>
                <ImageRow images={failImages} onAdd={() => pickImage(setFailImages)} onRemove={i => setFailImages(p => p.filter((_, idx) => idx !== i))} />
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: '#DC2626', marginTop: 16 }, working && s.disabled]}
                  onPress={handleFail}
                  disabled={working}
                >
                  {working ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnText}>Xác nhận giao thất bại</Text>}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Lịch sử Attempts */}
        <View style={{ marginTop: 30 }}>
          <Text style={s.sectionTitle}>Lịch sử hoạt động (Attempts)</Text>
          {attempts.length === 0 ? (
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>Chưa có biên bản nào.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {attempts.map((att: any) => (
                <View key={att.id} style={[s.attemptCard, att.failure?.reason && { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.attemptTitle}>Attempt #{att.attemptNo || '?'}</Text>
                    <View style={[s.statusBadge, { backgroundColor: getStatusColor(att.status) }]}>
                      <Text style={s.statusBadgeText}>{att.status}</Text>
                    </View>
                  </View>
                  <Text style={s.attemptSub}>
                    Kết quả: <Text style={{ color: '#F1F5F9' }}>{att.result || '-'}</Text>
                  </Text>
                  {att.failure?.reason && (
                    <Text style={s.attemptSub}>
                      Lý do: <Text style={{ color: '#EF4444' }}>{formatReason(att.failure.reason)}</Text>
                    </Text>
                  )}
                  {att.failure?.operatorNote && (
                    <Text style={[s.attemptSub, { marginTop: 4, fontStyle: 'italic' }]}>
                      Ghi chú: {att.failure.operatorNote}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return '#10B981';
    case 'FAILED': return '#EF4444';
    case 'IN_PROGRESS': return '#3B82F6';
    default: return '#64748B';
  }
}

function formatReason(reason: string) {
  const found = FAIL_REASONS.find(r => r.value === reason);
  return found ? found.label : reason;
}

function ImageRow({ images, onAdd, onRemove }: { images: string[]; onAdd: () => void; onRemove: (i: number) => void }) {
  return (
    <ScrollView horizontal style={{ marginTop: 8 }} showsHorizontalScrollIndicator={false}>
      {images.map((uri, i) => (
        <View key={i} style={{ marginRight: 10, position: 'relative' }}>
          <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
          <TouchableOpacity
            style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 10 }}
            onPress={() => onRemove(i)}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}
        onPress={onAdd}
      >
        <Ionicons name="camera-outline" size={24} color="#94A3B8" />
        <Text style={{ color: '#94A3B8', fontSize: 10, marginTop: 2 }}>Thêm ảnh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 80 },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  infoId: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginBottom: 6 },
  infoSub: { color: '#94A3B8', fontSize: 13, marginTop: 3 },
  finalBox: { alignItems: 'center', paddingVertical: 60 },
  finalText: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 14, borderRadius: 12, marginBottom: 8 },
  switchLabel: { color: '#F1F5F9', fontSize: 14 },
  fieldLabel: { color: '#94A3B8', fontSize: 12, marginTop: 12, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 13, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textarea: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 13, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 80, textAlignVertical: 'top' },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 16 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  toggleText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  successCard: { backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  failCard: { backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  cardTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive: { backgroundColor: 'rgba(239,68,68,0.25)', borderColor: '#EF4444' },
  chipText: { color: '#94A3B8', fontSize: 13 },
  chipTextActive: { color: '#EF4444', fontWeight: '700' },
  deviceList: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 20 },
  deviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  deviceName: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  deviceSerial: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  deviceQtyBox: { backgroundColor: 'rgba(34, 211, 238, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.3)' },
  deviceQty: { color: '#22D3EE', fontWeight: 'bold', fontSize: 13 },
  attemptCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  attemptTitle: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  attemptSub: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});
