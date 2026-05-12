import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// Typ-Definition für ein Formularfeld vom Backend
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date';
  required: boolean;
}

const ACTIVITY_TYPES = ['training', 'competition', 'responsibility', 'recovery', 'other'];

export default function AddActivityScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [schema, setSchema] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loadingSchema, setLoadingSchema] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  // 1. Schema laden, sobald ein Typ ausgewählt wurde
  useEffect(() => {
    if (!selectedType) return;

    const fetchSchema = async () => {
      setLoadingSchema(true);
      try {
        // Hinweis: Erstelle diesen Endpunkt in Django (z.B. /api/schemas/<type>/)
        const response = await fetch(`http://127.0.0.1:8000/api/schemas/${selectedType}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setSchema(data.fields || []);
        
        // Initialisiere formData mit leeren Strings für alle Schema-Felder
        const initialData: Record<string, string> = { title: '', date: new Date().toISOString().split('T')[0] };
        data.fields.forEach((f: FormField) => initialData[f.name] = '');
        setFormData(initialData);
      } catch (error) {
        console.error("Schema konnte nicht geladen werden", error);
        // Fallback für 'other' oder bei Fehler: Basis-Felder
        setSchema([]);
        setFormData({ title: '', date: new Date().toISOString().split('T')[0] });
      } finally {
        setLoadingSchema(false);
      }
    };

    fetchSchema();
  }, [selectedType]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/activities/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          date: formData.date,
          category: selectedType,
          extra_details: formData // Der Rest landet im JSONField
        })
      });

      if (response.ok) {
        Alert.alert("Erfolg", "Aktivität gespeichert!");
        router.replace('/(tabs)/activities');
      }
    } catch (error) {
      Alert.alert("Fehler", "Speichern fehlgeschlagen.");
    }
  };

  const validateAndSave = () => {
    // Basis-Validierung (Titel & Datum sind Pflicht)
    if (!formData.title || !formData.date) {
      Alert.alert("Fehler", "Titel und Datum müssen ausgefüllt sein.");
      return;
    }

    // Dynamische Validierung basierend auf Schema
    const missingFields = schema.filter(f => f.required && !formData[f.name]);

    if (missingFields.length > 0) {
      Alert.alert(
        "Unvollständig",
        `Folgende Felder fehlen: ${missingFields.map(f => f.label).join(', ')}`,
        [
          { text: "Bearbeiten", style: "cancel" },
          { text: "Trotzdem speichern", onPress: submitData }
        ]
      );
    } else {
      submitData();
    }
  };

  // --- RENDERING ---

  // Phase 1: Auswahl des Typs
  if (!selectedType) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kategorie wählen</Text>
        {ACTIVITY_TYPES.map(type => (
          <TouchableOpacity key={type} style={styles.typeButton} onPress={() => setSelectedType(type)}>
            <Text style={styles.typeButtonText}>{type.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Phase 2: Laden des Schemas
  if (loadingSchema) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
    );
  }

  // Phase 3: Das dynamische Formular
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{selectedType.toUpperCase()}</Text>
      
      {/* Basis Felder */}
      <Text style={styles.label}>Titel *</Text>
      <TextInput 
        style={styles.input} 
        value={formData.title} 
        onChangeText={(v) => handleInputChange('title', v)} 
        placeholder="z.B. Morgenlauf"
      />

      <Text style={styles.label}>Datum (YYYY-MM-DD) *</Text>
      <TextInput 
        style={styles.input} 
        value={formData.date} 
        onChangeText={(v) => handleInputChange('date', v)} 
      />

      {/* Dynamische Felder aus dem Backend */}
      {schema.map(field => (
        <View key={field.name}>
          <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
          <TextInput 
            style={styles.input}
            placeholder={field.label}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            value={formData[field.name]}
            onChangeText={(v) => handleInputChange(field.name, v)}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={validateAndSave}>
        <Text style={styles.saveButtonText}>Speichern</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setSelectedType(null)}>
        <Text style={styles.cancelText}>Abbrechen & Typ ändern</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, marginTop: 20, textAlign: 'center' },
  typeButton: { backgroundColor: '#f0f0f0', padding: 18, borderRadius: 10, marginBottom: 12 },
  typeButtonText: { textAlign: 'center', fontWeight: '600', color: '#333' },
  label: { fontSize: 14, color: '#666', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16 },
  saveButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelText: { textAlign: 'center', color: '#ff3b30', marginTop: 20, marginBottom: 40 }
});