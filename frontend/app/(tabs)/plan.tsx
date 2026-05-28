// app/(tabs)/plan.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useActivities } from '../../hooks/useActivities';
import { styles } from '../../styles/calendarStyles';
import { Activity } from '../../types/activity';

// Neue Views importieren
import { MonthView } from '../../components/calendar/MonthView';
import { WeekView } from '../../components/calendar/WeekView';
import { DayView } from '../../components/calendar/DayView';

type ViewMode = 'Month' | 'Week' | 'Day';

export default function PlanScreen() {
    const { activities, loading } = useActivities() as { activities: Activity[], loading: boolean };
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<ViewMode>('Month');

    // NAVIGATORS
    const changeDay = (direction: 'prev' | 'next') => {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    const changeWeek = (direction: 'prev' | 'next') => {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    // 1. CALENDAR DOTS
    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};
        activities.forEach((act) => {
            if (act.date) marks[act.date] = { marked: true, dotColor: '#007AFF' };
        });
        marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#007AFF' };
        return marks;
    }, [activities, selectedDate]);

    // 2. FILTERED ACTIVITIES
    const filteredActivities = useMemo(() => {
        return activities.filter(act => act.date === selectedDate);
    }, [activities, selectedDate]);

    // 3. TIMELINE EVENTS
    const timelineEvents = useMemo(() => {
        return activities
            .filter(act => act.date === selectedDate) // Nur Aktivitäten für den aktuellen Tag
            .map(act => {
                // Falls dein Backend mal keine Zeit liefert, setzen wir Standardwerte (Fallback)
                const startTime = act.start_time ? act.start_time : '12:00';
                const endTime = act.end_time ? act.end_time : '13:00';

                return {
                    start: `${act.date} ${startTime}:00`, // z.B. "2026-05-28 14:00:00"
                    end: `${act.date} ${endTime}:00`,     // z.B. "2026-05-28 15:30:00"
                    title: act.title,
                    summary: act.extra_details?.training_type || 'Training',
                    color: '#e1f5fe', // Ein schönes, helles Blau für den Block
                };
            });
    }, [activities, selectedDate]);

    // 4. WEEK STRIP DAYS
    const weekDays = useMemo(() => {
        const current = new Date(selectedDate);
        const dayOfWeek = current.getDay();
        const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(current);
        monday.setDate(current.getDate() + distanceToMonday);

        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, index) => {
            const dateObj = new Date(monday);
            dateObj.setDate(monday.getDate() + index);
            const dateString = dateObj.toISOString().split('T')[0];
            return {
                dayName,
                dateString,
                dayNumber: dateObj.getDate(),
                isSelected: dateString === selectedDate,
                hasActivity: activities.some(act => act.date === dateString)
            };
        });
    }, [activities, selectedDate]);

    if (loading) return <Text style={styles.centerText}>Loading schedule...</Text>;

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.title}>My Kangaroo Plan</Text>
            
            {/* View Switcher */}
            <View style={styles.switcherContainer}>
                {(['Month', 'Week', 'Day'] as ViewMode[]).map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.switcherButton, viewMode === mode && styles.switcherButtonActive]}
                        onPress={() => setViewMode(mode)}
                    >
                        <Text style={[styles.switcherText, viewMode === mode && styles.switcherTextActive]}>{mode}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Render Active View */}
            {viewMode === 'Month' && (
                <MonthView selectedDate={selectedDate} setSelectedDate={setSelectedDate} markedDates={markedDates} filteredActivities={filteredActivities} />
            )}
            {viewMode === 'Week' && (
                <WeekView selectedDate={selectedDate} setSelectedDate={setSelectedDate} weekDays={weekDays} changeWeek={changeWeek} filteredActivities={filteredActivities} />
            )}
            {viewMode === 'Day' && (
                <DayView 
                    selectedDate={selectedDate} 
                    changeDay={changeDay} 
                    timelineEvents={timelineEvents} // <-- Das hier ist entscheidend!
                />
            )}
        </View>
    );
}