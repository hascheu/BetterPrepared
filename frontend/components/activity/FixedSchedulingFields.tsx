import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { WEEKDAYS } from '../../constants/activityOptions';
import { styles } from '../../styles/activityStyles';

interface FixedSchedulingFieldsProps {
  frequency: string;
  date: string;
  setDate: (d: string) => void;
  time: string;
  setTime: (t: string) => void;
  selectedWeekdays: string[];
  setSelectedWeekdays: (w: string[] | ((prev: string[]) => string[])) => void; // Erlaubt funktionales Update
}

export function FixedSchedulingFields({
  frequency,
  date,
  setDate,
  time,
  setTime,
  selectedWeekdays,
  setSelectedWeekdays,
}: FixedSchedulingFieldsProps) {

  // Hilfsfunktion für die Wochentag-Auswahl
  const toggleWeekday = (code: string) => {
    if (selectedWeekdays.includes(code)) {
      setSelectedWeekdays(selectedWeekdays.filter(item => item !== code));
    } else {
      setSelectedWeekdays([...selectedWeekdays, code]);
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      {/* 1. DATUM (wird nur bei einmaligen Terminen gebraucht) */}
      {frequency === 'ONCE' && (
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Datum (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate} // Schreibt den Wert zurück in die add.tsx
            placeholder="z.B. 2026-05-24"
          />
        </View>
      )}

      {/* 2. UHRZEIT (Wird IMMER gebraucht) */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Start-Uhrzeit (HH:MM) *</Text>
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime} // WICHTIG: Schreibt den Wert direkt in die add.tsx zurück!
          placeholder="z.B. 14:30"
        />
      </View>

      {/* 3. WOCHENTAGE (wird nur bei wöchentlicher Frequenz gebraucht) */}
      {frequency === 'WEEKLY' && (
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Wochentage auswählen *</Text>
          <View style={styles.selectRow}>
            {WEEKDAYS.map(day => {
              const isSelected = selectedWeekdays.includes(day.value);
              return (
                <TouchableOpacity
                  key={day.value}
                  style={[styles.weekdayBadge, isSelected && styles.optionBadgeSelected]}
                  onPress={() => toggleWeekday(day.value)} // Aktualisiert die add.tsx
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}