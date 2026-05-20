import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// 1. TYP-DEFINITION AN BACKEND-CHOICES ANGEPASST
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'boolean' | 'select' | 'textarea';
  required: boolean;
  options?: { value: string | number; label: string }[]; // Array aus Objekten vom neuen Backend-Schema
}

const ACTIVITY_TYPES = ['training', 'competition', 'responsibility', 'recovery', 'other'];

export default function AddActivityScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [schema, setSchema] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [backendErrors, setBackendErrors] = useState<Record<string, string[]>>({});
  const { token } = useAuth();
  const router = useRouter();

  // 2. SCHEMA LADEN
  useEffect(() => {
    if (!selectedType) return;

    const fetchSchema = async () => {
      setLoadingSchema(true);
      setBackendErrors({});
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/activities/schema/?type=${selectedType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Fehler beim Laden");
        
        const data = await response.json();
        
        // Filtere 'title' und 'date' heraus, da wir sie oben fest einbauen
        const dynamicFields = (data.fields || []).filter(
          (f: FormField) => f.name !== 'title' && f.name !== 'date'
        );
        setSchema(dynamicFields);
        
        const initialData: Record<string, any> = { 
          title: '', 
          date: new Date().toISOString().split('T')[0] 
        };
        
        dynamicFields.forEach((f: FormField) => {
          if (f.type === 'boolean') {
            initialData[f.name] = false;
          } else {
            initialData[f.name] = ''; // Text, Zahlen und Zeiten starten als leerer String
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
      // WICHTIG: Leere Werte filtern & Zahlen umwandeln, damit Django nicht meckert
      const processedData: Record<string, any> = {};
      
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        const fieldConfig = schema.find(f => f.name === key);
        
        if (value === '' || value === null || value === undefined) {
          // Optionale leere Felder gar nicht erst mitschicken
          return;
        }
        
        if (fieldConfig && fieldConfig.type === 'number') {
          // Konvertiert den TextInput-String in eine echte Zahl
          processedData[key] = value.includes('.') ? parseFloat(value) : parseInt(value, 10);
        } else {
          processedData[key] = value;
        }
      });

      const payload = {
        ...processedData,
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

  if (loadingSchema) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
    );
  }

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

        // FALL A: BOOLEAN
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

        // FALL B: SELECT (Hier greift jetzt das neue Objekt-Mapping des Backends!)
        if (field.type === 'select' && field.options) {
          return (
            <View key={field.name} style={styles.fieldBlock}>
              <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
              <View style={styles.selectRow}>
                {field.options.map((opt) => {
                  const isSelected = formData[field.name] === opt.value;

                  return (
                    <TouchableOpacity 
                      key={opt.value.toString()} 
                      style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}
                      onPress={() => handleInputChange(field.name, opt.value)}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {hasError && <Text style={styles.errorText}>{backendErrors[field.name].join(', ')}</Text>}
            </View>
          );
        }

        // FALL C: TEXTAREA
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
              value={formData[field.name]?.toString() || ''} // Verhindert Fehler, wenn Zahlen gelöscht werden
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
    justifyContent: 'space-between', 
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
