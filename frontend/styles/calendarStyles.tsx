// frontend/styles/calendarStyles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    emptyText: { color: '#888', fontStyle: 'italic', marginTop: 5 },

    // Falls du die neuen Week-Styles schon nutzt, kannst du sie direkt hier unten dranhängen:
    navigationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, backgroundColor: '#f1f3f5', paddingVertical: 5 },
    arrowText: { color: '#007AFF', fontSize: 18 },
    weekStrip: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    weekDayButton: { alignItems: 'center', padding: 8, borderRadius: 8, minWidth: 45 },
    weekDayButtonActive: { backgroundColor: '#007AFF' },
    weekDayName: { fontSize: 12, color: '#666', fontWeight: '600' },
    weekDayNumber: { fontSize: 16, color: '#111', fontWeight: 'bold', marginTop: 4 },
    textWhite: { color: '#fff' },
    activityDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#007AFF', marginTop: 4 }
});