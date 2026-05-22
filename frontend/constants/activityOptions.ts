
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

export const SCHEDULING_TYPES = [
  { value: 'fixed', label: 'Fixed (Fester Termin)' },
  { value: 'flexible', label: 'Flexible (Mehrere Optionen)' },
  { value: 'free', label: 'Free (Keine Vorgabe)' },
  { value: 'optional', label: 'Optional (Wenn es passt)' },
];

export const FREQUENCIES = [
  { value: 'once', label: 'Einmalig' },
  { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' },
];

export const WEEKDAYS = [
  { value: 'MON', label: 'Mo' }, { value: 'TUE', label: 'Di' }, 
  { value: 'WED', label: 'Mi' }, { value: 'THU', label: 'Do' }, 
  { value: 'FRI', label: 'Fr' }, { value: 'SAT', label: 'Sa' }, { value: 'SUN', label: 'So' }
];