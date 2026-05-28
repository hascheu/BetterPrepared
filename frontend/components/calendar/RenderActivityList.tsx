// components/calendar/RenderActivityList.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Activity } from '../../types/activity';
import { styles } from '../../styles/calendarStyles';

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