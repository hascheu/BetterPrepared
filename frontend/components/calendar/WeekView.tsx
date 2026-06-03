// components/calendar/WeekView.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Activity } from '../../types/activity';
import { styles } from '../../styles/calendarStyles';
import { getActivityColor } from '../../styles/activityTheme';

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
    activities: Activity[];
}

const TIMELINE_LEFT_MARGIN = 50; 
const HOUR_HEIGHT = 60; 
const START_HOUR = 7;
const END_HOUR = 23;
const HOURS_ARRAY = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export function WeekView({ selectedDate, setSelectedDate, weekDays, changeWeek, activities }: WeekViewProps) {
    const { width: screenWidth } = useWindowDimensions();

    const isDesktop = screenWidth >= 768;
    const columnsToShow = isDesktop ? 7 : 3;
    const columnWidth = (screenWidth - TIMELINE_LEFT_MARGIN) / columnsToShow;
    const totalGridHeight = HOURS_ARRAY.length * HOUR_HEIGHT;

    // Hilfsfunktion für die Pixel-Positionierung
    const getTopAndHeight = (startTimeStr: string | null, endTimeStr: string | null) => {
        const start = startTimeStr || '12:00';
        const end = endTimeStr || '13:00';

        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        const startMinutesSinceMidnight = startH * 60 + startM;
        const endMinutesSinceMidnight = endH * 60 + endM;
        const startHourMinutes = START_HOUR * 60;

        const top = ((startMinutesSinceMidnight - startHourMinutes) / 60) * HOUR_HEIGHT;
        const durationMinutes = endMinutesSinceMidnight - startMinutesSinceMidnight;
        const height = (durationMinutes / 60) * HOUR_HEIGHT;

        return { top: Math.max(0, top), height: Math.max(35, height) };
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            
            {/* 1. Week Navigator Header */}
            <View style={styles.navigationHeader}>
                <TouchableOpacity onPress={() => changeWeek('prev')} style={{ padding: 10 }}>
                    <Text style={styles.arrowText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.timelineDateHeader}>
                    {weekDays[0]?.dayNumber}. - {weekDays[6]?.dayNumber}. {new Date(selectedDate).toLocaleString('de-DE', { month: 'short' })}
                </Text>
                <TouchableOpacity onPress={() => changeWeek('next')} style={{ padding: 10 }}>
                    <Text style={styles.arrowText}>▶</Text>
                </TouchableOpacity>
            </View>

            {/* 2. Horizontal Week Strip */}
            <View style={styles.weekStrip}>
                {weekDays.map((day, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedDate(day.dateString)}
                        style={[
                            styles.weekDayButton, 
                            day.isSelected && styles.weekDayButtonActive,
                            isDesktop && { paddingVertical: 10 }
                        ]}
                    >
                        <Text style={[styles.weekDayName, day.isSelected && styles.textWhite, isDesktop && { fontSize: 14 }]}>
                            {day.dayName}
                        </Text>
                        <Text style={[styles.weekDayNumber, day.isSelected && styles.textWhite, isDesktop && { fontSize: 18 }]}>
                            {day.dayNumber}
                        </Text>
                        {day.hasActivity && !day.isSelected && <View style={styles.activityDot} />}
                    </TouchableOpacity>
                ))}
            </View>

            {/* 3. DAS SUPERSMOOTHE SCROLL-GRID */}
            {/* Dieses äußere ScrollView steuert jetzt die VERTIKALE Achse (07:00 bis 23:00) für ALLES */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                
                {/* Spalten-Header (fixiert über den Spalten, scrollt nach unten weg) */}
                <View style={{ flexDirection: 'row', height: 30, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                    <View style={{ width: TIMELINE_LEFT_MARGIN }} /> {/* Linker Puffer für die Zeitleiste */}
                    <ScrollView horizontal={!isDesktop} scrollEnabled={!isDesktop} showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row' }}>
                            {weekDays.map((day) => (
                                <View key={day.dateString} style={{ width: columnWidth, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: isDesktop ? 13 : 11, color: '#666', fontWeight: '600' }}>
                                        {day.dayName} {day.dayNumber}.
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Zeitleiste und Grid nebeneinander gepackt */}
                <View style={{ flexDirection: 'row' }}>
                    
                    {/* STATISCHE ZEITLEISTE LINKS */}
                    <View style={{ width: TIMELINE_LEFT_MARGIN, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e0e0e0' }}>
                        {HOURS_ARRAY.map((hour) => (
                            <View key={hour} style={{ height: HOUR_HEIGHT, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 }}>
                                <Text style={{ fontSize: 11, color: '#666', fontWeight: '500' }}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
                            </View>
                        ))}
                    </View>

                    {/* HORIZONTAL SCROLLBARER INHALT (Die Spalten mit den Terminen) */}
                    <ScrollView horizontal={!isDesktop} scrollEnabled={!isDesktop} showsHorizontalScrollIndicator={!isDesktop}>
                        <View style={{ flexDirection: 'row', height: totalGridHeight, position: 'relative' }}>
                            
                            {/* Hintergrund-Stundenlinien (gehen über alle Spalten durch) */}
                            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
                                {HOURS_ARRAY.map((_, i) => (
                                    <View key={i} style={{ height: HOUR_HEIGHT, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} />
                                ))}
                            </View>

                            {/* Die echten Tages-Spalten */}
                            {weekDays.map((day) => {
                                const dayActivities = activities?.filter(act => act.date === day.dateString) || [];

                                return (
                                    <View key={day.dateString} style={{ width: columnWidth, height: '100%', borderRightWidth: 1, borderRightColor: '#e0e0e0', position: 'relative' }}>
                                        
                                        {dayActivities.map((act) => {
                                            const { top, height } = getTopAndHeight(act.start_time, act.end_time);
                                            const kind = (act.activity_kind || 'BASE').toUpperCase() as any;
                                            const schedType = (act.scheduling_type || 'FIXED').toUpperCase();
                                            const eventBgColor = getActivityColor(kind, schedType);

                                            return (
                                                <TouchableOpacity
                                                    key={act.id}
                                                    onPress={() => setSelectedDate(day.dateString)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: top,
                                                        left: 3,
                                                        right: 3,
                                                        height: height - 2, 
                                                        backgroundColor: eventBgColor,
                                                        borderRadius: 6,
                                                        padding: 5,
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 1 },
                                                        shadowOpacity: 0.15,
                                                        shadowRadius: 2,
                                                        elevation: 2,
                                                        zIndex: 10,
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }} numberOfLines={1}>
                                                        {act.title}
                                                    </Text>
                                                    {height > 40 && (
                                                        <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>
                                                            {act.start_time}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                );
                            })}

                        </View>
                    </ScrollView>

                </View>
            </ScrollView>
        </View>
    );
}