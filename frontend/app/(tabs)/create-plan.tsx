import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    StyleSheet, 
    ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { generateWeeklySchedule, saveWeeklyVersion } from '../../services/api';
import { WeekView } from '../../components/calendar/WeekView';
import { Activity } from '../../types/activity';

export default function CreatePlanScreen() {
    const router = useRouter();

    // Hilfsfunktion: Berechnet den Montag der aktuellen/ausgewählten Woche
    const getMonday = (d: Date) => {
        const dateObj = new Date(d);
        const day = dateObj.getDay();
        const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(dateObj.setDate(diff));
    };

    // Formular- & Status-States
    const [selectedMonday, setSelectedMonday] = useState<string>(
        getMonday(new Date()).toISOString().split('T')[0]
    );
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Generierte Versionen & Ausgewählte Version
    const [generatedVersions, setGeneratedVersions] = useState<any[]>([]);
    const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
    const [focusedDate, setFocusedDate] = useState<string>(selectedMonday);

    // Wochen-Navigator im Formular
    const changeWeekSelection = (weeksToAdd: number) => {
        const current = new Date(selectedMonday);
        current.setDate(current.getDate() + weeksToAdd * 7);
        const newMonday = getMonday(current).toISOString().split('T')[0];
        setSelectedMonday(newMonday);
        setFocusedDate(newMonday);
    };

    // 1. Plan vom Backend generieren lassen
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await generateWeeklySchedule(selectedMonday);
            if (response?.versions && response.versions.length > 0) {
                setGeneratedVersions(response.versions);
                setSelectedVersionIndex(0);
            } else {
                Alert.alert('Hinweis', 'Es konnten keine Kalenderversionen berechnet werden.');
            }
        } catch (error) {
            console.error('Fehler beim Generieren:', error);
            Alert.alert('Fehler', 'Der Plan konnte nicht generiert werden. Bitte erneut versuchen.');
        } finally {
            setIsGenerating(false);
        }
    };

    // 2. Gewählte Version akzeptieren und in DB speichern (Phase 1 Backend)
    const handleAccept = async () => {
        const currentVersion = generatedVersions[selectedVersionIndex];
        if (!currentVersion) return;

        setIsSaving(true);
        try {
            await saveWeeklyVersion({
                activities: currentVersion.activities,
                score: currentVersion.score,
                start_of_week: selectedMonday
            });

            Alert.alert('Erfolg', 'Wochenplan erfolgreich gespeichert!', [
                {
                    text: 'Zum Kalender',
                    onPress: () => {
                        setGeneratedVersions([]);
                        router.push('/(tabs)/plan');
                    }
                }
            ]);
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            Alert.alert('Fehler', 'Beim Speichern des Plans ist ein Fehler aufgetreten.');
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Verwerten / Abbrechen
    const handleDeny = () => {
        Alert.alert(
            'Plan verwerfen',
            'Möchtest du die generierten Optionen wirklich verwerfen?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                { 
                    text: 'Verwerfen', 
                    style: 'destructive', 
                    onPress: () => {
                        setGeneratedVersions([]);
                        setSelectedVersionIndex(0);
                    } 
                }
            ]
        );
    };

    // Aktuell angezeigte Aktivitäten der gewählten Version
    const currentActivities: Activity[] = useMemo(() => {
        if (generatedVersions.length > 0 && generatedVersions[selectedVersionIndex]) {
            return generatedVersions[selectedVersionIndex].activities;
        }
        return [];
    }, [generatedVersions, selectedVersionIndex]);

    // Datenstruktur für die WeekView-Komponente
    const weekDays = useMemo(() => {
        const monday = new Date(selectedMonday);
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, index) => {
            const dateObj = new Date(monday);
            dateObj.setDate(monday.getDate() + index);
            const dateString = dateObj.toISOString().split('T')[0];
            return {
                dayName,
                dateString,
                dayNumber: dateObj.getDate(),
                isSelected: dateString === focusedDate,
                hasActivity: currentActivities.some(act => act.date === dateString)
            };
        });
    }, [selectedMonday, focusedDate, currentActivities]);

    return (
        <ScrollView style={localStyles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={localStyles.heading}>Create Weekly Plan</Text>

            {/* VOR DEM GENERIEREN: Wochenauswahl & Start-Button */}
            {generatedVersions.length === 0 ? (
                <View style={localStyles.card}>
                    <Text style={localStyles.label}>Select Week</Text>
                    
                    <View style={localStyles.weekPickerRow}>
                        <TouchableOpacity style={localStyles.arrowBtn} onPress={() => changeWeekSelection(-1)}>
                            <Text style={localStyles.arrowText}>‹</Text>
                        </TouchableOpacity>
                        
                        <View style={localStyles.dateBadge}>
                            <Text style={localStyles.dateText}>
                                W/O {selectedMonday}
                            </Text>
                        </View>

                        <TouchableOpacity style={localStyles.arrowBtn} onPress={() => changeWeekSelection(1)}>
                            <Text style={localStyles.arrowText}>›</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={[localStyles.primaryBtn, isGenerating && localStyles.btnDisabled]} 
                        onPress={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={localStyles.primaryBtnText}>Generate Schedule Options</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                /* NACH DEM GENERIEREN: Versionsauswahl & Wochenkalender */
                <View style={{ gap: 16 }}>
                    {/* Header der Vorschau */}
                    <View style={localStyles.previewHeader}>
                        <Text style={localStyles.scoreTitle}>
                            Score: {generatedVersions[selectedVersionIndex]?.score ?? 0} Points
                        </Text>
                        <Text style={localStyles.subtitle}>
                            Select an option to inspect in the weekly view:
                        </Text>

                        {/* Umschalter: Option 1, Option 2, Option 3 */}
                        <View style={localStyles.optionBar}>
                            {generatedVersions.map((ver, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        localStyles.optionTab,
                                        selectedVersionIndex === idx && localStyles.optionTabActive
                                    ]}
                                    onPress={() => setSelectedVersionIndex(idx)}
                                >
                                    <Text style={[
                                        localStyles.optionTabText,
                                        selectedVersionIndex === idx && localStyles.optionTabTextActive
                                    ]}>
                                        Option {idx + 1}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Reiner Wochenkalender als Vorschau */}
                    <View style={localStyles.calendarContainer}>
                        <WeekView
                            selectedDate={focusedDate}
                            setSelectedDate={setFocusedDate}
                            weekDays={weekDays}
                            changeWeek={(dir) => {
                                const curr = new Date(focusedDate);
                                curr.setDate(curr.getDate() + (dir === 'next' ? 7 : -7));
                                setFocusedDate(curr.toISOString().split('T')[0]);
                            }}
                            activities={currentActivities}
                        />
                    </View>

                    {/* Aktion-Buttons: ACCEPT & DENY */}
                    <View style={localStyles.actionRow}>
                        <TouchableOpacity 
                            style={[localStyles.actionBtn, localStyles.denyBtn]} 
                            onPress={handleDeny}
                            disabled={isSaving}
                        >
                            <Text style={localStyles.denyBtnText}>Deny</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[localStyles.actionBtn, localStyles.acceptBtn]} 
                            onPress={handleAccept}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={localStyles.acceptBtnText}>Accept & Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
        marginTop: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
        marginBottom: 12,
    },
    weekPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    arrowBtn: {
        backgroundColor: '#f0f0f0',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    dateBadge: {
        backgroundColor: '#eef6ff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    primaryBtn: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.6,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewHeader: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
    },
    scoreTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34c759',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    optionBar: {
        flexDirection: 'row',
        gap: 8,
    },
    optionTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    optionTabActive: {
        backgroundColor: '#007AFF',
    },
    optionTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
    },
    optionTabTextActive: {
        color: '#fff',
    },
    calendarContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    denyBtn: {
        backgroundColor: '#ff3b3015',
        borderWidth: 1,
        borderColor: '#ff3b30',
    },
    denyBtnText: {
        color: '#ff3b30',
        fontWeight: 'bold',
        fontSize: 16,
    },
    acceptBtn: {
        backgroundColor: '#34c759',
    },
    acceptBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});