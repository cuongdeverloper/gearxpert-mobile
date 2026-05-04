import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, TextInput, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ApiGetReturnByRental, ApiCreateReturnDraft, ApiStartReturn,
  ApiSaveReturnInspection, ApiConfirmReturnByRental, ApiFailReturn,
  ApiCreateReturnRetry, ApiGetHandoverByRental,
} from '../../../src/features/staff/api';
import { ApiGetRentalById } from '../../../src/features/rental/rentalApi';

const RETURN_FAIL_REASONS = [
  { value: 'CUSTOMER_UNAVAILABLE', label: 'Khách vắng mặt / Không liên hệ được' },
  { value: 'WRONG_ADDRESS', label: 'Sai địa chỉ / Không tìm thấy vị trí' },
  { value: 'MISSING_DEVICE', label: 'Khách báo làm mất thiết bị' },
  { value: 'DAMAGED_DEVICE', label: 'Thiết bị hỏng hóc' },
  { value: 'OTHER', label: 'Lý do khác (Bắt buộc nhập ghi chú)' },
];

export default function ReturnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: rentalId } = useLocalSearchParams<{ id: string }>();

  const [record, setRecord] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [rental, setRental] = useState<any>(null);
  const [deliveryRef, setDeliveryRef] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');

  const [checklist, setChecklist] = useState({ customerPresent: false, receivedAtAddress: false, accessoriesChecked: false });
  const [inspectionNote, setInspectionNote] = useState('');
  const [confirmerName, setConfirmerName] = useState('');
  const [confirmerPhone, setConfirmerPhone] = useState('');
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmImages, setConfirmImages] = useState<string[]>([]);
  const [failReason, setFailReason] = useState('');
  const [failNote, setFailNote] = useState('');
  const [failImages, setFailImages] = useState<string[]>([]);

  const hydrateFromAttempt = useCallback((attempt: any) => {
    if (!attempt) return;
    const cl = attempt.inspection?.checklist;
    if (cl) {
      setChecklist({ customerPresent: Boolean(cl.customerPresent), receivedAtAddress: Boolean(cl.receivedAtAddress), accessoriesChecked: Boolean(cl.accessoriesChecked) });
      setInspectionNote(attempt.inspection?.operatorNote || '');
    }
    const snap = attempt.prefetchedSnapshot;
    if (snap?.deliveryAddress?.receiverName) setConfirmerName(snap.deliveryAddress.receiverName);
    if (snap?.phoneNumber) setConfirmerPhone(snap.phoneNumber);
  }, []);

  const resolveAttempt = useCallback(async () => {
    let listRes = await ApiGetReturnByRental(rentalId);
    let records: any[] = listRes?.returnRecords || [];
    
    let active = records.find((x: any) => ['DRAFT', 'IN_PROGRESS'].includes(x.status));
    if (!active) {
      const dr = await ApiCreateReturnDraft(rentalId);
      if (!dr?.success) return null;
      active = dr.returnRecord;
      // Re-fetch to include the newly created draft in attempts history
      listRes = await ApiGetReturnByRental(rentalId);
      records = listRes?.returnRecords || [];
    }
    setAttempts(records);
    
    if (active?.status === 'DRAFT') {
      const sr = await ApiStartReturn(active.id);
      if (sr?.success) active = sr.returnRecord;
    }
    return active;
  }, [rentalId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attempt, handoverRes, rentalRes] = await Promise.all([
        resolveAttempt(),
        ApiGetHandoverByRental(rentalId),
        ApiGetRentalById(rentalId),
      ]);
      if (attempt) { setRecord(attempt); hydrateFromAttempt(attempt); }
      else Alert.alert('Lỗi', 'Không thể khởi tạo biên bản thu hồi.');
      
      if (rentalRes?.success || rentalRes?.rental) {
        setRental(rentalRes.rental || rentalRes);
      }

      // Tìm biên bản bàn giao thành công gần nhất (giống fetchDeliveryReference bên web)
      const handovers: any[] = handoverRes?.handovers || [];
      const latestSuccess = handovers.find((h: any) => h.status === 'COMPLETED' && h.result === 'SUCCESS') || handovers.find((h: any) => h.status === 'COMPLETED') || null;
      setDeliveryRef(latestSuccess);
    } catch { Alert.alert('Lỗi', 'Lỗi kết nối mạng.'); }
    finally { setIsLoading(false); }
  }, [resolveAttempt, hydrateFromAttempt, rentalId]);

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

  const buildInspectionPayload = (attempt: any) => ({
    checklist: { ...checklist },
    items: attempt?.inspection?.items || attempt?.prefetchedSnapshot?.items || [],
    operatorNote: inspectionNote,
    evidenceUrls: [],
  });

  const handleSaveInspection = async () => {
    if (!record?.id) return;
    setWorking(true);
    try {
      const res = await ApiSaveReturnInspection(record.id, buildInspectionPayload(record));
      if (res?.success) { Alert.alert('Thành công', 'Đã lưu kiểm tra.'); load(); }
      else Alert.alert('Lỗi', res?.message || 'Không lưu được');
    } catch { Alert.alert('Lỗi', 'Lỗi kết nối'); }
    finally { setWorking(false); }
  };

  // Web dùng POST /api/rentals/:rentalId/confirm-return (không phải returnRecord endpoint)
  const handleConfirmSuccess = async () => {
    if (!confirmNote.trim()) { Alert.alert('Lỗi', 'Vui lòng ghi chú chi tiết kiểm tra khi thu hồi.'); return; }
    setWorking(true);
    try {
      const attempt = await resolveAttempt();
      if (!attempt) { Alert.alert('Lỗi', 'Không thể chuẩn bị biên bản.'); return; }
      const formData = new FormData();
      formData.append('inspection', JSON.stringify({ ...buildInspectionPayload(attempt), evidenceUrls: [] }));
      formData.append('settlement', JSON.stringify({ operatorNote: confirmNote.trim() }));
      appendImages(formData, confirmImages);
      const res = await ApiConfirmReturnByRental(rentalId, formData);
      if (res?.success || res?.status === 'COMPLETED' || res?.message?.toLowerCase()?.includes('thành công')) {
        Alert.alert('Thành công', 'Xác nhận thu hồi thành công. Đơn đã hoàn tất.', [{ text: 'OK', onPress: () => router.back() }]);
      } else Alert.alert('Lỗi', res?.message || 'Không thể xác nhận thu hồi');
    } catch { Alert.alert('Lỗi', 'Lỗi kết nối'); }
    finally { setWorking(false); }
  };

  const handleFail = async () => {
    if (!failReason) { Alert.alert('Lỗi', 'Vui lòng chọn lý do thất bại.'); return; }
    if (!failNote.trim()) { Alert.alert('Lỗi', 'Ghi chú chi tiết là bắt buộc.'); return; }
    setWorking(true);
    try {
      const attempt = await resolveAttempt();
      if (!attempt) { Alert.alert('Lỗi', 'Không thể chuẩn bị biên bản.'); return; }
      const formData = new FormData();
      formData.append('inspection', JSON.stringify(buildInspectionPayload(attempt)));
      formData.append('failure', JSON.stringify({ reason: failReason, detail: failNote, operatorNote: failNote, evidenceUrls: [] }));
      appendImages(formData, failImages);
      const res = await ApiFailReturn(attempt.id, formData);
      if (res?.success || res?.status === 'FAILED' || res?.message?.toLowerCase()?.includes('thành công')) {
        Alert.alert('Thành công', 'Đã ghi nhận thu hồi thất bại.', [{ text: 'OK', onPress: () => router.back() }]);
        load();
      }
      else Alert.alert('Lỗi', res?.message || 'Không thể ghi nhận thất bại');
    } catch { Alert.alert('Lỗi', 'Lỗi kết nối'); }
    finally { setWorking(false); }
  };

  const handleRetry = async () => {
    setWorking(true);
    try {
      const res = await ApiCreateReturnRetry(rentalId);
      if (res?.success) { Alert.alert('Thành công', 'Đã tạo attempt thu hồi lại mới.'); load(); }
      else Alert.alert('Lỗi', res?.message || 'Không thể tạo attempt mới');
    } catch { Alert.alert('Lỗi', 'Lỗi kết nối'); }
    finally { setWorking(false); }
  };

  const snap = record?.prefetchedSnapshot;
  const rentalItems = rental?.rentalItems || snap?.items || [];
  const deliveryOperatorNote = deliveryRef?.inspection?.operatorNote?.trim() || deliveryRef?.customerConfirmation?.operatorNote?.trim() || '';
  const deliveryImages: string[] = (() => { const src = deliveryRef?.customerConfirmation?.signatureUrls || deliveryRef?.customerConfirmation?.signatureUrl || []; return Array.isArray(src) ? src.filter(Boolean) : [src].filter(Boolean); })();
  const isFinal = ['COMPLETED', 'FAILED', 'VOID', 'ISSUE_REPORTED'].includes(record?.status);

  if (isLoading) return (
    <View style={s.screen}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={s.headerTitle}>Biên Bản Thu Hồi</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.center}><ActivityIndicator size="large" color="#FCD34D" /></View>
    </View>
  );

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={s.headerTitle}>Biên Bản Thu Hồi</Text>
        <TouchableOpacity onPress={load} style={s.backBtn}><Ionicons name="refresh" size={20} color="#FFF" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Info */}
        <View style={s.infoCard}>
          <Text style={s.infoId}>#{record?.id?.substring(0, 8)} · <Text style={{ color: '#FCD34D' }}>{record?.status}</Text></Text>
          {snap?.deliveryAddress?.fullAddress ? <Text style={s.infoSub}><Ionicons name="location-outline" size={13} /> {snap.deliveryAddress.fullAddress}</Text> : null}
          {snap?.phoneNumber ? <Text style={s.infoSub}><Ionicons name="call-outline" size={13} /> {snap.phoneNumber}</Text> : null}
        </View>

        {isFinal ? (
          <View style={s.finalBox}>
            <Ionicons name={record?.status === 'COMPLETED' ? 'checkmark-circle' : 'close-circle'} size={56} color={record?.status === 'COMPLETED' ? '#10B981' : '#EF4444'} />
            <Text style={[s.finalText, { color: record?.status === 'COMPLETED' ? '#10B981' : '#EF4444' }]}>
              {record?.status === 'COMPLETED' ? 'Thu hồi thành công!' : `Biên bản ${record?.status}`}
            </Text>
            {(record?.status === 'FAILED') && (
              <TouchableOpacity style={[s.btn, { backgroundColor: '#F59E0B', marginTop: 24, width: '100%' }, working && s.disabled]} onPress={handleRetry} disabled={working}>
                {working ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnText}>Tạo attempt thu hồi lại</Text>}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 16 }}>
              <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#334155' }, working && s.disabled]} onPress={handleSaveInspection} disabled={working}>
                {working ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnText}>Lưu kiểm tra</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#92400E' }, working && s.disabled]} onPress={handleRetry} disabled={working}>
                <Text style={[s.btnText, { fontSize: 12 }]}>Tạo attempt lại</Text>
              </TouchableOpacity>
            </View>

            {/* Device Checklist */}
            <Text style={s.sectionTitle}>Danh sách thiết bị giao ({rentalItems.length})</Text>
            <View style={s.deviceList}>
              {rentalItems.map((item: any, i: number) => {
                const serials = item.expectedSerialNumbers || item.deviceItemIds?.map((di: any) => di.serialNumber).filter(Boolean) || item.deliveredSerialNumbers || [];
                return (
                  <View key={i} style={s.deviceItem}>
                    <View style={s.deviceInfo}>
                      <Ionicons name="cube-outline" size={20} color="#94A3B8" />
                      <View style={{ flex: 1 }}>
                        <Text style={s.deviceName}>{item.deviceName || item.deviceId?.name || item.name || 'Thiết bị'}</Text>
                        {serials.length > 0 && <Text style={s.deviceSerial}>Serial: {serials.join(', ')}</Text>}
                      </View>
                    </View>
                    <View style={s.deviceQtyBox}>
                      <Text style={s.deviceQty}>x{item.expectedQuantity || item.quantity || 1}</Text>
                    </View>
                  </View>
                );
              })}
              {rentalItems.length === 0 && (
                <Text style={{ color: '#94A3B8', fontSize: 13, padding: 12 }}>Không có thiết bị nào trong đơn hàng.</Text>
              )}
            </View>

            {/* Đối chiếu biên bản bàn giao (giống web) */}
            <View style={s.refCard}>
              <Text style={s.refTitle}>Đối chiếu từ biên bản bàn giao</Text>
              <Text style={s.fieldLabel}>Ghi chú kiểm tra thiết bị/phụ kiện</Text>
              <View style={s.refNote}>
                <Text style={{ color: '#CBD5E1', fontSize: 13 }}>{deliveryOperatorNote || 'Chưa có ghi chú từ biên bản bàn giao.'}</Text>
              </View>
              {deliveryImages.length > 0 && (
                <>
                  <Text style={s.fieldLabel}>Hình ảnh xác nhận bàn giao</Text>
                  <ScrollView horizontal style={{ marginTop: 6 }}>
                    {deliveryImages.map((url: string, i: number) => (
                      <Image key={i} source={{ uri: url }} style={{ width: 90, height: 90, borderRadius: 10, marginRight: 10 }} />
                    ))}
                  </ScrollView>
                </>
              )}
            </View>

            {/* SUCCESS / FAIL toggle */}
            <View style={s.toggleRow}>
              <TouchableOpacity style={[s.toggleBtn, mode === 'SUCCESS' && { backgroundColor: '#059669' }]} onPress={() => setMode('SUCCESS')}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                <Text style={s.toggleText}>Thu hồi thành công</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.toggleBtn, mode === 'FAILED' && { backgroundColor: '#DC2626' }]} onPress={() => setMode('FAILED')}>
                <Ionicons name="close-circle-outline" size={16} color="#FFF" />
                <Text style={s.toggleText}>Thu hồi thất bại</Text>
              </TouchableOpacity>
            </View>

            {mode === 'SUCCESS' && (
              <View style={s.successCard}>
                <Text style={s.cardTitle}>Xác nhận thu hồi thành công</Text>
                <Text style={s.fieldLabel}>Tên người trả thiết bị</Text>
                <TextInput style={s.input} placeholder="Mặc định lấy từ đơn hàng" placeholderTextColor="#64748B" value={confirmerName} onChangeText={setConfirmerName} />
                <Text style={s.fieldLabel}>SĐT liên hệ</Text>
                <TextInput style={s.input} placeholder="SĐT người xác nhận" placeholderTextColor="#64748B" keyboardType="phone-pad" value={confirmerPhone} onChangeText={setConfirmerPhone} />
                <Text style={s.fieldLabel}>Ghi chú kiểm tra thu hồi <Text style={{ color: '#10B981' }}>*</Text></Text>
                <TextInput style={[s.textarea, !confirmNote.trim() && { borderColor: '#059669' }]} placeholder="Bắt buộc: Mô tả chi tiết kiểm tra khi thu hồi" placeholderTextColor="#64748B" multiline value={confirmNote} onChangeText={setConfirmNote} />
                {!confirmNote.trim() && <Text style={{ color: '#10B981', fontSize: 12, marginTop: 2 }}>⚠ Ghi chú là bắt buộc</Text>}
                <Text style={s.fieldLabel}>Hình ảnh xác nhận</Text>
                <ImageRow images={confirmImages} onAdd={() => pickImage(setConfirmImages)} onRemove={i => setConfirmImages(p => p.filter((_, idx) => idx !== i))} />
                <TouchableOpacity style={[s.btn, { backgroundColor: '#059669', marginTop: 16 }, working && s.disabled]} onPress={handleConfirmSuccess} disabled={working}>
                  {working ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnText}>Xác nhận thu hồi thành công</Text>}
                </TouchableOpacity>
              </View>
            )}

            {mode === 'FAILED' && (
              <View style={s.failCard}>
                <Text style={s.cardTitle}>Đánh dấu thu hồi thất bại</Text>
                <Text style={s.fieldLabel}>Lý do thất bại <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <View style={s.chipRow}>
                  {RETURN_FAIL_REASONS.map(({ value, label }) => (
                    <TouchableOpacity key={value} style={[s.chip, failReason === value && s.chipActive]} onPress={() => setFailReason(value)}>
                      <Text style={[s.chipText, failReason === value && s.chipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.fieldLabel}>Ghi chú chi tiết <Text style={{ color: '#EF4444' }}>*</Text></Text>
                <TextInput style={[s.textarea, !failNote.trim() && { borderColor: '#DC2626' }]} placeholder="Bắt buộc: Mô tả chi tiết tại sao thu hồi thất bại" placeholderTextColor="#64748B" multiline value={failNote} onChangeText={setFailNote} />
                {!failNote.trim() && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 2 }}>⚠ Ghi chú là bắt buộc</Text>}
                <Text style={s.fieldLabel}>Hình ảnh chứng cứ</Text>
                <ImageRow images={failImages} onAdd={() => pickImage(setFailImages)} onRemove={i => setFailImages(p => p.filter((_, idx) => idx !== i))} />
                <TouchableOpacity style={[s.btn, { backgroundColor: '#DC2626', marginTop: 16 }, working && s.disabled]} onPress={handleFail} disabled={working}>
                  {working ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnText}>Xác nhận thu hồi thất bại</Text>}
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
  const found = RETURN_FAIL_REASONS.find(r => r.value === reason);
  return found ? found.label : reason;
}

function ImageRow({ images, onAdd, onRemove }: { images: string[]; onAdd: () => void; onRemove: (i: number) => void }) {
  return (
    <ScrollView horizontal style={{ marginTop: 8 }} showsHorizontalScrollIndicator={false}>
      {images.map((uri, i) => (
        <View key={i} style={{ marginRight: 10, position: 'relative' }}>
          <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
          <TouchableOpacity style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 10 }} onPress={() => onRemove(i)}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }} onPress={onAdd}>
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
  infoCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  infoId: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginBottom: 6 },
  infoSub: { color: '#94A3B8', fontSize: 13, marginTop: 3 },
  deviceList: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 20 },
  deviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  deviceName: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  deviceSerial: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  deviceQtyBox: { backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  deviceQty: { color: '#60A5FA', fontWeight: 'bold', fontSize: 13 },
  finalBox: { alignItems: 'center', paddingVertical: 60 },
  finalText: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 14, borderRadius: 12, marginBottom: 8 },
  switchLabel: { color: '#F1F5F9', fontSize: 14 },
  fieldLabel: { color: '#94A3B8', fontSize: 12, marginTop: 12, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 13, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textarea: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 13, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 80, textAlignVertical: 'top' },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  refCard: { backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 16, padding: 14, marginTop: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)' },
  refTitle: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  refNote: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginTop: 6, minHeight: 60 },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 16 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  toggleText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  successCard: { backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  failCard: { backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  cardTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive: { backgroundColor: 'rgba(239,68,68,0.25)', borderColor: '#EF4444' },
  chipText: { color: '#94A3B8', fontSize: 12 },
  chipTextActive: { color: '#EF4444', fontWeight: '700' },
  attemptCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  attemptTitle: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  attemptSub: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});
