// api.ts (oder dein entsprechender API-Service)
import axios from 'axios'; // oder dein verwendeter HTTP-Client

export const generateWeeklySchedule = async (date: string, scenario?: string) => {
  const params: Record<string, string> = { date };
  if (scenario) {
    params.scenario = scenario;
  }

  const response = await api.get('/activities/generate-versions/', { params });
  return response.data; // Gibt { versions: [ { score: number, activities: [...] }, ... ] } zurück
};

export const saveWeeklyVersion = async (activities: any[]) => {
  const response = await api.post('/activities/save-version/', { activities });
  return response.data;
};