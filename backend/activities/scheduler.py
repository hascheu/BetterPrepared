from datetime import datetime, timedelta
from django.utils import timezone
from .models import Activity, FlexibleSlot

def is_overlapping(start_a, end_a, start_b, end_b):
    """
    Prüft mathematisch, ob sich zwei Zeitfenster überschneiden.
    """
    return start_a < end_b and end_a > start_b


class TrainingScheduler:
    def __init__(self, profile, start_date):
        self.profile = profile
        self.start_date = start_date  # Erwartet ein datetime.date Objekt (z.B. der kommende Montag)
        self.end_date = start_date + timedelta(days=6)
        
        # Hier drin behalten wir, wie von dir vorgeschlagen, die Top 3 der besten Wochen
        self.best_versions = []

    def _init_empty_week(self):
            """
            Erstellt eine leere Struktur für die Woche.
            Nutzt Strings als Keys für JSON-Kompatibilität und hinterlegt das Realdatum.
            """
            week_structure = {
                "score": 0.0,
                "days": {}
            }
            
            for day_offset in range(7):
                current_date = self.start_date + timedelta(days=day_offset)
                # Wir speichern die Wochentage als String-Keys ("0" = Montag, "1" = Dienstag...)
                week_structure["days"][str(day_offset)] = {
                    "date": current_date,          # Das echte Datum (datetime.date)
                    "entries": []                  # Hier landen die platzierten Aktivitäten
                }
                
            return week_structure

    def get_user_data(self):
        """
        Holt alle für die Zielwoche relevanten Aktivitäten aus der Datenbank.
        Beachtet ONCE (festes Datum) und WEEKLY (Wochentag).
        """
        # Basis-Query für den aktuellen User
        user_activities = Activity.objects.filter(profile=self.profile)
        
        week_activities = []
        
        # Wir gehen die 7 Tage der Zielwoche durch und sammeln passende Aktivitäten
        for day_offset in range(7):
            current_day_date = self.start_date + timedelta(days=day_offset)
            current_weekday = current_day_date.weekday() # 0 = Montag, etc.
            
            # Filtern nach Einmaligen (ONCE) ODER Wöchentlichen (WEEKLY) für diesen Tag
            day_query = user_activities.filter(
                # Entweder: Es ist einmalig und exakt an diesem Datum
                (models.Q(frequency='ONCE') & models.Q(date=current_day_date)) |
                # Oder: Es ist wöchentlich und passt zum Wochentag
                (models.Q(frequency='WEEKLY') & models.Q(weekday=current_weekday)) |
                # Oder: Es ist täglich
                models.Q(frequency='DAILY')
            )
            
            for activity in day_query:
                # Wir merken uns das konkrete Zieldatum für die temporäre Platzierung
                activity.assigned_date = current_day_date
                # Und den Zielwochentag
                activity.assigned_weekday = current_weekday
                if activity not in week_activities:
                    week_activities.append(activity)

        # Aufteilen im Speicher nach Typen
        fixed = [a for a in week_activities if a.scheduling_type == 'FIXED']
        flexible = [a for a in week_activities if a.scheduling_type == 'FLEXIBLE']
        free = [a for a in week_activities if a.scheduling_type == 'FREE']
        optional = [a for a in week_activities if a.scheduling_type == 'OPTIONAL']
        
        return fixed, flexible, free, optional
    
    def generate_best_versions(self):
        """
        Der Haupt-Einstiegspunkt des Schedulers.
        Initialisiert den Prozess und liefert die Top 3 Wochen-Konfigurationen.
        """
        self.best_versions = [] # Liste leeren vor jedem Durchlauf
        
        # 1. Daten holen
        fixed, flexible, free, optional = self.get_user_data()
        
        # 2. Leere Woche initialisieren
        base_week = self._init_empty_week()
        
        try:
            # 3. Unverrückbare Termine einbrennen
            base_week = self._insert_fixed_events(base_week, fixed)
        except ValueError as e:
            # Wenn schon die FIXED-Termine crashen, direkt abbrechen
            return {"error": str(e)}

        # Wir merken uns die freien und optionalen Events als Instanzvariablen,
        # damit wir in der tieferen Rekursion darauf zugreifen können.
        self._current_free_events = free
        self._current_optional_events = optional

        # 4. Lawine starten: Rekursiv alle flexiblen Kombinationen berechnen
        self._generate_flexible_permutations(base_week, flexible, index=0)
        
        return self.best_versions

    def _insert_fixed_events(self, base_week, fixed_events):
        """
        Setzt alle FIXED Termine in die Woche ein.
        Falls das Frontend fehlerhafte Daten geschickt hat, die sich untereinander 
        schon überschneiden, brechen wir hier direkt mit einem Fehler ab.
        """
        for event in fixed_events:
            weekday = event.assigned_weekday
            
            # Ganztägige FIXED Events blockieren den Tag nicht für feine Kollisionen, 
            # sondern laufen außerhalb der Stunden-Konflikte mit
            if event.is_all_day:
                base_week["schedule"][weekday].append({
                    "activity": event,
                    "start_time": None,
                    "end_time": None,
                    "is_all_day": True
                })
                continue

            # Validierung gegen bereits eingetragene FIXED Termine am selben Tag
            for existing in base_week["schedule"][weekday]:
                if existing["is_all_day"]:
                    continue
                
                if is_overlapping(event.start_time, event.end_time, existing["start_time"], existing["end_time"]):
                    # Harte Kollision innerhalb der festen Vorgaben des Nutzers!
                    raise ValueError(
                        f"Konflikt in den Basisdaten: '{event.title}' überschneidet sich "
                        f"mit '{existing['activity'].title}' am Wochentag {weekday}."
                    )
            
            # Kein Konflikt? Dann rein in die Liste für diesen Tag
            base_week["schedule"][weekday].append({
                "activity": event,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "is_all_day": False
            })
            
        return base_week
    
    def _generate_flexible_permutations(self, current_week, flexible_events, index=0):
        """
        Rekursiver Backtracking-Algorithmus.
        Probiert jede Kombination von FlexibleSlots für alle flexiblen Aktivitäten aus.
        """
        # Basis-Fall: Wenn alle flexiblen Aktivitäten platziert wurden, 
        # haben wir eine gültige Teil-Woche generiert!
        if index >= len(flexible_events):
            # Jetzt geht es im nächsten Schritt weiter mit FREE / OPTIONAL 
            # und der anschließenden Bewertung (Score)
            self._process_and_score_week(current_week)
            return

        current_event = flexible_events[index]
        # Alle hinterlegten Slots für diese Aktivität aus der Datenbank holen
        slots = current_event.flexible_slots.all()

        # Falls der User eine flexible Aktivität ohne Slots angelegt hat,
        # überspringen wir sie, damit der Algorithmus nicht blockiert.
        if not slots.exists():
            self._generate_flexible_permutations(current_week, flexible_events, index + 1)
            return

        for slot in slots:
            # Wir prüfen, an welchem Wochentag dieser Slot liegt (0-6)
            weekday_str = str(slot.weekday)
            
            # Kollisionsprüfung: Passt der Slot in den aktuellen Tag dieser Version?
            collision = False
            day_entries = current_week["days"][weekday_str]["entries"]
            
            for existing in day_entries:
                if existing["is_all_day"]:
                    continue
                if is_overlapping(slot.start_time, slot.end_time, existing["start_time"], existing["end_time"]):
                    collision = True
                    break
            
            if not collision:
                # Kopieren der Struktur verhindern (Deepcopy-Ersatz aus Performancegründen):
                # Wir fügen den Slot temporär hinzu, gehen tiefer in die Rekursion, 
                # und entfernen ihn danach wieder (Backtracking).
                new_entry = {
                    "activity": current_event,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "is_all_day": False,
                    "slot_id": slot.id
                }
                
                # Schritt vorwärts
                day_entries.append(new_entry)
                
                # Rekursion: Nächste flexible Aktivität prüfen
                self._generate_flexible_permutations(current_week, flexible_events, index + 1)
                
                # Schritt zurück (Backtracking für die nächste Slot-Option)
                day_entries.pop()



