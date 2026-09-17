// components/calendar/MonthView.tsx
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Activity } from '../../types/activity';
import { RenderActivityList } from './RenderActivityList'; // Helfer-Komponente für die Liste
import { styles } from '../../styles/calendarStyles';

interface MonthViewProps {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    markedDates: Record<string, any>;
    filteredActivities: Activity[];
}

export function MonthView({ selectedDate, setSelectedDate, markedDates, filteredActivities }: MonthViewProps) {
    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.calendarContainer}>
                <Calendar
                    current={selectedDate}
                    onDayPress={(day) => setSelectedDate(day.dateString)}
                    markedDates={markedDates}
                    theme={{
                        todayTextColor: '#007AFF',
                        arrowColor: '#007AFF',
                        indicatorColor: '#007AFF',
                    }}
                />
            </View>
            <RenderActivityList selectedDate={selectedDate} filteredActivities={filteredActivities} />
        </ScrollView>
    );
}