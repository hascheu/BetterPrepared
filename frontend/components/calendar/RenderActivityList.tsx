// components/calendar/RenderActivityList.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Activity } from '../../types/activity';
import { styles } from '../../styles/calendarStyles';
// Beide Hilfsfunktionen aus dem Theme importieren
import { getActivityColor, getTextColorForBackground } from '../../styles/activityTheme';

interface RenderActivityListProps {
    selectedDate: string;
    filteredActivities: Activity[];
}

export function RenderActivityList({ selectedDate, filteredActivities }: RenderActivityListProps) {
    
    return (
        <>
            <Text style={styles.sectionSubtitle}>Activities on {selectedDate}:</Text>
            {filteredActivities.length === 0 ? (
                <Text style={styles.emptyText}>No activities scheduled.</Text>
            ) : (
                filteredActivities.map((activity) => {
                    // 1. Berechne die dynamische Farbe basierend auf Kind & SchedulingType
                    const badgeColor = getActivityColor(activity.activity_kind, activity.scheduling_type);
                    // 2. Berechne die passende Textfarbe für optimalen Kontrast (Schwarz oder Weiß)
                    const badgeTextColor = getTextColorForBackground(activity.scheduling_type);

                    return (
                        // Wir färben den linken Rand der Karte (borderLeftColor) in der Kategorienfarbe ein
                        <View key={activity.id} style={[styles.card, { borderLeftColor: badgeColor }]}>
                            
                            {/* Obere Zeile: Titel links, Flexibilitäts-Badge rechts */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text style={styles.activityTitle}>{activity.title}</Text>
                                
                                {/* Das Flexibilitäts-Badge */}
                                <View style={{ backgroundColor: badgeColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                    <Text style={{ color: badgeTextColor, fontSize: 10, fontWeight: 'bold' }}>
                                        {activity.scheduling_type}
                                    </Text>
                                </View>
                            </View>

                            {/* Untere Zeile: Uhrzeit & die Aktivitätsart als Text */}
                            <Text style={styles.activityTime}>
                                ⏰ {activity.start_time || 'Ganztägig'} {activity.end_time ? `- ${activity.end_time}` : ''} 
                                <Text style={{ color: '#888' }}>  |  {activity.activity_kind}</Text>
                            </Text>
                        </View>
                    );
                })
            )}
        </>
    );
}