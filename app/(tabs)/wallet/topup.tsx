import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiTopUpWallet } from '../../../src/features/wallet/api';
import * as WebBrowser from 'expo-web-browser';

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTopUp = async () => {
    const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await ApiTopUpWallet(numericAmount);
      if ((res && res.success && res.data?.checkoutUrl) || (res && res.errorCode === 0 && res.data?.checkoutUrl)) {
        // Open payment URL in browser
        await WebBrowser.openBrowserAsync(res.data.checkoutUrl);
        // User closed browser, go back to wallet dashboard
        router.navigate('/(tabs)/wallet' as any);
      } else {
        Alert.alert("Error", res.message || "Failed to create top-up request");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const presetAmounts = [50000, 100000, 200000, 500000, 1000000];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/wallet' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Enter Amount (VND)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
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

        <View style={styles.presetsContainer}>
          {presetAmounts.map((preset) => (
            <TouchableOpacity 
              key={preset} 
              style={styles.presetButton}
              onPress={() => setAmount(new Intl.NumberFormat('vi-VN').format(preset))}
            >
              <Text style={styles.presetText}>{new Intl.NumberFormat('vi-VN').format(preset)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, (!amount || isLoading) && { opacity: 0.5 }]} 
          onPress={handleTopUp}
          disabled={!amount || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Continue to Payment</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  content: { padding: 20 },
  label: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, height: 60, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  currency: { color: '#94A3B8', fontSize: 16, fontWeight: 'bold' },
  presetsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  presetButton: { backgroundColor: 'rgba(34, 211, 238, 0.1)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.3)' },
  presetText: { color: '#22D3EE', fontSize: 14, fontWeight: '500' },
  submitButton: { backgroundColor: '#22D3EE', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#0F172A', fontSize: 16, fontWeight: 'bold' },
});
