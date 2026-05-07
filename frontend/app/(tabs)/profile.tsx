import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useActivities } from '../../hooks/useActivities';

export default function ProfileScreen() {
    
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>My Profile</Text>
            
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    activityTitle: { fontSize: 18, fontWeight: '600' }
});