import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Timeline, CalendarProvider, WeekCalendar } from 'react-native-calendars';
import { useActivities } from '../../hooks/useActivities';

interface Activity {
    id: number;
    title: string;
    date: string;
    start_time?: string;
    end_time?: string;
    extra_details?: {
        training_type?: string;
    };
}

type ViewMode = 'Month' | 'Week' | 'Day';

export default function PlanScreen() {
    const { activities, loading } = useActivities() as { activities: Activity[], loading: boolean };
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<ViewMode>('Month');

    // 1. MARKED DATES (For Month & Week dot indicators)
    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};
        activities.forEach((activity) => {
            if (activity.date) {
                marks[activity.date] = { marked: true, dotColor: '#007AFF' };
            }
        });
        marks[selectedDate] = {
            ...marks[selectedDate],
            selected: true,
            selectedColor: '#007AFF',
        };
        return marks;
    }, [activities, selectedDate]);

    // 2. FILTER ACTIVITIES FOR LIST VIEW (Month & Week)
    const filteredActivities = useMemo(() => {
        return activities.filter(activity => activity.date === selectedDate);
    }, [activities, selectedDate]);

    // 3. FORMAT EVENTS FOR THE DAY TIMELINE
    const timelineEvents = useMemo(() => {
        return activities
            .filter(act => act.date === selectedDate)
            .map(act => ({
                start: `${act.date} ${act.start_time || '12:00'}:00`,
                end: `${act.date} ${act.end_time || '13:00'}:00`,
                title: act.title,
                summary: act.extra_details?.training_type || 'Activity',
                color: '#e1f5fe',
            }));
    }, [activities, selectedDate]);

    if (loading) return <Text style={styles.centerText}>Loading schedule...</Text>;

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.title}>My Kangaroo Plan</Text>
            
            {/* ================= VIEW SWITCHER BUTTONS ================= */}
            <View style={styles.switcherContainer}>
                {(['Month', 'Week', 'Day'] as ViewMode[]).map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.switcherButton, viewMode === mode && styles.switcherButtonActive]}
                        onPress={() => setViewMode(mode)}
                    >
                        <Text style={[styles.switcherText, viewMode === mode && styles.switcherTextActive]}>
                            {mode}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ================= 1. MONTH VIEW ================= */}
            {viewMode === 'Month' && (
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
            )}

            {/* ================= 2. WEEK VIEW ================= */}
            {viewMode === 'Week' && (
                <View style={{ flex: 1 }}>
                    <CalendarProvider date={selectedDate} onDateChanged={(date) => setSelectedDate(date)}>
                        <WeekCalendar 
                            markedDates={markedDates} 
                            firstDay={1} // Start week on Monday
                            theme={{
                                todayTextColor: '#007AFF',
                                selectedDayBackgroundColor: '#007AFF',
                            }}
                        />
                    </CalendarProvider>
                    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                        <RenderActivityList selectedDate={selectedDate} filteredActivities={filteredActivities} />
                    </ScrollView>
                </View>
            )}

            {/* ================= 3. DAY VIEW (TIMELINE) ================= */}
            {viewMode === 'Day' && (
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <Text style={styles.timelineDateHeader}>Timeline for {selectedDate}</Text>
                    <Timeline
                        format24h={true}
                        events={timelineEvents}
                        start={0}
                        end={24}
                        theme={{
                            timeLabelColor: '#666',
                            arrowColor: '#007AFF',
                            backgroundColor: '#fff',
                        } as any}
                    />
                </View>
            )}
        </View>
    );
}

// Sub-component to prevent code duplication for the list view
function RenderActivityList({ selectedDate, filteredActivities }: { selectedDate: string, filteredActivities: Activity[] }) {
    return (
        <>
            <Text style={styles.sectionSubtitle}>Activities on {selectedDate}:</Text>
            {filteredActivities.length === 0 ? (
                <Text style={styles.emptyText}>No activities scheduled.</Text>
            ) : (
                filteredActivities.map((activity) => (
                    <View key={activity.id} style={styles.card}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityTime}>
                            ⏰ {activity.start_time || 'N/A'} - {activity.end_time || 'N/A'}
                        </Text>
                    </View>
                ))
            )}
        </>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 10 },
    container: { paddingHorizontal: 20, flex: 1 },
    title: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 10, marginTop: 10 },
    
    // Switcher
    switcherContainer: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 8, marginHorizontal: 20, marginBottom: 15, padding: 3 },
    switcherButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    switcherButtonActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity:0.1, shadowRadius:1 },
    switcherText: { fontSize: 14, fontWeight: '500', color: '#666' },
    switcherTextActive: { color: '#007AFF', fontWeight: 'bold' },

    calendarContainer: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 10 },
    sectionSubtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#333' },
    timelineDateHeader: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginVertical: 8, color: '#666' },
    card: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
    activityTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
    activityTime: { fontSize: 13, color: '#666', marginTop: 4 },
    centerText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
    emptyText: { color: '#888', fontStyle: 'italic', marginTop: 5 }
});