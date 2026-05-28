// components/calendar/WeekView.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Activity } from '../../types/activity';
import { RenderActivityList } from './RenderActivityList';
import { styles } from '../../styles/calendarStyles';

interface WeekViewProps {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    weekDays: Array<{
        dayName: string;
        dateString: string;
        dayNumber: number;
        isSelected: boolean;
        hasActivity: boolean;
    }>;
    changeWeek: (direction: 'prev' | 'next') => void;
    filteredActivities: Activity[];
}

export function WeekView({ selectedDate, setSelectedDate, weekDays, changeWeek, filteredActivities }: WeekViewProps) {
    return (
        <View style={{ flex: 1 }}>
            {/* Week Navigator */}
            <View style={styles.navigationHeader}>
                <TouchableOpacity onPress={() => changeWeek('prev')} style={{ padding: 10 }}>
                    <Text style={styles.arrowText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.timelineDateHeader}>Week View</Text>
                <TouchableOpacity onPress={() => changeWeek('next')} style={{ padding: 10 }}>
                    <Text style={styles.arrowText}>▶</Text>
                </TouchableOpacity>
            </View>

            {/* Horizontal Week Strip */}
            <View style={styles.weekStrip}>
                {weekDays.map((day, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedDate(day.dateString)}
                        style={[styles.weekDayButton, day.isSelected && styles.weekDayButtonActive]}
                    >
                        <Text style={[styles.weekDayName, day.isSelected && styles.textWhite]}>{day.dayName}</Text>
                        <Text style={[styles.weekDayNumber, day.isSelected && styles.textWhite]}>{day.dayNumber}</Text>
                        {day.hasActivity && !day.isSelected && <View style={styles.activityDot} />}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Activity List */}
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                <RenderActivityList selectedDate={selectedDate} filteredActivities={filteredActivities} />
            </ScrollView>
        </View>
    );
}