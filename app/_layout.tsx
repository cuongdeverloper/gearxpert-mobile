// app/_layout.tsx
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { FavoriteProvider } from '../src/context/FavoriteContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { getRememberMe, removeToken } from '../src/shared/utils/storage';

function RootLayoutContent() {
  const { isAuthenticated, isAuthChecked, checkAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const [isInitialAppLaunch, setIsInitialAppLaunch] = useState(true);

  // Initial boot-up sequence
  useEffect(() => {
    const initApp = async () => {
      const rememberMe = await getRememberMe();
      if (!rememberMe) {
        await removeToken();
      }
      await checkAuth();
      setIsInitialAppLaunch(false);
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
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isAuthChecked, isInitialAppLaunch, segments, rootNavigationState?.key]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FavoriteProvider>
        <RootLayoutContent />
      </FavoriteProvider>
    </AuthProvider>
  );
}
