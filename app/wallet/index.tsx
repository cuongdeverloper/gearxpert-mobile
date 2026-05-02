import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetMyWallet, ApiGetTransactions } from '../../src/features/wallet/api';

export default function WalletDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const walletRes = await ApiGetMyWallet();
        if (walletRes && walletRes.errorCode === 0) {
          setBalance(walletRes.data?.balance || 0);
        }
        const transRes = await ApiGetTransactions();
        if (transRes && transRes.errorCode === 0) {
          setTransactions(transRes.data || []);
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  const renderTransaction = ({ item }: { item: any }) => {
    const isCredit = item.type === 'TOP_UP' || item.type === 'REFUND';
    const sign = isCredit ? '+' : '-';
    const color = isCredit ? '#10B981' : '#EF4444';
    const iconName = item.type === 'TOP_UP' ? 'arrow-down-outline' : item.type === 'WITHDRAWAL' ? 'arrow-up-outline' : 'swap-horizontal-outline';

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <View style={[styles.iconBox, { backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name={iconName} size={20} color={color} />
          </View>
          <View>
            <Text style={styles.transactionType}>{item.type}</Text>
            <Text style={styles.transactionDate}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color }]}>{sign} {formatCurrency(item.amount)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.balanceContainer}>
        <BlurView intensity={30} tint="dark" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wallet/topup')}>
              <Ionicons name="add-circle-outline" size={24} color="#22D3EE" />
              <Text style={styles.actionButtonText}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wallet/withdraw')}>
              <Ionicons name="cash-outline" size={24} color="#FCD34D" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/wallet/transactions')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={transactions.slice(0, 5)}
          keyExtractor={(item: any) => item._id}
          renderItem={renderTransaction}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  balanceContainer: { paddingHorizontal: 20, marginBottom: 24 },
  balanceCard: { padding: 24, borderRadius: 24, overflow: 'hidden', alignItems: 'center' },
  balanceLabel: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginBottom: 24 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  actionButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16 },
  actionButtonText: { color: '#FFF', marginTop: 8, fontSize: 14, fontWeight: '500' },
  transactionsContainer: { flex: 1, paddingHorizontal: 20 },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '600' },
  seeAllText: { color: '#22D3EE', fontSize: 14 },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionType: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  transactionDate: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 20 },
});
