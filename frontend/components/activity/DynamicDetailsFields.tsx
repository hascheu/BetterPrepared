import React from 'react';
import { View, Text, TextInput, Switch, ActivityIndicator } from 'react-native';
import { FormField } from '../../constants/activityOptions';
import { styles } from '../../styles/activityStyles';

interface DynamicDetailsFieldsProps {
  selectedType: string | null;
  loadingSchema: boolean;
  schema: FormField[];
  dynamicFormData: Record<string, any>;
  backendErrors: Record<string, string[]>;
  onInputChange: (name: string, value: any) => void; // <-- Geändert zu onInputChange
}

export function DynamicDetailsFields({
  selectedType,
  loadingSchema,
  schema,
  dynamicFormData,
  backendErrors,
  onInputChange, // <-- Geändert zu onInputChange
}: DynamicDetailsFieldsProps) {
  
  if (loadingSchema) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (!selectedType || schema.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>3. Spezifische Details ({selectedType.toUpperCase()})</Text>
      {schema.map(field => {
        const hasError = !!backendErrors[field.name];
        
        if (field.type === 'boolean') {
          return (
            <View key={field.name} style={styles.switchContainer}>
              <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
              <Switch 
                value={!!dynamicFormData[field.name]} 
                onValueChange={(v) => onInputChange(field.name, v)} // <-- Hier angepasst
              />
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
              onChangeText={(v) => onInputChange(field.name, v)} // <-- Hier angepasst
            />
          </View>
        );
      })}
    </View>
  );
}