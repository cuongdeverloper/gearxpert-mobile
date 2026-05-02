import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetTransactions } from '../../../src/features/wallet/api';

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const transRes = await ApiGetTransactions();
        if (transRes && Array.isArray(transRes)) {
          setTransactions(transRes);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isCredit = item.amount > 0;
    const sign = isCredit ? '+' : '-';
    const color = isCredit ? '#10B981' : '#EF4444';

    let label = item.type;
    let iconName: any = 'swap-horizontal-outline';

    switch (item.type) {
      case 'TOP_UP': 
        label = 'Nạp tiền'; 
        iconName = 'add-circle-outline'; 
        break;
      case 'WITHDRAW': 
        label = 'Rút tiền'; 
        iconName = 'arrow-up-outline'; 
        break;
      case 'PAYMENT': 
        label = 'Thanh toán thuê'; 
        iconName = 'cart-outline'; 
        break;
      case 'REFUND': 
        label = 'Hoàn tiền'; 
        iconName = 'refresh-outline'; 
        break;
      case 'DEPOSIT_REFUND': 
        label = 'Hoàn tiền cọc'; 
        iconName = 'shield-checkmark-outline'; 
        break;
    }

    const statusLabel = item.status === 'SUCCESS' ? 'Thành công' : item.status === 'PENDING' ? 'Chờ duyệt' : 'Thất bại';
    const statusColor = item.status === 'SUCCESS' ? '#10B981' : item.status === 'PENDING' ? '#FCD34D' : '#EF4444';

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <View style={[styles.iconBox, { backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name={iconName} size={24} color={color} />
          </View>
          <View>
            <Text style={styles.transactionType}>{label}</Text>
            <Text style={styles.transactionDate}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.transactionAmount, { color }]}>{sign} {formatCurrency(Math.abs(item.amount))}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/wallet' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#22D3EE" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item: any) => item._id}
          renderItem={renderTransaction}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionType: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  transactionDate: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  statusText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
