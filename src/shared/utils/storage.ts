import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'accessToken';

type StorageBackend = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStore = new Map<string, string>();

function getWebStorageBackend(): StorageBackend | null {
  if (Platform.OS !== 'web') return null;
  const ls = globalThis?.localStorage;
  if (!ls) return null;

  return {
    async getItem(key) {
      return ls.getItem(key);
    },
    async setItem(key, value) {
      ls.setItem(key, value);
    },
    async removeItem(key) {
      ls.removeItem(key);
    },
  };
}

function getAsyncStorageBackend(): StorageBackend | null {
  try {
    // Avoid crashing when the native module isn't available (common in Expo Go or web builds).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    const asyncStorage: StorageBackend | undefined = mod?.default ?? mod;
    if (!asyncStorage?.getItem || !asyncStorage?.setItem || !asyncStorage?.removeItem) return null;
    return asyncStorage;
  } catch {
    return null;
  }
}

function getMemoryBackend(): StorageBackend {
  return {
    async getItem(key) {
      return memoryStore.get(key) ?? null;
    },
    async setItem(key, value) {
      memoryStore.set(key, value);
    },
    async removeItem(key) {
      memoryStore.delete(key);
    },
  };
}

let backend: StorageBackend = getWebStorageBackend() ?? getAsyncStorageBackend() ?? getMemoryBackend();

async function getItem(key: string) {
  try {
    return await backend.getItem(key);
  } catch {
    backend = getMemoryBackend();
    return await backend.getItem(key);
  }
}

async function setItem(key: string, value: string) {
  try {
    await backend.setItem(key, value);
  } catch {
    backend = getMemoryBackend();
    await backend.setItem(key, value);
  }
}

async function removeItem(key: string) {
  try {
    await backend.removeItem(key);
  } catch {
    backend = getMemoryBackend();
    await backend.removeItem(key);
  }
}

export async function setToken(token: string) {
  await setItem(ACCESS_TOKEN_KEY, token);
}

export async function getToken() {
  return await getItem(ACCESS_TOKEN_KEY);
}

export async function removeToken() {
  await removeItem(ACCESS_TOKEN_KEY);
}
