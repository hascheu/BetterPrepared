import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { WEEKDAYS, FlexibleSlot } from '../../constants/activityOptions';
import { styles } from '../../styles/activityStyles';

interface FlexibleSchedulingFieldsProps {
  frequency: string;
  flexibleSlots: FlexibleSlot[];
  setFlexibleSlots: React.Dispatch<React.SetStateAction<FlexibleSlot[]>>;
  updateFlexibleSlot: (index: number, key: keyof FlexibleSlot, value: string) => void;
}

export function FlexibleSchedulingFields({
  frequency,
  flexibleSlots,
  setFlexibleSlots,
  updateFlexibleSlot,
}: FlexibleSchedulingFieldsProps) {
  return (
    <View style={styles.innerCard}>
      <Text style={styles.labelHeader}>Mögliche Terminvorschläge für die Umfrage:</Text>
      
      {flexibleSlots.map((slot, index) => (
        <View key={index} style={styles.slotRowContainer}>
          
          {/* 1. Einmalig -> Datum + Uhrzeit pro Slot */}
          {frequency === 'ONCE' && (
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, { flex: 2, marginRight: 8 }]} 
                value={slot.date || ''} 
                onChangeText={(v) => updateFlexibleSlot(index, 'date', v)}
                placeholder="YYYY-MM-DD *"
              />
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                value={slot.time || ''} 
                onChangeText={(v) => updateFlexibleSlot(index, 'time', v)}
                placeholder="hh:mm *"
              />
            </View>
          )}

          {/* 2. Täglich -> Nur Uhrzeiten pro Slot */}
          {frequency === 'DAILY' && (
            <TextInput 
              style={styles.input} 
              value={slot.time || ''} 
              onChangeText={(v) => updateFlexibleSlot(index, 'time', v)}
              placeholder={`Uhrzeit Option ${index + 1} (z.B. 14:30) *`}
            />
          )}

          {/* 3. Wöchentlich -> Wochentag-Auswahl + Uhrzeit pro Slot */}
          {frequency === 'WEEKLY' && (
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
                value={slot.time || ''} 
                onChangeText={(v) => updateFlexibleSlot(index, 'time', v)}
                placeholder="hh:mm *"
              />
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setFlexibleSlots([...flexibleSlots, frequency === 'ONCE' ? { date: new Date().toISOString().split('T')[0], time: '' } : frequency === 'WEEKLY' ? { weekday: 'MON', time: '' } : { time: '' }])}
      >
        <Text style={styles.addButtonText}>+ Option hinzufügen</Text>
      </TouchableOpacity>
    </View>
  );
}