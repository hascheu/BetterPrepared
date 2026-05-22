import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'boolean' | 'select' | 'textarea';
  required: boolean;
  options?: { value: string | number; label: string }[];
}

const ACTIVITY_TYPES = ['training', 'competition', 'responsibility', 'recovery', 'other'];

const SCHEDULING_TYPES = [
  { value: 'fixed', label: 'Fixed (Fester Termin)' },
  { value: 'flexible', label: 'Flexible (Mehrere Optionen)' },
  { value: 'free', label: 'Free (Keine Vorgabe)' },
  { value: 'optional', label: 'Optional (Wenn es passt)' },
];

const FREQUENCIES = [
  { value: 'once', label: 'Einmalig' },
  { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' },
];

const WEEKDAYS = [
  { value: 'MON', label: 'Mo' }, { value: 'TUE', label: 'Di' }, 
  { value: 'WED', label: 'Mi' }, { value: 'THU', label: 'Do' }, 
  { value: 'FRI', label: 'Fr' }, { value: 'SAT', label: 'Sa' }, { value: 'SUN', label: 'So' }
];

// Interface für die komplexen flexiblen Slots
interface FlexibleSlot {
  date?: string;
  time: string;
  weekday?: string;
}

export default function AddActivityScreen() {
  const { token } = useAuth();
  const router = useRouter();

  // STAGE CONTROL
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // STATISCHE DATEN (Scheduling)
  const [title, setTitle] = useState('');
  const [schedulingType, setSchedulingType] = useState('fixed');
  const [frequency, setFrequency] = useState('once');
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
    if (schedulingType === 'flexible') {
      if (frequency === 'once') setFlexibleSlots([{ date: new Date().toISOString().split('T')[0], time: '' }]);
      if (frequency === 'daily') setFlexibleSlots([{ time: '' }]);
      if (frequency === 'weekly') setFlexibleSlots([{ weekday: 'MON', time: '' }]);
    }
  }, [schedulingType, frequency]);

  // Schema laden
  useEffect(() => {
    if (!selectedType) return;
    const fetchSchema = async () => {
      setLoadingSchema(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/activities/schema/?type=${selectedType}`, {
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

      const payload = {
        title,
        activity_type: selectedType,
        scheduling_type: schedulingType,
        frequency,
        duration: parseInt(duration, 10),
        // Sende zeitliche Parameter passend zur Auswahl
        date: schedulingType === 'fixed' ? date : (frequency === 'once' ? null : date),
        time: schedulingType === 'fixed' ? time : null,
        weekdays: (schedulingType === 'fixed' && frequency === 'weekly') ? selectedWeekdays : [],
        // Saubere, gefilterte flexible Slots mitsenden
        flexible_slots: schedulingType === 'flexible' ? flexibleSlots.filter(s => s.time !== '') : [],
        ...processedDynamicData,
      };

      const response = await fetch('http://127.0.0.1:8000/api/activities/', {
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
        Alert.alert("Fehler", "Bitte überprüfe die Eingaben.");
      }
    } catch (error) {
      Alert.alert("Fehler", "Server nicht erreichbar.");
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

        {['fixed', 'flexible'].includes(schedulingType) && (
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

        {/* --- LOGIK A: FIXED TERMINE --- */}
        {schedulingType === 'fixed' && (
          <View style={styles.innerCard}>
            {frequency === 'once' && (
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Datum (YYYY-MM-DD) *</Text>
                  <TextInput style={styles.input} value={date} onChangeText={setDate} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Uhrzeit (hh:mm) *</Text>
                  <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="10:00" />
                </View>
              </View>
            )}

            {frequency === 'daily' && (
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Startdatum *</Text>
                  <TextInput style={styles.input} value={date} onChangeText={setDate} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Uhrzeit *</Text>
                  <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="08:00" />
                </View>
              </View>
            )}

            {frequency === 'weekly' && (
              <View>
                <Text style={styles.label}>Wochentage wählen *</Text>
                <View style={styles.selectRow}>
                  {WEEKDAYS.map(d => {
                    const isSelected = selectedWeekdays.includes(d.value);
                    return (
                      <TouchableOpacity 
                        key={d.value} 
                        style={[styles.weekdayBadge, isSelected && styles.optionBadgeSelected]}
                        onPress={() => setSelectedWeekdays(prev => prev.includes(d.value) ? prev.filter(w => w !== d.value) : [...prev, d.value])}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{d.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Startdatum *</Text>
                    <TextInput style={styles.input} value={date} onChangeText={setDate} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Uhrzeit *</Text>
                    <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="18:30" />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* --- LOGIK B: FLEXIBLE OPTIONEN (Deine neue smarte Logik!) --- */}
        {schedulingType === 'flexible' && (
          <View style={styles.innerCard}>
            <Text style={styles.labelHeader}>Mögliche Terminvorschläge für die Umfrage:</Text>
            
            {flexibleSlots.map((slot, index) => (
              <View key={index} style={styles.slotRowContainer}>
                
                

                {/* 1. Einmalig -> Datum + Uhrzeit pro Slot */}
                {frequency === 'once' && (
                  <View style={styles.row}>
                    <TextInput 
                      style={[styles.input, { flex: 2, marginRight: 8 }]} 
                      value={slot.date || ''} // <--- HIER: Absicherung mit || ''
                      onChangeText={(v) => updateFlexibleSlot(index, 'date', v)}
                      placeholder="YYYY-MM-DD *"
                    />
                    <TextInput 
                      style={[styles.input, { flex: 1 }]} 
                      value={slot.time || ''} // <--- HIER: Absicherung mit || ''
                      onChangeText={(v) => updateFlexibleSlot(index, 'time', v)}
                      placeholder="hh:mm *"
                    />
                  </View>
                )}

                {/* 2. Täglich -> Nur Uhrzeiten pro Slot */}
                {frequency === 'daily' && (
                  <TextInput 
                    style={styles.input} 
                    value={slot.time || ''} // <--- HIER: Absicherung mit || ''
                    onChangeText={(v) => updateFlexibleSlot(index, 'time', v)}
                    placeholder={`Uhrzeit Option ${index + 1} (z.B. 14:30) *`}
                  />
                )}

                {/* 3. Wöchentlich -> Wochentag-Auswahl + Uhrzeit pro Slot */}
                {frequency === 'weekly' && (
                  <View style={styles.row}>
                    <View style={[styles.inlineSelect, { flex: 1.5, marginRight: 8 }]}>
                      {WEEKDAYS.map(w => (
                        <TouchableOpacity 
                          key={w.value} 
                          style={[styles.miniWeekdayBadge, slot.weekday === w.value && styles.optionBadgeSelected]}
                          onPress={() => updateFlexibleSlot(index, 'weekday', w.value)}
                        >
                          <Text style={[styles.miniOptionText, slot.weekday === w.value && styles.optionTextSelected]}>{w.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput 
                      style={[styles.input, { flex: 1 }]} 
                      value={slot.time || ''} // <--- HIER: Absicherung mit || ''
                      onChangeText={(v) => updateFlexibleSlot(index, 'time', v)}
                      placeholder="hh:mm *"
                    />
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setFlexibleSlots([...flexibleSlots, frequency === 'once' ? { date: new Date().toISOString().split('T')[0], time: '' } : frequency === 'weekly' ? { weekday: 'MON', time: '' } : { time: '' }])}
            >
              <Text style={styles.addButtonText}>+ Option hinzufügen</Text>
            </TouchableOpacity>
          </View>
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

      {/* ================= SCHRITT 3: DYNAMISCHE DETAILS ================= */}
      {loadingSchema && <View style={styles.center}><ActivityIndicator size="small" color="#007AFF" /></View>}

      {selectedType && !loadingSchema && schema.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Spezifische Details ({selectedType.toUpperCase()})</Text>
          {schema.map(field => {
            const hasError = !!backendErrors[field.name];
            if (field.type === 'boolean') {
              return (
                <View key={field.name} style={styles.switchContainer}>
                  <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
                  <Switch value={!!dynamicFormData[field.name]} onValueChange={(v) => handleDynamicInputChange(field.name, v)} />
                </View>
              );
            }
            return (
              <View key={field.name} style={styles.fieldBlock}>
                <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
                <TextInput 
                  style={[styles.input, hasError && styles.inputError]}
                  placeholder={field.label}
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  value={dynamicFormData[field.name]?.toString() || ''}
                  onChangeText={(v) => handleDynamicInputChange(field.name, v)}
                />
              </View>
            );
          })}
        </View>
      )}

      {/* SAVE */}
      <TouchableOpacity style={[styles.saveButton, !selectedType && styles.saveButtonDisabled]} onPress={submitData} disabled={!selectedType}>
        <Text style={styles.saveButtonText}>Aktivität final speichern</Text>
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f7' },
  center: { padding: 20, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 10, color: '#1c1c1e', textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  innerCard: { backgroundColor: '#f8f8fa', padding: 12, borderRadius: 10, marginTop: 5, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#007AFF', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f2', paddingBottom: 6 },
  fieldBlock: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 6, fontWeight: '500' },
  labelHeader: { fontSize: 14, color: '#333', marginBottom: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e5e5ea', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16, backgroundColor: '#fff' },
  inputError: { borderColor: '#ff3b30', backgroundColor: '#fff9f9' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 8 },
  inlineSelect: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, backgroundColor: '#fff', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e5e5ea', marginBottom: 12 },
  optionBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e5e5ea' },
  optionBadgeSelected: { backgroundColor: '#007AFF' },
  weekdayBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e5e5ea', justifyContent: 'center', alignItems: 'center' },
  miniWeekdayBadge: { paddingHorizontal: 6, paddingVertical: 5, borderRadius: 6, backgroundColor: '#e5e5ea', flex: 1, alignItems: 'center' },
  optionText: { color: '#333', fontSize: 13, textAlign: 'center' },
  miniOptionText: { color: '#333', fontSize: 11, fontWeight: '500' },
  optionTextSelected: { color: '#fff', fontWeight: 'bold' },
  typeBadge: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF' },
  typeBadgeSelected: { backgroundColor: '#007AFF' },
  typeBadgeText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },
  typeBadgeTextSelected: { color: '#fff' },
  addButton: { padding: 10, backgroundColor: '#e1f0ff', borderRadius: 8, alignItems: 'center', marginTop: 5 },
  addButtonText: { color: '#007AFF', fontWeight: '600' },
  saveButton: { backgroundColor: '#34c759', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveButtonDisabled: { backgroundColor: '#aeaea2' },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  slotRowContainer: { marginBottom: 5 }
});