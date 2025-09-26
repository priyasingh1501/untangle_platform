import SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const USER_KEY = 'user_info';

export async function saveUser(user: any) {
  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  }
}

export async function loadUser<T = any>(): Promise<T | null> {
  const raw = Platform.OS === 'web' 
    ? localStorage.getItem(USER_KEY)
    : await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function clearUser() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}


