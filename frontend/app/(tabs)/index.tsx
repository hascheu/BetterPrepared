// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.welcomeText}>Welcome to Kangaroo Sport! 👋</Text>
            <Text style={styles.subText}>Ready for your next training?</Text>

            {/* Der Link führt zur plan.tsx im selben Ordner */}
            <Link href="/plan" asChild>
                <Pressable style={styles.button}>
                    <Text style={styles.buttonText}>Your personal plan</Text>
                </Pressable>
            </Link>
            <Link href="/activities" asChild>
                <Pressable style={styles.button}>
                    <Text style={styles.buttonText}>Add Activity</Text>
                </Pressable>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#fff',
        padding: 20 
    },
    welcomeText: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
    subText: { fontSize: 16, color: '#666', marginVertical: 20 },
    button: {
        backgroundColor: '#007AFF', // Ein schönes Blau
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});