import Constants from 'expo-constants';

export const Config = {
  apiBaseUrl: ((Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined) || 'http://localhost:5000'
};


