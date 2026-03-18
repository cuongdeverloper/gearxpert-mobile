// src/components/BottomNav.tsx
import { StyleSheet, View, TouchableOpacity, Platform, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

type TabId = 'home' | 'search' | 'scan' | 'calendar' | 'profile';

const TABS: { id: TabId; icon: string; activeIcon: string; route: string }[] = [
  { id: 'home',     icon: 'home-outline',     activeIcon: 'home',     route: '/(tabs)/home' },
  { id: 'scan',   icon: 'scan-outline',   activeIcon: 'scan',   route: '' },
  { id: 'search',     icon: 'search-outline',     activeIcon: 'search',     route: '/(tabs)/products' },
  { id: 'calendar', icon: 'calendar-outline', activeIcon: 'calendar', route: '/(tabs)/calendar' },
  { id: 'profile',  icon: 'person-outline',   activeIcon: 'person',   route: '/(tabs)/profile' },
];

function AnimatedTabItem({ tab, isActive, onPress }: { tab: typeof TABS[0], isActive: boolean, onPress: () => void }) {
  const animValue = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 50,
    }).start();
  }, [isActive]);

  const iconScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.15],
  });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Ionicons
          name={(isActive ? tab.activeIcon : tab.icon) as any}
          size={24}
          color={isActive ? '#6366F1' : '#64748B'}
        />
      </Animated.View>
      <Animated.View style={[styles.indicator, { opacity: animValue, transform: [{ scale: animValue }] }]} />
    </TouchableOpacity>
  );
}

interface BottomNavProps {
  activeTab?: TabId;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const resolvedActive: TabId =
    activeTab ??
    (TABS.find(t => t.route && pathname.startsWith(t.route))?.id || 'home');

  const handlePress = (tab: typeof TABS[number]) => {
    if (!tab.route) return; // scan button — no navigation yet
    if (pathname !== tab.route) {
      router.push(tab.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map(tab => {
          const isActive = resolvedActive === tab.id;
          const isCenter = tab.id === 'search';

          if (isCenter) {
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.centerWrapper}
                activeOpacity={0.85}
                onPress={() => handlePress(tab)}
              >
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.centerButton}
                >
                  <Ionicons name="search-outline" size={24} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <AnimatedTabItem
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => handlePress(tab)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#1A1F35',
    borderRadius: 40,
    height: 70,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6366F1',
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    elevation: 10,
  },
});
