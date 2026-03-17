// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';
import { removeToken } from '../../src/shared/utils/storage';

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await removeToken();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World - GearXpert Home</Text>
      <Button title="Đăng xuất" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 }
});
