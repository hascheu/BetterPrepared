import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useActivities } from '../hooks/useActivities';

interface Activity {
    id: number;
    title: string;
    date: string;
    extra_details?: {
        training_type?: string;
    };
}

export default function Home() {
    const { activities, loading } = useActivities() as { activities: Activity[], loading: boolean };

    if (loading) return <Text>Lade Trainingsplan...</Text>;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Mein BetterPrepared Plan</Text>
            {activities.map((activity) => (
                <View key={activity.id} style={styles.card}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text>{activity.date}</Text>
                    {activity.extra_details && (
                        <Text style={{ color: 'blue' }}>
                            Typ: {activity.extra_details.training_type || 'Aktivität'}
                        </Text>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    activityTitle: { fontSize: 18, fontWeight: '600' }
});