import type { StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const mmkvStorage: StateStorage & { getParseItem: <T>(name: string) => T | null; setJsonItem: <T>(name: string, value: T) => void } = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.remove(name),
  getParseItem: <T,>(name: string): T | null => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) || null : null;
  },
  setJsonItem: <T,>(name: string, value: T) => storage.set(name, JSON.stringify(value)),
};
