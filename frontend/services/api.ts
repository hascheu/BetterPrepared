import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import BASE_URL from '@/config/api';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper zum Laden des Tokens (passend zu deiner AuthContext-Logik)
const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('userAccess');
  }
  return await SecureStore.getItemAsync('userAccess');
};

// Interceptor: Betankt jeden Request automatisch mit dem JWT Access-Token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Scheduler Endpunkte
export const generateWeeklySchedule = async (dateStr: string, scenario?: string) => {
  let url = `/activities/generate-versions/?date=${dateStr}`;
  if (scenario) {
    url += `&scenario=${scenario}`;
  }
  const response = await api.get(url);
  return response.data;
};


// services/api.ts

// Interface für die Payload beim Speichern
interface SaveVersionPayload {
  activities: any[];
  score?: number;
  start_of_week?: string;
}

export const saveWeeklyVersion = async (payload: SaveVersionPayload) => {
  const response = await api.post('/activities/save-version/', payload);
  return response.data;
};