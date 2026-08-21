import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// Importe der ausgelagerten Daten und Sub-Komponenten
import { ACTIVITY_TYPES, SCHEDULING_TYPES, FREQUENCIES, WEEKDAYS, FormField, FlexibleSlot } from '../../constants/activityOptions';
import { FixedSchedulingFields } from '../../components/activity/FixedSchedulingFields';
import { FlexibleSchedulingFields } from '../../components/activity/FlexibleSchedulingFields';
import { DynamicDetailsFields } from '../../components/activity/DynamicDetailsFields'; 
import { styles } from '../../styles/activityStyles';
import BASE_URL from '@/config/api';

export default function AddActivityScreen() {
  const { token } = useAuth();
  const router = useRouter();

  // STAGE CONTROL
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // STATISCHE DATEN (Scheduling)
  const [title, setTitle] = useState('');
  const [schedulingType, setSchedulingType] = useState('FIXED');
  const [frequency, setFrequency] = useState('ONCE');
  const [duration, setDuration] = useState('');
  
  // Felder für FIXED
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);

  // Felder für FLEXIBLE (Strukturierte Liste von Optionen)
  const [flexibleSlots, setFlexibleSlots] = useState<FlexibleSlot[]>([{ time: '' }]);

  // DYNAMISCHE DATEN
  const [schema, setSchema] = useState<FormField[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  const [backendErrors, setBackendErrors] = useState<Record<string, string[]>>({});

  // Setzt die flexiblen Slots zurück, wenn sich der Typ oder die Frequenz ändert
  useEffect(() => {
    if (schedulingType === 'FLEXIBLE') {
      if (frequency === 'ONCE') setFlexibleSlots([{ date: new Date().toISOString().split('T')[0], time: '' }]);
      if (frequency === 'DAILY') setFlexibleSlots([{ time: '' }]);
      if (frequency === 'WEEKLY') setFlexibleSlots([{ weekday: 'MON', time: '' }]);
    }
  }, [schedulingType, frequency]);

  // Schema laden
  useEffect(() => {
    if (!selectedType) return;
    const fetchSchema = async () => {
      setLoadingSchema(true);
      try {
        const response = await fetch(`${BASE_URL}/api/activities/schema/?type=${selectedType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Fehler beim Laden");
        const data = await response.json();
        setSchema(data.fields || []);
        
        const initialDynamicData: Record<string, any> = {};
        (data.fields || []).forEach((f: FormField) => {
          initialDynamicData[f.name] = f.type === 'boolean' ? false : '';
        });
        setDynamicFormData(initialDynamicData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSchema(false);
      }
    };
    fetchSchema();
  }, [selectedType, token]);

  const handleDynamicInputChange = (name: string, value: any) => {
    setDynamicFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateFlexibleSlot = (index: number, key: keyof FlexibleSlot, value: string) => {
    const updated = [...flexibleSlots];
    updated[index] = { ...updated[index], [key]: value };
    setFlexibleSlots(updated);
  };

  const submitData = async () => {
    if (!title || !duration) {
      Alert.alert("Fehler", "Bitte fülle alle Pflichtfelder (*) im Scheduling-Block aus.");
      return;
    }
    if (!selectedType) {
      Alert.alert("Fehler", "Bitte wähle eine Aktivitätsart aus.");
      return;
    }

    try {
      const processedDynamicData: Record<string, any> = {};
      Object.keys(dynamicFormData).forEach(key => {
        const value = dynamicFormData[key];
        const fieldConfig = schema.find(f => f.name === key);
        if (value === '' || value === null) return;
        processedDynamicData[key] = fieldConfig?.type === 'number' ? parseFloat(value) : value;
      });

// Hilfsfunktion, um die Endzeit zu berechnen (Startzeit + Dauer)
      const calculateEndTime = (startTime: string, durationMin: number) => {
        if (!startTime || !startTime.includes(':')) return startTime;
        const [hours, minutes] = startTime.split(':').map(Number);
        const dateObj = new Date();
        dateObj.setHours(hours, minutes, 0, 0);
        dateObj.setMinutes(dateObj.getMinutes() + durationMin);
        return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
      };

      // Fallback-Wochentag berechnen, falls keiner gewählt ist (z.B. bei ONCE oder DAILY)
      // Django braucht oft einen gültigen Choice-String wie "MON", "TUE" etc.
      const getFallbackWeekday = () => {
        if (selectedWeekdays.length > 0) return selectedWeekdays[0];
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        return days[new Date(date).getDay()] || 'MON';
      };

      const payload = {
        title,
        activity_type: selectedType,
        scheduling_type: schedulingType,
        frequency,
        duration: parseInt(duration, 10) || 60, // Fallback auf 60 Min, falls leer
        
        // 1. FIXED-LOGIK
        date: date, // Schicke das Datum immer mit
        
        // Nutze die eingetippte Zeit. Wenn leer, nimm als Fallback die aktuelle Uhrzeit
        start_time: schedulingType === 'FIXED' ? (time || "12:00") : "12:00",
        end_time: schedulingType === 'FIXED' ? calculateEndTime(time || "12:00", parseInt(duration, 10) || 60) : "13:00",
        
        // WICHTIG: Schicke IMMER einen Wochentag mit, da Django ihn zwingend fordert!
        weekday: getFallbackWeekday(),
        weekdays: selectedWeekdays.length > 0 ? selectedWeekdays : [getFallbackWeekday()],
        
        // 2. FLEXIBLE-LOGIK
        flexible_slots: schedulingType === 'FLEXIBLE' 
          ? flexibleSlots
              .filter(s => s.time !== '')
              .map(s => ({
                date: s.date || date,
                weekday: s.weekday || getFallbackWeekday(),
                start_time: s.time,
                end_time: calculateEndTime(s.time, parseInt(duration, 10) || 60)
              }))
          : [],
          
        ...processedDynamicData,
      };

      const response = await fetch(`${BASE_URL}/api/activities/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert("Erfolg", "Aktivität erfolgreich geplant!");
        router.replace('/(tabs)/activities');
     } else {
        const errorData = await response.json();
        setBackendErrors(errorData);
        
        // HIER NEU: Druckt den Fehler direkt in dein Expo-Terminal!
       console.log("!!! DJANGO FEHLER-ANTWORT !!!:", JSON.stringify(errorData, null, 2));
        Alert.alert("Fehler", "Bitte überprüfe die Eingaben.");
      }
    } catch (error: any) { // <-- Hier fängt das catch jetzt sauber an
      console.error("Speicher-Fehler Details:", error);
      Alert.alert("Fehler", `Es gab ein Problem: ${error.message || 'Unbekannter Fehler'}`);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.mainTitle}>Neue Aktivität erstellen</Text>
      
      {/* ================= SCHRITT 1: SCHEDULING ================= */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Basis-Infos & Timing</Text>
        
        <Text style={styles.label}>Titel der Aktivität *</Text>
        <TextInput 
          style={[styles.input, backendErrors.title && styles.inputError]} 
          value={title} 
          onChangeText={setTitle} 
          placeholder="z.B. Ausdauerlauf, Kadersichtung..."
        />

        <Text style={styles.label}>Geplante Dauer (in Minuten) *</Text>
        <TextInput 
          style={styles.input} 
          keyboardType="numeric" 
          value={duration} 
          onChangeText={setDuration}
          placeholder="z.B. 60"
        />

        <Text style={styles.label}>Planungs-Art</Text>
        <View style={styles.selectRow}>
          {SCHEDULING_TYPES.map(t => (
            <TouchableOpacity 
              key={t.value} 
              style={[styles.optionBadge, schedulingType === t.value && styles.optionBadgeSelected]}
              onPress={() => setSchedulingType(t.value)}
            >
              <Text style={[styles.optionText, schedulingType === t.value && styles.optionTextSelected]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {['FIXED', 'FLEXIBLE'].includes(schedulingType) && (
          <>
            <Text style={styles.label}>Häufigkeit</Text>
            <View style={styles.selectRow}>
              {FREQUENCIES.map(f => (
                <TouchableOpacity 
                  key={f.value} 
                  style={[styles.optionBadge, frequency === f.value && styles.optionBadgeSelected]}
                  onPress={() => setFrequency(f.value)}
                >
                  <Text style={[styles.optionText, frequency === f.value && styles.optionTextSelected]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {schedulingType === 'FIXED' && (
          <FixedSchedulingFields
            frequency={frequency}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            selectedWeekdays={selectedWeekdays}
            setSelectedWeekdays={setSelectedWeekdays}
          />
        )}

        {schedulingType === 'FLEXIBLE' && (
          <FlexibleSchedulingFields
            frequency={frequency}
            flexibleSlots={flexibleSlots}
            setFlexibleSlots={setFlexibleSlots}
            updateFlexibleSlot={updateFlexibleSlot}
          />
        )}
      </View>

      {/* ================= SCHRITT 2: KATEGORIE ================= */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Kategorie wählen</Text>
        <View style={styles.selectRow}>
          {ACTIVITY_TYPES.map(type => {
            const isSelected = selectedType === type;
            return (
              <TouchableOpacity key={type} style={[styles.typeBadge, isSelected && styles.typeBadgeSelected]} onPress={() => setSelectedType(type)}>
                <Text style={[styles.typeBadgeText, isSelected && styles.typeBadgeTextSelected]}>{type.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ================= SCHRITT 3: DYNAMISCHE DETAILS (Subkomponente) ================= */}
      <DynamicDetailsFields
        selectedType={selectedType}
        loadingSchema={loadingSchema}
        schema={schema}
        dynamicFormData={dynamicFormData}
        backendErrors={backendErrors}
        onInputChange={handleDynamicInputChange} // <-- WICHTIG: "onInputChange" muss es heißen!
      />

      {/* SAVE */}
      <TouchableOpacity style={[styles.saveButton, !selectedType && styles.saveButtonDisabled]} onPress={submitData} disabled={!selectedType}>
        <Text style={styles.saveButtonText}>Aktivität final speichern</Text>
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}