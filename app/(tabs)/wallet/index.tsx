import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiGetMyWallet, ApiGetTransactions } from '../../../src/features/wallet/api';
import { ApiGetCurrentUser } from '../../../src/features/auth/api';
import { getToken } from '../../../src/shared/utils/storage';

export default function WalletDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ income: 0, outcome: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }
        const [walletRes, transRes] = await Promise.all([
          ApiGetMyWallet(),
          ApiGetTransactions()
        ]);

        if (walletRes && walletRes.balance !== undefined) {
          setBalance(walletRes.balance || 0);
        }
        if (transRes && Array.isArray(transRes)) {
          setTransactions(transRes);
          // Simple stats
          const income = transRes.filter((t: any) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
          const outcome = transRes.filter((t: any) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
          setStats({ income, outcome });
        }
        if (token) {
          const profile = await ApiGetCurrentUser(token);
          if (profile && profile.user) setUserProfile(profile.user);
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

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <View style={[styles.iconBox, { backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name={iconName} size={20} color={color} />
          </View>
          <View>
            <Text style={styles.transactionType}>{label}</Text>
            <Text style={styles.transactionDate}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color }]}>{sign} {formatCurrency(Math.abs(item.amount))}</Text>
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
        <Text style={styles.headerTitle}>Ví của tôi</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={transactions.slice(0, 5)}
        keyExtractor={(item: any) => item._id}
        renderItem={renderTransaction}
        ListHeaderComponent={
          <>
            <View style={styles.balanceContainer}>
              <BlurView intensity={30} tint="dark" style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => {
                      if (userProfile && !userProfile.isVerifiedEkyc) {
                        Alert.alert("Yêu cầu eKYC", "Vui lòng hoàn tất eKYC trong tab Hồ sơ để nạp tiền.");
                        return;
                      }
                      router.push('/(tabs)/wallet/topup' as any);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={24} color="#22D3EE" />
                    <Text style={styles.actionButtonText}>Nạp tiền</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => {
                      if (userProfile && !userProfile.isVerifiedEkyc) {
                        Alert.alert("Yêu cầu eKYC", "Vui lòng hoàn tất eKYC trong tab Hồ sơ để rút tiền.");
                        return;
                      }
                      router.push('/(tabs)/wallet/withdraw' as any);
                    }}
                  >
                    <Ionicons name="cash-outline" size={24} color="#FCD34D" />
                    <Text style={styles.actionButtonText}>Rút tiền</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>

            <View style={styles.statsRow}>
              <BlurView intensity={20} tint="dark" style={styles.statBox}>
                <View style={styles.statIconIn}><Ionicons name="trending-up" size={16} color="#10B981" /></View>
                <View>
                  <Text style={styles.statText}>Thu nhập</Text>
                  <Text style={styles.statAmountIn}>{formatCurrency(stats.income)}</Text>
                </View>
              </BlurView>
              <BlurView intensity={20} tint="dark" style={styles.statBox}>
                <View style={styles.statIconOut}><Ionicons name="trending-down" size={16} color="#EF4444" /></View>
                <View>
                  <Text style={styles.statText}>Chi tiêu</Text>
                  <Text style={styles.statAmountOut}>{formatCurrency(stats.outcome)}</Text>
                </View>
              </BlurView>
            </View>

            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/wallet/transactions' as any)}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có giao dịch nào.</Text>}
        showsVerticalScrollIndicator={false}
      />
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
  actionButtonText: { color: '#FFF', marginTop: 8, fontSize: 13, fontWeight: '500' },
  transactionsContainer: { flex: 1 },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '600' },
  seeAllText: { color: '#22D3EE', fontSize: 14 },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionType: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  transactionDate: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 20 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statBox: { flex: 1, padding: 12, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  statIconIn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statIconOut: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statText: { color: '#94A3B8', fontSize: 12 },
  statAmountIn: { color: '#10B981', fontSize: 14, fontWeight: 'bold' },
  statAmountOut: { color: '#EF4444', fontSize: 14, fontWeight: 'bold' },
});
