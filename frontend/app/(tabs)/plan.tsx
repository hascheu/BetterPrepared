// plan.tsx
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { generateWeeklySchedule, saveWeeklyVersion } from '../../services/api';

interface GeneratedActivity {
  id: number;
  title: string;
  date: string;
  start_time: string;
  duration: number;
  [key: string]: any;
}

interface ScheduleVersion {
  score: number;
  activities: GeneratedActivity[];
}

export default function PlanScreen() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<ScheduleVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number | null>(null);

  // Beispiel-Startdatum für die Kalenderwoche (z.B. der nächste Montag)
  const targetDate = '2026-07-06';

  const handleGenerate = async (scenario?: string) => {
    setLoading(true);
    try {
      const data = await generateWeeklySchedule(targetDate, scenario);
      setVersions(data.versions);
      if (data.versions.length > 0) {
        setSelectedVersionIndex(0); // Standardmäßig Version 1 auswählen
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Kalenderversionen konnten nicht berechnet werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedVersionIndex === null || !versions[selectedVersionIndex]) {
      Alert.alert('Hinweis', 'Bitte wähle zuerst eine Version aus.');
      return;
    }

    setSaving(true);
    try {
      const selectedActivities = versions[selectedVersionIndex].activities;
      await saveWeeklyVersion(selectedActivities);
      Alert.alert('Erfolg', 'Die gewählte Wochenversion wurde erfolgreich gespeichert!');
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Fehler beim Speichern der Wochenversion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Wochenplaner</Text>

      {/* Buttons zur Generierung & Testen von Szenarien */}
      <View style={styles.buttonRow}>
        <Button title="Plan berechnen" onPress={() => handleGenerate()} />
        <Button title="Test: Konflikt" onPress={() => handleGenerate('conflict')} color="#e74c3c" />
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

      {/* Anzeige der berechneten Versionen */}
      {versions.length > 0 && !loading && (
        <View style={styles.versionsContainer}>
          <Text style={styles.subHeading}>Vorgeschlagene Optionen:</Text>
          
          <View style={styles.tabRow}>
            {versions.map((ver, idx) => (
              <Button
                key={idx}
                title={`Option ${idx + 1} (Score: ${ver.score})`}
                color={selectedVersionIndex === idx ? '#2ecc71' : '#7f8c8d'}
                onPress={() => setSelectedVersionIndex(idx)}
              />
            ))}
          </View>

          {/* Anzeige der Aktivitäten der ausgewählten Version */}
          {selectedVersionIndex !== null && (
            <View style={styles.activityList}>
              <Text style={styles.versionTitle}>Aktivitäten in Option {selectedVersionIndex + 1}:</Text>
              {versions[selectedVersionIndex].activities.map((act) => (
                <View key={act.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{act.title}</Text>
                  <Text>{act.date} | Start: {act.start_time} Uhr ({act.duration} Min.)</Text>
                </View>
              ))}

              <View style={styles.saveContainer}>
                <Button 
                  title={saving ? "Wird gespeichert..." : "Diese Version speichern"} 
                  onPress={handleSave} 
                  disabled={saving}
                  color="#27ae60"
                />
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subHeading: { fontSize: 18, fontWeight: '600', marginVertical: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  loader: { marginVertical: 20 },
  versionsContainer: { marginTop: 10 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  activityList: { marginTop: 10 },
  versionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, elevation: 2 },
  cardTitle: { fontWeight: 'bold', fontSize: 15 },
  saveContainer: { marginTop: 20, marginBottom: 40 }
});