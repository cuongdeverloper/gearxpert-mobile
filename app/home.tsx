// app/home.tsx
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { removeToken } from '../src/shared/utils/storage';

export default function Homepage() {
  const router = useRouter();

  const handleLogout = async () => {
    await removeToken();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang chủ GearXpert</Text>
      <Text style={styles.subtitle}>Xin chào, Khách hàng!</Text>

      <View style={styles.menuContainer}>


        <TouchableOpacity 
          style={styles.menuBtn} 
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.btnText}>Cài đặt tài khoản</Text>
        </TouchableOpacity>
      </View>

      {/* Nút Đăng xuất */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  menuContainer: { flex: 1, gap: 15 },
  menuBtn: { backgroundColor: '#f0f4f8', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e1e8ed' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#007bff' },
  logoutBtn: { backgroundColor: '#ff4d4f', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
