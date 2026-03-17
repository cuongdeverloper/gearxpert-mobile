import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#007bff', 
      headerShown: true 
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />
        }} 
      />
      
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}