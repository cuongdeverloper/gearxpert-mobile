import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ApiGetUserFavorites, ApiGetFavoriteDeviceIds, ApiToggleFavorite } from '../features/equipment/favoriteApi';
import { getToken } from '../shared/utils/storage';

interface FavoriteContextType {
  favoriteIds: string[];
  toggleFavorite: (deviceId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoriteContext = createContext<FavoriteContextType>({
  favoriteIds: [],
  toggleFavorite: async () => {},
  refreshFavorites: async () => {},
});

export const FavoriteProvider = ({ children }: { children: React.ReactNode }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const refreshFavorites = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const res = await ApiGetUserFavorites(token);
      const list = res?.favorites || res?.data?.favorites || [];
      const ids = list.map((f: any) => {
        if (typeof f === 'string') return f;
        if (f.deviceId && typeof f.deviceId === 'string') return f.deviceId;
        if (f.deviceId && f.deviceId._id) return f.deviceId._id;
        if (f.device && f.device._id) return f.device._id;
        return f._id || f.id;
      });
      setFavoriteIds(ids);
    } catch (e) {
      console.error('Failed to load favorites globally', e);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = async (deviceId: string) => {
    // Optimistic Update immediately
    setFavoriteIds(prev =>
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
    
    // API Call
    try {
      const token = await getToken();
      if (token) {
        await ApiToggleFavorite(token, deviceId);
      }
    } catch (e) {
      console.error('Failed to toggle favorite globally', e);
      // Optional: rollback on error
      refreshFavorites();
    }
  };

  return (
    <FavoriteContext.Provider value={{ favoriteIds, toggleFavorite, refreshFavorites }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoriteContext);
