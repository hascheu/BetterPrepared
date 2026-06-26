from datetime import datetime, timedelta
from .models import Activity, FlexibleSlot

def is_overlapping(start_a, end_a, start_b, end_b):
    """
    Prüft, ob sich zwei Zeitfenster überschneiden.
    Erwartet datetime.time oder datetime.datetime Objekte.
    """
    return start_a < end_b and end_a > start_b

class TrainingScheduler:
    def __init__(self, profile, start_date):
        self.profile = profile
        self.start_date = start_date # Das Datum, ab dem die Woche geplant wird
        self.end_date = start_date + timedelta(days=6)

    def get_user_data(self):
        """Holt alle Aktivitäten des Users für die Zielwoche"""
        all_activities = Activity.objects.filter(
            profile=self.profile,
            # Hier filtern wir später auf Termine, die in dieser Woche liegen
        )
        
        # Aufteilen nach deinen definierten Typen
        fixed_events = all_activities.filter(scheduling_type='FIXED')
        flexible_events = all_activities.filter(scheduling_type='FLEXIBLE')
        free_events = all_activities.filter(scheduling_type='FREE')
        optional_events = all_activities.filter(scheduling_type='OPTIONAL')
        
        return fixed_events, flexible_events, free_events, optional_events

    def generate_best_versions(self):
        fixed, flexible, free, optional = self.get_user_data()
        
        versions = []
        
        # HIER KOMMT DEIN ALGORITHMUS REIN:
        # 1. Erstelle leere Kalender-Muster (Versionen)
        # 2. Trage 'fixed' ein (Harte Kollisionsprüfung)
        # 3. Kombieffekte von 'flexible' durchrechnen (Permutationen)
        # 4. Freie Plätze mit 'free' und 'optional' auffüllen
        # 5. Jede Version bewerten (Schlaf, OTS-Risiko, Verteilung)
        
        # Sortiere nach Score und gib die Top 3 zurück
        # versions.sort(key=lambda x: x['score'], reverse=True)
        return versions[:3]