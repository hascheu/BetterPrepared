
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'boolean' | 'select' | 'textarea';
  required: boolean;
  options?: { value: string | number; label: string }[];
}

export interface FlexibleSlot {
  date?: string;
  time: string;
  weekday?: string;
}

export const ACTIVITY_TYPES = ['training', 'competition', 'responsibility', 'recovery', 'other'];

// constants/activityOptions.ts

export const SCHEDULING_TYPES = [
  { value: 'FIXED', label: 'Fixed (Fester Termin)' },      // <-- 'FIXED' statt 'fixed'
  { value: 'FLEXIBLE', label: 'Flexible (Mehrere Optionen)' }, // <-- 'FLEXIBLE' statt 'flexible'
  { value: 'FREE', label: 'Free (Keine Vorgabe)' },
  { value: 'OPTIONAL', label: 'Optional (Wenn es passt)' },
];

export const FREQUENCIES = [
  { value: 'ONCE', label: 'Einmalig' },     // <-- 'ONCE' statt 'once'
  { value: 'DAILY', label: 'Täglich' },     // <-- 'DAILY' statt 'daily'
  { value: 'WEEKLY', label: 'Wöchentlich' }, // <-- 'WEEKLY' statt 'weekly'
];

export const WEEKDAYS = [
  { value: 'MON', label: 'Mo' }, { value: 'TUE', label: 'Di' }, 
  { value: 'WED', label: 'Mi' }, { value: 'THU', label: 'Do' }, 
  { value: 'FRI', label: 'Fr' }, { value: 'SAT', label: 'Sa' }, { value: 'SUN', label: 'So' }
];