import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useActivities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        // Nur abrufen, wenn wir einen Token haben!
        if (!token) return;

        // Kleiner Trick: Nutze die richtige URL je nach Plattform
        const apiUrl = Platform.OS === 'web' 
            ? 'http://127.0.0.1:8000/api/activities/' 
            : 'http://192.168.178.XX:8000/api/activities/'; // DEINE IP HIER

        fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(`Server Fehler: ${res.status}`);
                return res.json();
            })
            .then(data => {
                // Falls du Pagination in Django hast, nimm data.results
                setActivities(Array.isArray(data) ? data : data.results || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fehler beim Laden:", err);
                setLoading(false);
            });
    }, [token]);

    return { activities, loading };
}