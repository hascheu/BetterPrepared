// components/calendar/DayView.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Timeline } from 'react-native-calendars';
import { styles } from '../../styles/calendarStyles';

interface DayViewProps {
    selectedDate: string;
    changeDay: (direction: 'prev' | 'next') => void;
    timelineEvents: Array<{
        start: string;
        end: string;
        title: string;
        summary: string;
        color: string;
    }>;
}

export function DayView({ selectedDate, changeDay, timelineEvents }: DayViewProps) {
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Day Navigator */}
            <View style={styles.navigationHeader}>
                <TouchableOpacity onPress={() => changeDay('prev')} style={{ padding: 10 }}>
                    <Text style={styles.arrowText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.timelineDateHeader}>{selectedDate}</Text>
                <TouchableOpacity onPress={() => changeDay('next')} style={{ padding: 10 }}>
                    <Text style={styles.arrowText}>▶</Text>
                </TouchableOpacity>
            </View>

            {/* Hier werden die Events reingereicht */}
            <Timeline
                format24h={true}
                events={timelineEvents} // <-- Verarbeitet die umgewandelten Daten
                start={0}
                end={24}
                theme={{
                    timeLabelColor: '#666',
                    arrowColor: '#007AFF',
                    backgroundColor: '#fff',
                } as any}
            />
        </View>
    );
}