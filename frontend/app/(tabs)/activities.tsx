import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Pressable, 
  TextInput, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import BASE_URL from '@/config/api';

export default function ActivitiesScreen() {
  const { token } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter-Zustände
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedScheduling, setSelectedScheduling] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Aktivitäten aus dem Backend abrufen
  const fetchActivities = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (selectedType) queryParams.push(`activity_type=${selectedType}`);
      if (selectedScheduling) queryParams.push(`scheduling_type=${selectedScheduling}`);
      if (selectedPriority) queryParams.push(`priority=${selectedPriority}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await fetch(`${BASE_URL}/api/activities/${queryString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Aktivitäten:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [search, selectedType, selectedScheduling, selectedPriority]);

  // Aktivität Löschen (Plattformübergreifend)
  const handleDelete = (id: number, title: string) => {
    // Hilfsfunktion zum Ausführen des API-Calls
    const executeDelete = async () => {
      console.log(`[DELETE] Starte Löschvorgang für ID: ${id}`);
      try {
        const res = await fetch(`${BASE_URL}/api/activities/${id}/`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`[DELETE] Server Status Code: ${res.status}`);

        // Django liefert bei DELETE typischerweise Status 204 (No Content) oder 200 OK
        if (res.ok || res.status === 204) {
          // UI sofort lokal aktualisieren
          setActivities(prev => prev.filter(item => item.id !== id));
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("[DELETE] Server Fehler-Details:", errorData);
          Alert.alert("Fehler", `Löschen fehlgeschlagen (Status ${res.status})`);
        }
      } catch (err) {
        console.error("[DELETE] Netzwerkfehler:", err);
        Alert.alert("Fehler", "Netzwerkfehler beim Löschen.");
      }
    };

    // Für Web-Browser (falls du expo start --web nutzt):
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(`Möchtest du "${title}" wirklich löschen?`);
      if (confirmed) executeDelete();
      return;
    }

    // Für native Geräte (iOS / Android):
    Alert.alert(
      "Aktivität löschen",
      `Möchtest du "${title}" wirklich löschen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        { 
          text: "Löschen", 
          style: "destructive", 
          onPress: executeDelete 
        }
      ],
      { cancelable: true }
    );
  };

  // Aktivität Bearbeiten -> Navigiert zum Formular mit der ID als Query-Parameter
  const handleEdit = (id: number) => {
    router.push({
      pathname: '/activity/add',
      params: { id }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Alle Aktivitäten</Text>

        {/* 1. SUCHLEISTE */}
        <TextInput
          style={styles.searchInput}
          placeholder="Aktivität suchen..."
          value={search}
          onChangeText={setSearch}
        />

        {/* 2. FILTER BADGES (Schnellfilter) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterBadge, selectedScheduling === '' && styles.filterBadgeActive]}
            onPress={() => setSelectedScheduling('')}
          >
            <Text style={selectedScheduling === '' ? styles.filterTextActive : styles.filterText}>Alle Typen</Text>
          </TouchableOpacity>

          {['FIXED', 'FLEXIBLE', 'FREE', 'OPTIONAL'].map((type) => (
            <TouchableOpacity 
              key={type}
              style={[styles.filterBadge, selectedScheduling === type && styles.filterBadgeActive]}
              onPress={() => setSelectedScheduling(selectedScheduling === type ? '' : type)}
            >
              <Text style={selectedScheduling === type ? styles.filterTextActive : styles.filterText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 3. LISTE DER AKTIVITÄTEN */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10 }}>Lade Aktivitäten...</Text>
          </View>
        ) : activities.length > 0 ? (
          activities.map((activity: any) => (
            <View key={activity.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.dateText}>
                    {activity.date ? activity.date : 'Flexibel'} | {activity.scheduling_type}
                  </Text>
                </View>
                <Text style={styles.priorityBadge}>Prio: {activity.priority || 'Normal'}</Text>
              </View>

              {/* ACTION BUTTONS (EDIT & DELETE) */}
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.editBtn]} 
                  onPress={() => handleEdit(activity.id)}
                >
                  <Text style={styles.actionBtnText}>Bearbeiten</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, styles.deleteBtn]} 
                  onPress={() => handleDelete(activity.id, activity.title)}
                >
                  <Text style={styles.actionBtnText}>Löschen</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>Keine Aktivitäten gefunden.</Text>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <Link href="/activity/add" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>+ Neue Aktivität</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { padding: 40, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, marginTop: 40 },
  searchInput: {
    backgroundColor: '#f1f3f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  filterContainer: { flexDirection: 'row', marginBottom: 15 },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  filterBadgeActive: { backgroundColor: '#007AFF' },
  filterText: { color: '#495057', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
  card: { 
    padding: 15, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 10, 
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activityTitle: { fontSize: 18, fontWeight: '600' },
  dateText: { color: '#666', fontSize: 14, marginTop: 4 },
  priorityBadge: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  editBtn: { backgroundColor: '#007AFF' },
  deleteBtn: { backgroundColor: '#FF3B30' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  noDataText: { textAlign: 'center', color: '#999', marginTop: 40 },
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});