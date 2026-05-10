import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Platform } from 'react-native';

export function useActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchActivities = async () => {
      // WICHTIG: IP-Adresse anpassen für mobiles Testen!
      const apiUrl = Platform.OS === 'web' 
        ? 'http://127.0.0.1:8000/api/activities/' 
        : 'http://192.168.178.XX:8000/api/activities/';

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Hier schicken wir den Schlüssel mit, den wir beim Login gespeichert haben
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        } else {
          console.error("Fehler beim Laden der Aktivitäten:", response.status);
        }
      } catch (error) {
        console.error("Netzwerkfehler:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchActivities();
    }
  }, [token]); // Sobald sich der Token ändert (z.B. nach Login), neu laden

  return { activities, loading };
}