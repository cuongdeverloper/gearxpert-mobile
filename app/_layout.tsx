// app/_layout.tsx
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { FavoriteProvider } from '../src/context/FavoriteContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { getRememberMe, removeToken } from '../src/shared/utils/storage';

import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isAuthenticated, isAuthChecked, checkAuth, user, logout } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const [isInitialAppLaunch, setIsInitialAppLaunch] = useState(true);

  // Initial boot-up sequence
  useEffect(() => {
    const initApp = async () => {
      try {
        const rememberMe = await getRememberMe();
        if (!rememberMe) {
          await removeToken();
        }
        await checkAuth();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsInitialAppLaunch(false);
        await SplashScreen.hideAsync();
      }
    };
    initApp();
  }, []);

  // Sync auth state whenever path changes (covers deep links, etc.)
  useEffect(() => {
    if (!isInitialAppLaunch) {
        checkAuth();
    }
  }, [segments.join('/')]);

  // Redirection logic
  useEffect(() => {
    if (!rootNavigationState?.key || !isAuthChecked || isInitialAppLaunch) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && user) {
      if (user.role === 'OPERATION_STAFF') {
        if (inAuthGroup || segments[0] === '(tabs)') {
          router.replace('/staff/dashboard');
        }
      } else if (user.role === 'CUSTOMER') {
        if (inAuthGroup || segments[0] === 'staff') {
          router.replace('/(tabs)/home');
        }
      } else {
        Alert.alert("Thông báo", "App mobile hiện chỉ hỗ trợ Customer và Staff");
        logout();
      }
    }
  }, [isAuthenticated, isAuthChecked, isInitialAppLaunch, segments, rootNavigationState?.key, user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

import { SocketProvider } from '../src/context/SocketContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <FavoriteProvider>
          <RootLayoutContent />
        </FavoriteProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
