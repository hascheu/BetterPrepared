import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext'; 
import BASE_URL from '@/config/api';

// TypeScript-Typ für unsere Profildaten definieren
interface ProfileData {
  username: string;
  email: string;
  sport_type: 'BOXING' | 'MMA' | 'THAIBOXING' | null;
  status: 'ACTIVE' | 'INJURED' | 'RECOVERY';
  chronical_disease: string | null;
}

export default function ProfileScreen() {

  const { token, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Lokale States für das Formular (während der Bearbeitung)
  const [sportType, setSportType] = useState<'BOXING' | 'MMA' | 'THAIBOXING' | null>(null);
  const [status, setStatus] = useState<'ACTIVE' | 'INJURED' | 'RECOVERY'>('ACTIVE');
  const [disease, setDisease] = useState('');

  // 1. Daten vom Django-Backend laden
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/users/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- HIER: direkt 'token' nutzen!
          },
        });

      if (!response.ok) {
        throw new Error('Profildaten konnten nicht geladen werden.');
      }

      const data: ProfileData = await response.ok ? await response.json() : null;
      setProfile(data);
      
      // Formular-States initialisieren
      setSportType(data.sport_type);
      setStatus(data.status);
      setDisease(data.chronical_disease || '');
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Etwas ist schiefgelaufen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (token) {
    fetchProfile();
  }
}, [token]); 

  // 2. Änderungen an Django senden (PATCH)
  const handleSave = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sport_type: sportType,
          status: status,
          chronical_disease: disease === '' ? null : disease,
        }),
      });

      if (!response.ok) {
        throw new Error('Änderungen konnten nicht gespeichert werden.');
      }

      const updatedData = await response.json();
      setProfile(updatedData);
      setIsEditing(false);
      Alert.alert('Erfolg', 'Profil erfolgreich aktualisiert!');
    } catch (error: any) {
      Alert.alert('Fehler', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Profil wird geladen...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mein Profil</Text>

      {/* --- INFOKARTE --- */}
      <View style={styles.card}>
        <Text style={styles.label}>Benutzername</Text>
        <Text style={styles.valueText}>{profile?.username}</Text>

        <Text style={styles.label}>E-Mail</Text>
        <Text style={styles.valueText}>{profile?.email}</Text>
        
        <View style={styles.divider} />

        {/* --- SPORTART-AUSWAHL --- */}
        <Text style={styles.label}>Sportart</Text>
        {isEditing ? (
          <View style={styles.pickerContainer}>
            {(['BOXING', 'MMA', 'THAIBOXING'] as const).map((type) => (
              <TouchableOpacity 
                key={type} 
                style={[styles.chip, sportType === type && styles.chipActive]} 
                onPress={() => setSportType(type)}
              >
                <Text style={[styles.chipText, sportType === type && styles.chipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.valueText}>{profile?.sport_type || 'Keine Sportart ausgewählt'}</Text>
        )}

        {/* --- STATUS-AUSWAHL --- */}
        <Text style={styles.label}>Status</Text>
        {isEditing ? (
          <View style={styles.pickerContainer}>
            {(['ACTIVE', 'INJURED', 'RECOVERY'] as const).map((s) => (
              <TouchableOpacity 
                key={s} 
                style={[styles.statusChip, status === s && styles[`status_${s}`]]} 
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
       <Text 
       style={[styles.statusBadge, profile?.status ? styles[`status_${profile.status}`] : styles.status_ACTIVE]}
       >
        {profile?.status || 'Lade...'}
        </Text>
        )}

        {/* --- VORERKRANKUNGEN --- */}
        <Text style={styles.label}>Chronische Erkrankungen / Notizen</Text>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={3}
            value={disease}
            onChangeText={setDisease}
            placeholder="z.B. Asthma, Kniebeschwerden links..."
          />
        ) : (
          <Text style={styles.valueText}>{profile?.chronical_disease || 'Keine Angaben'}</Text>
        )}
      </View>

      {/* --- BUTTONS --- */}
      {isEditing ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsEditing(false)}>
            <Text style={styles.buttonTextBlack}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.buttonText}>Speichern</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => setIsEditing(true)}>
          <Text style={styles.buttonText}>Profil bearbeiten</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutButtonText}>Abmelden</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 25,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 14,
  },
  valueText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eaeaea',
    marginVertical: 15,
  },
  textInput: {
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 80,
    marginTop: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 5,
  },
  chip: {
    backgroundColor: '#f1f3f5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#007AFF',
  },
  statusChip: {
    backgroundColor: '#f1f3f5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipText: {
    color: '#495057',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  status_ACTIVE: { backgroundColor: '#34C759' }, // Grün
  status_INJURED: { backgroundColor: '#FF3B30' }, // Rot
  status_RECOVERY: { backgroundColor: '#FF9500' }, // Orange
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    marginBottom: 15,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#e5e5ea',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextBlack: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 10,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});





