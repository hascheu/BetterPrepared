// frontend/styles/activityTheme.ts
import { Activity } from '../types/activity';

// 1. Definition der Grundfarben (Hex-Codes) für jede Kategorie
const CATEGORY_COLORS = {
    TRAINING: {
        dark: '#1d4ed8',     // Dunkelblau
        medium: '#3b82f6',   // Mittelblau
        light: '#93c5fd',    // Hellblau
    },
    COMPETITION: {
        dark: '#b91c1c',     // Dunkelrot
        medium: '#ef4444',   // Mittelrot
        light: '#fca5a5',    // Hellrot
    },
    RESPONSIBILITY: {
        dark: '#a16207',     // Dunkelgelb/Braun
        medium: '#eab308',   // Mittelgelb
        light: '#fef08a',    // Hellgelb
    },
    RECOVERY: {
        dark: '#047857',     // Dunkelgrün
        medium: '#10b981',   // Mittelgrün
        light: '#a7f3d0',    // Hellgrün
    },
    OTHER: {
        dark: '#4b5563',     // Dunkelgrau
        medium: '#9ca3af',   // Mittelgrau
        light: '#e5e7eb',    // Hellgrau
    },
    BASE: {
        dark: '#4b5563',
        medium: '#9ca3af',
        light: '#e5e7eb',
    }
};

/**
 * Holt die exakte Farbe basierend auf Kategorie und Planungsart (scheduling_type)
 */
export function getActivityColor(kind: Activity['activity_kind'], schedulingType: string): string {
    const category = CATEGORY_COLORS[kind] || CATEGORY_COLORS.BASE;

    // Intensitäts-Stufen ermitteln
    switch (schedulingType) {
        case 'FIXED':
            return category.dark;
        case 'FLEXIBLE':
            return category.medium;
        case 'FREE':
        case 'OPTIONAL':
            return category.light;
        default:
            return category.medium; // Fallback
    }
}

/**
 * Hilfsfunktion, um passenden Text-Kontrast (Weiß oder Schwarz) zu liefern
 */
export function getTextColorForBackground(schedulingType: string): string {
    // Bei hellen Hintergründen (FREE/OPTIONAL) dunkle Schrift, sonst weiße Schrift
    if (schedulingType === 'FREE' || schedulingType === 'OPTIONAL') {
        return '#111111';
    }
    return '#ffffff';
}