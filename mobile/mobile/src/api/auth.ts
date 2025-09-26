import { api, saveTokens, clearTokens } from './client';

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user?: any;
};

export async function loginWithEmailPassword(email: string, password: string) {
  let res;
  try {
    res = await api().post<LoginResponse>('/auth/login', { email, password });
  } catch (e: any) {
    // Fallback to possible alternate path
    res = await api().post<LoginResponse>('/api/auth/login', { email, password });
  }
  const accessToken = (res.data as any).accessToken || (res.data as any).token;
  const refreshToken = (res.data as any).refreshToken;
  if (accessToken) await saveTokens({ accessToken, refreshToken });
  return res.data;
}

export async function fetchMe() {
  const res = await api().get('/auth/me');
  return res.data;
}

export async function logout() {
  try {
    await api().post('/auth/logout');
  } catch {}
  await clearTokens();
}


