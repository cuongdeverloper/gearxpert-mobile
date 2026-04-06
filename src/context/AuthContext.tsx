import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, removeToken as removeTokenStorage, setToken as setTokenStorage } from '../shared/utils/storage';
import { ApiGetCurrentUser } from '../features/auth/api';

type User = {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  role: string;
  [key: string]: any;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isAuthChecked: boolean;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async (token: string) => {
    try {
      const response = await ApiGetCurrentUser(token);
      if (response.errorCode === 0) {
        setUser(response.data);
        return true;
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
    return false;
  };

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const success = await fetchUser(token);
        setIsAuthenticated(success);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsAuthChecked(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (token: string) => {
    await setTokenStorage(token);
    const success = await fetchUser(token);
    if (success) {
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    await removeTokenStorage();
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    const token = await getToken();
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthChecked, user, login, logout, checkAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
