import { useState, useEffect } from 'react';

export function useActivities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/activities/')
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setLoading(false);
            })
            .catch(err => console.error("Fehler beim Laden:", err));
    }, []);

    return { activities, loading };
}