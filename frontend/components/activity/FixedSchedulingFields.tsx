import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { WEEKDAYS } from '../../constants/activityOptions';
import { styles } from '../../styles/activityStyles';

interface FixedSchedulingFieldsProps {
  frequency: string;
  date: string;
  setDate: (date: string) => void;
  time: string;
  setTime: (time: string) => void;
  selectedWeekdays: string[];
  setSelectedWeekdays: React.Dispatch<React.SetStateAction<string[]>>;
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
  return (
    <View style={styles.innerCard}>
      {frequency === 'ONCE' && (
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

      {frequency === 'DAILY' && (
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

      {frequency === 'WEEKLY' && (
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
  );
}