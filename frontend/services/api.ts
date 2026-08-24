import axios from 'axios';

// Erstelle eine zentrale Axios-Instanz
// WICHTIG: Passe die URL an dein Test-Setup an (z. B. http://10.0.2.2:8000/api für Android Emulator)
export const api = axios.create({
  baseURL: 'http://localhost:8000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor für Auth-Header (optional für spätere Erweiterung)
api.interceptors.request.use(
  async (config) => {
    // Falls du Auth-Tokens nutzt, kannst du sie hier injizieren:
    // const token = await AsyncStorage.getItem('userToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// 1. Wochenplan-Versionen vom Backend berechnen lassen
export const generateWeeklySchedule = async (date: string, scenario?: string) => {
  const params: Record<string, string> = { date };
  if (scenario) {
    params.scenario = scenario;
  }

  // Hier wird jetzt die 'api'-Instanz von oben korrekt genutzt:
  const response = await api.get('/activities/generate-versions/', { params });
  return response.data; // Liefert: { versions: [ { score: number, activities: [...] }, ... ] }
};

// 2. Gewählte Version fest in der Datenbank speichern
export const saveWeeklyVersion = async (activities: any[]) => {
  const response = await api.post('/activities/save-version/', { activities });
  return response.data;
};

export default api;