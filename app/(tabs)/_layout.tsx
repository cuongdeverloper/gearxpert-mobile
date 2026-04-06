// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar — we use BottomNav component
        animation: 'none', // Instant switch — no slide animation between tabs
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="blog" />
      <Tabs.Screen name="shops" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="messenger" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="vouchers" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}