// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { indexStyles as styles } from '../../src/styles/screens/index.styles';

export default function HomeScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World - GearXpert Home</Text>
      <Button title="Đăng xuất" onPress={handleLogout} />
    </View>
  );
}
