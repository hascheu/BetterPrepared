import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';

// 1. Token-Schnittstelle definieren
interface AuthTokens {
  access: string;
  refresh: string;
}

// 2. AuthContextType anpassen: signIn nimmt jetzt AuthTokens entgegen
interface AuthContextType {
  token: string | null;
  signIn: (tokens: AuthTokens) => Promise<void>; // <-- HIER GEÄNDERT
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Hilfsfunktionen (unverändert)
  const saveStorageItem = async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  };

  const getStorageItem = async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  };

  const removeStorageItem = async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        // Lädt beim Start das Access-Token
        const savedToken = await getStorageItem('userAccess');
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (e) {
        console.error("Fehler beim Laden", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoading]);

  // 3. signIn speichert jetzt BEIDE Tokens ab
  const signIn = async (tokens: AuthTokens) => {
    await saveStorageItem('userAccess', tokens.access);
    await saveStorageItem('userRefresh', tokens.refresh);
    setToken(tokens.access);
  };

  // 4. signOut löscht BEIDE Tokens
  const signOut = async () => {
    await removeStorageItem('userAccess');
    await removeStorageItem('userRefresh');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}