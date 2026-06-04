import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useActivities } from '../../hooks/useActivities'; 
import { Link } from 'expo-router';

export default function ActivitiesScreen() {
  const { activities, loading } = useActivities();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Lade Aktivitäten...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
          <Text style={styles.noDataText}>Keine Aktivitäten vorhanden.</Text>
        )}
        
        {/* Platzhalter am Ende, damit der Button nichts verdeckt */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Button zum Hinzufügen - hier als "Floating Action Button" oder unten fixiert */}
      <Link href="/activity/add" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>+ Add Activity</Text>
        </Pressable>
      </Link>
    </View>
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
  dateText: { color: '#666', fontSize: 14, marginTop: 4 },
  noDataText: { textAlign: 'center', color: '#999', marginTop: 20 },
  
  // STYLES FÜR DEN BUTTON
  button: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // Schatten für Android
    shadowColor: '#000', // Schatten für iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});