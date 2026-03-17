// app/(tabs)/settings.tsx
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { removeToken } from '../../src/shared/utils/storage';

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await removeToken();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Màn hình Cài đặt & Hồ sơ</Text>
      
      {/* Nút đăng xuất */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  text: { fontSize: 18, marginBottom: 30, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#ff4d4f', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
