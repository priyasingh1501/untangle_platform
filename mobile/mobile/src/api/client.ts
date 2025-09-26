import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

let apiBaseUrl: string = 'http://localhost:5000';
let axiosInstance: AxiosInstance | null = null;

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function setApiBaseUrl(url: string) {
  apiBaseUrl = url.replace(/\/$/, '');
  axiosInstance = null;
}

async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveTokens(params: { accessToken: string; refreshToken?: string | null }) {
  if (Platform.OS === 'web') {
    localStorage.setItem(ACCESS_TOKEN_KEY, params.accessToken);
    if (params.refreshToken !== undefined) {
      if (params.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, params.refreshToken);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, params.accessToken);
    if (params.refreshToken !== undefined) {
      if (params.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, params.refreshToken);
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    }
  }
}

export async function clearTokens() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: apiBaseUrl, withCredentials: false, timeout: 15000 });

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers = { ...(config.headers as any), Authorization: `Bearer ${token}` } as any;
    }
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const original = error.config as AxiosRequestConfig & { _retry?: boolean };
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        try {
          const refreshed = await tryRefreshToken();
          if (refreshed) {
            // Retry original request with new token
            return client(original);
          }
        } catch {}
      }
      if (error.code === 'ECONNABORTED') {
        // Timeout: simple one-time retry
        return client(original);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await (axiosInstance ?? createClient()).post('/auth/refresh', { refreshToken });
    const accessToken = (res.data && (res.data.accessToken || res.data.token)) as string | undefined;
    const newRefresh = (res.data && res.data.refreshToken) as string | undefined;
    if (accessToken) {
      await saveTokens({ accessToken, refreshToken: newRefresh ?? refreshToken });
      return true;
    }
    return false;
  } catch {
    await clearTokens();
    return false;
  }
}

export function api(): AxiosInstance {
  if (!axiosInstance) axiosInstance = createClient();
  return axiosInstance;
}


