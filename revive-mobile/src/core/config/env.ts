const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const rawEnvironment = process.env.EXPO_PUBLIC_APP_ENV?.trim();

export const env = {
  apiUrl: (rawApiUrl || 'http://localhost:3000/api').replace(/\/$/, ''),
  isConfigured: Boolean(rawApiUrl),
  environment: rawEnvironment || 'development',
};
