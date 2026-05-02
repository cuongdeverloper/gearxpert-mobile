import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiRequestWithdraw } from '../../../src/features/wallet/api';

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [searchBank, setSearchBank] = useState('');

  React.useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch("https://api.vietqr.io/v2/banks");
      const data = await res.json();
      if (data.code === "00") {
        setBanks(data.data);
      }
    } catch (err) {
      console.error("Error fetching banks:", err);
    }
  };

  const filteredBanks = banks.filter(bank => 
    bank.shortName.toLowerCase().includes(searchBank.toLowerCase()) || 
    bank.name.toLowerCase().includes(searchBank.toLowerCase())
  );

  const handleWithdraw = async () => {
    const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }
    if (!bankName || !bankAccountName || !bankAccountNumber) {
      Alert.alert("Error", "Please fill in all bank details.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await ApiRequestWithdraw({
        amount: numericAmount,
        bankInfo: {
          bankName,
          accountName: bankAccountName,
          accountNumber: bankAccountNumber
        }
      } as any);
      if (res && (res.success || res.errorCode === 0)) {
        Alert.alert("Success", "Withdrawal request submitted successfully.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Error", res.message || "Failed to submit withdrawal request");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/wallet' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Withdrawal Amount (VND)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9]/g, '');
              if (numeric) {
                setAmount(new Intl.NumberFormat('vi-VN').format(parseInt(numeric, 10)));
              } else {
                setAmount('');
              }
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#64748B"
          />
          <Text style={styles.currency}>VND</Text>
        </View>

        <Text style={styles.sectionTitle}>Bank Details</Text>
        
        <Text style={styles.label}>Bank Name</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => setShowBankPicker(true)}
        >
          <Text style={{ color: bankName ? '#FFF' : '#64748B', lineHeight: 50 }}>
            {bankName || 'Select bank'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#94A3B8" style={{ position: 'absolute', right: 16, top: 15 }} />
        </TouchableOpacity>

        <Text style={styles.label}>Account Name</Text>
        <TextInput
          style={styles.input}
          value={bankAccountName}
          onChangeText={(text) => {
            // Remove accents and convert to uppercase
            const nonAccented = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
            setBankAccountName(nonAccented);
          }}
          placeholder="e.g. NGUYEN VAN A"
          placeholderTextColor="#64748B"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Account Number</Text>
        <TextInput
          style={styles.input}
          value={bankAccountNumber}
          onChangeText={setBankAccountNumber}
          placeholder="e.g. 1234567890"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={[styles.submitButton, (!amount || !bankName || !bankAccountName || !bankAccountNumber || isLoading) && { opacity: 0.5 }]} 
          onPress={handleWithdraw}
          disabled={!amount || !bankName || !bankAccountName || !bankAccountNumber || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Request</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Bank Picker Modal */}
      <Modal visible={showBankPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Ionicons name="close" size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.bankSearch}
              placeholder="Search bank name..."
              placeholderTextColor="#64748B"
              value={searchBank}
              onChangeText={setSearchBank}
            />
            <FlatList
              data={filteredBanks}
              keyExtractor={(item: any) => item.bin}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity 
                  style={styles.bankItem}
                  onPress={() => {
                    setBankName(item.shortName);
                    setShowBankPicker(false);
                  }}
                >
                  <Text style={styles.bankShortName}>{item.shortName}</Text>
                  <Text style={styles.bankFullName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  content: { padding: 20 },
  label: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, height: 60, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  amountInput: { flex: 1, color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  currency: { color: '#94A3B8', fontSize: 16, fontWeight: 'bold' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#FFF' },
  submitButton: { backgroundColor: '#FCD34D', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  submitText: { color: '#0F172A', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  bankSearch: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, height: 50, color: '#FFF', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bankItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  bankShortName: { color: '#22D3EE', fontWeight: 'bold', fontSize: 16 },
  bankFullName: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
});
