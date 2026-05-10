import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
// 1. Wir importieren nur den fertigen Hook
import { useActivities } from '../../hooks/useActivities'; 

export default function ActivitiesScreen() {
  // 2. Wir nutzen den Hook, um die Daten zu holen
  const { activities, loading } = useActivities();

  // 3. Wenn es noch lädt, zeigen wir einen Spinner
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Lade Aktivitäten...</Text>
      </View>
    );
  }

  // 4. Das eigentliche UI (JSX)
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Alle Aktivitäten</Text>
      
      {activities.length > 0 ? (
        activities.map((activity: any) => (
          <View key={activity.id} style={styles.card}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.dateText}>{activity.date}</Text>
          </View>
        ))
      ) : (
        <Text>Keine Aktivitäten vorhanden.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  card: { 
    padding: 15, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 10, 
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF' 
  },
  activityTitle: { fontSize: 18, fontWeight: '600' },
  dateText: { color: '#666', fontSize: 14, marginTop: 4 }
});