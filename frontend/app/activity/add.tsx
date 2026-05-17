import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// 1. TYP-DEFINITION ERWEITERT (Passend zum Backend-Meta-API)
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'boolean' | 'select' | 'textarea';
  required: boolean;
  options?: string[][] | [string, string][]; // Für Select-Felder vom Backend
}

const ACTIVITY_TYPES = ['training', 'competition', 'responsibility', 'recovery', 'other'];

export default function AddActivityScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [schema, setSchema] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({}); // Typ auf 'any' geändert wegen Booleans
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [backendErrors, setBackendErrors] = useState<Record<string, string[]>>({}); // Für rote Fehlermeldungen unter den Feldern
  const { token } = useAuth();
  const router = useRouter();

  // 2. SCHEMA LADEN
  useEffect(() => {
    if (!selectedType) return;

    const fetchSchema = async () => {
      setLoadingSchema(true);
      setBackendErrors({}); // Fehler zurücksetzen
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/activities/schema/?type=${selectedType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Fehler beim Laden");
        
        const data = await response.json();
        
        // Da das Backend bereits ALLE Felder (inkl. Titel und Datum) liefert,
        // filtern wir Titel und Datum heraus, da wir sie oben fix rendern.
        const dynamicFields = (data.fields || []).filter(
          (f: FormField) => f.name !== 'title' && f.name !== 'date'
        );
        setSchema(dynamicFields);
        
        // Formular-State dynamisch mit den korrekten Typen initialisieren
        const initialData: Record<string, any> = { 
          title: '', 
          date: new Date().toISOString().split('T')[0] 
        };
        
        dynamicFields.forEach((f: FormField) => {
          if (f.type === 'boolean') {
            initialData[f.name] = false; // Booleans starten als False
          } else {
            initialData[f.name] = ''; // Alles andere als leerer Text
          }
        });
        setFormData(initialData);
      } catch (error) {
        console.error("Schema konnte nicht geladen werden", error);
        setSchema([]);
      } finally {
        setLoadingSchema(false);
      }
    };

    fetchSchema();
  }, [selectedType, token]);

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Wenn der Nutzer tippt, löschen wir den spezifischen Backend-Fehler für dieses Feld
    if (backendErrors[name]) {
      setBackendErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // 3. DATEN AN DAS BACKEND SENDEN
  const submitData = async () => {
    try {
      // WICHTIG: Kein 'profile: 1' mehr mitschicken! Das macht die View via Token!
      const payload = {
        ...formData,
        activity_type: selectedType,
      };

      const response = await fetch('http://127.0.0.1:8000/api/activities/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert("Erfolg", "Aktivität gespeichert!");
        router.replace('/(tabs)/activities');
      } else {
        const errorData = await response.json();
        
        
        // Wir speichern die Fehlermeldungen im State, um sie direkt unter den Inputs anzuzeigen
        setBackendErrors(errorData);
        Alert.alert("Validierungsfehler", "Bitte korrigiere die rot markierten Felder.");
      }
    } catch (error) {
      Alert.alert("Fehler", "Server nicht erreichbar.");
    }
  };

  const validateAndSave = () => {

    if (!formData.title || !formData.date) {
      
      Alert.alert("Fehler", "Titel und Datum müssen ausgefüllt sein.");
      return;
    }

    // Lokale Prüfung vor dem Absenden
    const missingFields = schema.filter(f => f.required && !formData[f.name] && formData[f.name] !== false);

    if (missingFields.length > 0) {
      Alert.alert(
        "Unvollständig",
        `Folgende Pflichtfelder fehlen: ${missingFields.map(f => f.label).join(', ')}`
      );
    } else {
      submitData();
    }
  };

  // --- UI RENDERING ---

  // Phase 1: Kategorie-Auswahl
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

  // Phase 2: Laden
  if (loadingSchema) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
    );
  }

  // Phase 3: Dynamisches Formular
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{selectedType.toUpperCase()}</Text>
      
      {/* Fixes Feld: Titel */}
      <Text style={styles.label}>Titel *</Text>
      <TextInput 
        style={[styles.input, backendErrors.title && styles.inputError]} 
        value={formData.title} 
        onChangeText={(v) => handleInputChange('title', v)} 
        placeholder="z.B. Morgenlauf"
      />
      {backendErrors.title && <Text style={styles.errorText}>{backendErrors.title.join(', ')}</Text>}

      {/* Fixes Feld: Datum */}
      <Text style={styles.label}>Datum (YYYY-MM-DD) *</Text>
      <TextInput 
        style={[styles.input, backendErrors.date && styles.inputError]} 
        value={formData.date} 
        onChangeText={(v) => handleInputChange('date', v)} 
      />
      {backendErrors.date && <Text style={styles.errorText}>{backendErrors.date.join(', ')}</Text>}

      {/* DYNAMISCHE FELDER-GENERIERUNG */}
      {schema.map(field => {
        const hasError = !!backendErrors[field.name];

        // FALL A: BOOTLEAN (Ganztägig Schalter)
        if (field.type === 'boolean') {
          return (
            <View key={field.name} style={styles.switchContainer}>
              <Text style={styles.label}>{field.label}</Text>
              <Switch 
                value={!!formData[field.name]} 
                onValueChange={(v) => handleInputChange(field.name, v)}
              />
            </View>
          );
        }

        // FALL B: SELECT (Planungstyp, Wochentag, Intensität etc.)
        if (field.type === 'select' && field.options) {
          return (
            <View key={field.name} style={styles.fieldBlock}>
              <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
              <View style={styles.selectRow}>
                {field.options.map((opt: any) => {
                  // Django Choices liefern entweder [Wert, Label] oder nur Strings
                  const val = Array.isArray(opt) ? opt[0] : opt;
                  const display = Array.isArray(opt) ? opt[1] : opt;
                  const isSelected = formData[field.name] === val;

                  return (
                    <TouchableOpacity 
                      key={val} 
                      style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}
                      onPress={() => handleInputChange(field.name, val)}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{display}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {hasError && <Text style={styles.errorText}>{backendErrors[field.name].join(', ')}</Text>}
            </View>
          );
        }

        // FALL C: TEXTAREA (Deine neuen Notizen für 'other' oder Wettkampf-Ergebnis)
        if (field.type === 'textarea') {
          return (
            <View key={field.name} style={styles.fieldBlock}>
              <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
              <TextInput 
                style={[styles.input, styles.textArea, hasError && styles.inputError]}
                placeholder={field.label}
                multiline
                numberOfLines={4}
                value={formData[field.name]}
                onChangeText={(v) => handleInputChange(field.name, v)}
              />
              {hasError && <Text style={styles.errorText}>{backendErrors[field.name].join(', ')}</Text>}
            </View>
          );
        }

        // FALL D: STANDARDFELDER (text, number, date, time)
        return (
          <View key={field.name} style={styles.fieldBlock}>
            <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
            <TextInput 
              style={[styles.input, hasError && styles.inputError]}
              placeholder={field.type === 'time' ? 'z.B. 14:30' : field.label}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
              value={formData[field.name]}
              onChangeText={(v) => handleInputChange(field.name, v)}
            />
            {hasError && <Text style={styles.errorText}>{backendErrors[field.name].join(', ')}</Text>}
          </View>
        );
      })}

      {/* Buttons */}
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
  fieldBlock: { marginBottom: 5 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, backgroundColor: '#fafafa' },
  inputError: { borderColor: '#ff3b30', backgroundColor: '#fff9f9' },
  errorText: { color: '#ff3b30', fontSize: 12, marginTop: -12, marginBottom: 15, marginLeft: 5 },
  textArea: { height: 100, textAlignVertical: 'top' },
  switchContainer: { 
  flexDirection: 'row', 
  justifyContent: 'space-between', // <-- Geändert zu 'space-between'
  alignItems: 'center', 
  marginBottom: 20, 
  paddingVertical: 5 
},
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 8 },
  optionBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee' },
  optionBadgeSelected: { backgroundColor: '#007AFF' },
  optionText: { color: '#333', fontSize: 13 },
  optionTextSelected: { color: '#fff', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelText: { textAlign: 'center', color: '#ff3b30', marginTop: 20, marginBottom: 60 }
});



/*
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

  // 1. Schema laden (angepasste URL)
useEffect(() => {
  if (!selectedType) return;

  const fetchSchema = async () => {
    setLoadingSchema(true);
    try {
      // Die URL wurde an das Django-ViewSet angepasst
      const response = await fetch(`http://127.0.0.1:8000/api/activities/schema/?type=${selectedType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Fehler beim Laden");
      
      const data = await response.json();
      setSchema(data.fields || []);
      
      // WICHTIG: Hier initialisieren wir formData mit leeren Werten
      // Wir behalten title und date bei, fügen aber die neuen Felder hinzu
      const initialData: Record<string, string> = { 
        title: '', 
        date: new Date().toISOString().split('T')[0] 
      };
      
      data.fields.forEach((f: any) => {
        initialData[f.name] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error("Schema konnte nicht geladen werden", error);
      setSchema([]);
    } finally {
      setLoadingSchema(false);
    }
  };

  fetchSchema();
}, [selectedType, token]);

// Diese Funktion muss innerhalb deiner AddActivityScreen Komponente stehen
const handleInputChange = (name: string, value: string) => {
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

// 2. Daten speichern (Flache Struktur & activity_type)
const submitData = async () => {
  try {
    // Wir bauen das Objekt so zusammen, wie der neue Serializer es erwartet
    const payload = {
      ...formData,
      activity_type: selectedType, // 'training', 'recovery', etc.
      profile: 1, // Temporär: Hier sollte eigentlich die ID des User-Profils stehen!
    };

    const response = await fetch('http://127.0.0.1:8000/api/activities/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      Alert.alert("Erfolg", "Aktivität gespeichert!");
      router.replace('/(tabs)/activities');
    } else {
      const errorData = await response.json();
      console.log("Backend-Fehler:", errorData);
      Alert.alert("Fehler", "Prüfe deine Eingaben.");
    }
  } catch (error) {
    Alert.alert("Fehler", "Server nicht erreichbar.");
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
      <Text style={styles.title}>{selectedType.toUpperCase()}</Text> */
     