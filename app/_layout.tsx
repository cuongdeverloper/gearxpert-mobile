// app/_layout.tsx
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { getToken } from '../src/shared/utils/storage';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const segments = useSegments();
  const router = useRouter();
  
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthChecked(false);
      try {
        const token = await getToken();
        setIsAuthenticated(!!token);
      } finally {
        setIsAuthChecked(true);
      }
    };
    checkAuth();
  }, [segments.join('/')]);

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (!isAuthChecked) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/home');
    }
  }, [isAuthenticated, segments, rootNavigationState?.key, isAuthChecked]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
