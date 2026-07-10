from datetime import datetime, timedelta, time
import copy
from django.utils import timezone
# Importiere deine Modelle (Pfade an deine App-Struktur anpassen)
from .models import Activity, FlexibleSlot, Training 

def datetime_to_slots(start_dt: datetime, duration_minutes: int) -> list[str]:
    """
    Zerlegt einen Zeitraum basierend auf Startzeit und Dauer in 15-Minuten-String-Slots.
    Beispiel: 10:00 Uhr, 45 Min -> ['2026-07-01 10:00', '2026-07-01 10:15', '2026-07-01 10:30']
    """
    slots = []
    current = start_dt
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    
    while current < end_dt:
        # Wir runden auf die nächste Viertelstunde ab, um saubere Keys zu haben
        minutes = (current.minute // 15) * 15
        slot_str = current.replace(minute=minutes, second=0, microsecond=0).strftime("%Y-%m-%d %H:%M")
        slots.append(slot_str)
        current += timedelta(minutes=15)
        
    return slots

def get_week_boundaries(start_date: datetime.date):
    """Hilfsfunktion für die Wochengrenzen"""
    start_dt = datetime.combine(start_date, time.min)
    end_dt = start_dt + timedelta(days=7)
    return start_dt, end_dt

def load_and_categorize_activities(profile, start_date: datetime.date) -> dict:
    """
    Holt alle relevanten Aktivitäten des Profils aus der Datenbank
    und teilt sie für die Zielwoche auf.
    """
    start_dt, end_dt = get_week_boundaries(start_date)
    
    # Alle Aktivitäten des Nutzers laden
    all_activities = Activity.objects.filter(profile=profile)
    
    categorized = {
        'FIXED': [],
        'FLEXIBLE': [],
        'FREE': [],
        'OPTIONAL': []
    }
    
    for activity in all_activities:
        # Prüfen, ob die Aktivität generell in dieser Woche stattfinden muss
        is_relevant = False
        
        if activity.frequency == Activity.Frequency.ONCE:
            if activity.date and start_date <= activity.date < end_date.date():
                is_relevant = True
                
        elif activity.frequency == Activity.Frequency.DAILY:
            # Tägliche Termine finden jeden Tag statt, also auch in dieser Woche
            is_relevant = True
            
        elif activity.frequency == Activity.Frequency.WEEKLY:
            # Wöchentliche Termine sind relevant (der konkrete Tag wird unten bestimmt)
            is_relevant = True

        if is_relevant:
            # Wir erstellen eine Kopie im Speicher, damit wir die Originaldaten 
            # in der DB beim Herumprobieren im Algorithmus nicht versehentlich verändern
            act_copy = copy.copy(activity)
            
            # Wenn es ein FIXED Termin ist, rechnen wir das konkrete Datum/Uhrzeit für diese Woche aus
            if activity.scheduling_type == Activity.SchedulingType.FIXED:
                if activity.frequency == Activity.Frequency.WEEKLY:
                    # Berechne das konkrete Datum für den Wochentag in dieser spezifischen Woche
                    days_ahead = activity.weekday - start_date.weekday()
                    if days_ahead < 0: 
                        days_ahead += 7
                    target_date = start_date + timedelta(days=days_ahead)
                    act_copy.date = target_date
                elif activity.frequency == Activity.Frequency.DAILY:
                    # Für Daily müssten wir eigentlich 7 Kopien erstellen (für jeden Tag eine).
                    # Das fangen wir hier ab:
                    for i in range(7):
                        daily_copy = copy.copy(activity)
                        daily_copy.date = start_date + timedelta(days=i)
                        categorized['FIXED'].append(daily_copy)
                    continue
                
                categorized['FIXED'].append(act_copy)
            else:
                categorized[activity.scheduling_type].append(act_copy)
                
    return categorized

def build_initial_blocked_slots(fixed_activities: list[Activity]) -> set[str]:
    """
    Nimmt alle fixen Termine der Woche und blockiert deren 
    15-Minuten-Slots in einem Set.
    """
    blocked_slots = set()
    
    for activity in fixed_activities:
        # Falls es ein ganztägiger Termin ist, blockieren wir den kompletten Tag
        if activity.is_all_day:
            current_dt = datetime.combine(activity.date, time.min)
            for _ in range(24 * 4):  # 96 Slots für 24 Stunden
                slot_str = current_dt.strftime("%Y-%m-%d %H:%M")
                blocked_slots.add(slot_str)
                current_dt += timedelta(minutes=15)
        
        # Normale fixe Termine mit Start- und Endzeit
        elif activity.date and activity.start_time:
            start_dt = datetime.combine(activity.date, activity.start_time)
            
            # Wir berechnen die Slots über die duration (Minuten)
            slots = datetime_to_slots(start_dt, activity.duration)
            blocked_slots.update(slots)
            
    return blocked_slots

def get_concrete_slots_for_week(flex_activity: Activity, start_week_date: datetime.date) -> list[datetime]:
    """
    Liest die FlexibleSlot-Optionen aus der DB und berechnet alle möglichen 
    Start-Datetimes im 15-Minuten-Raster für die aktuelle Woche.
    """
    possible_starts = []
    
    # Über die Django-Related-Name 'flexible_slots' holen wir die Optionen aus der DB
    slots_options = flex_activity.flexible_slots.all()
    
    for option in slots_options:
        # 1. Das korrekte Datum für diese Option ermitteln
        target_date = None
        
        if option.date:
            # Option hat ein fixes Datum (ONCE)
            target_date = option.date
        elif option.weekday is not None:
            # Option gilt wöchentlich (WEEKLY) -> Datum in dieser Woche berechnen
            days_ahead = option.weekday - start_week_date.weekday()
            if days_ahead < 0:
                days_ahead += 7
            target_date = start_week_date + timedelta(days=days_ahead)
            
        if not target_date:
            continue
            
        # 2. Das Zeitfenster durchlaufen (vom start_time bis end_time minus Dauer der Aktivität)
        start_dt = datetime.combine(target_date, option.start_time)
        end_dt = datetime.combine(target_date, option.end_time)
        
        current_dt = start_dt
        # Wir können nur starten, wenn die Aktivität noch komplett in das Fenster passt
        while current_dt + timedelta(minutes=flex_activity.duration) <= end_dt:
            possible_starts.append(current_dt)
            # Im 15-Minuten-Takt weiterspringen, um alle Optionen zu generieren
            current_dt += timedelta(minutes=15)
            
    return possible_starts


def calendar_flex(flex_activities: list[Activity], initial_blocked_slots: set[str], start_week_date: datetime.date) -> list[list[Activity]]:
    """
    Berechnet alle gültigen Kombinationen (Versionen) der flexiblen Aktivitäten.
    Gibt eine Liste von Listen zurück, wobei jede innere Liste die flexiblen 
    Aktivitäten mit gesetztem 'date' und 'start_time' enthält.
    """
    all_flex_versions = []
    
    # Falls es gar keine flexiblen Aktivitäten gibt, geben wir eine Liste mit einer leeren Version zurück
    if not flex_activities:
        return [[]]

    def backtrack(current_index: int, current_assigned: list[Activity], current_blocked: set[str]):
        # Basis-Fall: Alle flexiblen Aktivitäten wurden erfolgreich platziert!
        if current_index == len(flex_activities):
            # Tiefe Kopie der aktuell beplanten Aktivitäten speichern
            all_flex_versions.append([copy.copy(act) for act in current_assigned])
            return

        activity = flex_activities[current_index]
        # Generiere alle theoretischen Startzeiten aus den FlexibleSlots für diese Woche
        possible_starts = get_concrete_slots_for_week(activity, start_week_date)

        for start_dt in possible_starts:
            # Berechne die Slots, die diese Aktivität belegen würde
            needed_slots = datetime_to_slots(start_dt, activity.duration)
            
            # Kollisionsprüfung: Überschneidet sich einer der Slots mit dem aktuellen Raster?
            collision = any(slot in current_blocked for slot in needed_slots)
            
            if not collision:
                # Modifiziere die Aktivitäts-Kopie temporär für diesen Pfad
                activity.date = start_dt.date()
                activity.start_time = start_dt.time()
                
                # Zustand aktualisieren (In die Liste aufnehmen und Raster blockieren)
                current_assigned.append(activity)
                current_blocked.update(needed_slots)
                
                # Rekursion: Nächste flexible Aktivität prüfen
                backtrack(current_index + 1, current_assigned, current_blocked)
                
                # Backtrack: Zustand wieder rückgängig machen (Clean-up für den nächsten Versuch)
                current_assigned.pop()
                for slot in needed_slots:
                    current_blocked.remove(slot)

    # Starte die rekursive Suche mit dem anfänglichen Blockier-Set der fixen Termine
    backtrack(0, [], set(initial_blocked_slots))
    
    return all_flex_versions

def is_in_sleep_window(dt: datetime, sleep_start=23, sleep_end=7) -> bool:
    """Prüft, ob eine gegebene Uhrzeit im Schlafbereich liegt."""
    current_hour = dt.hour
    if sleep_start > sleep_end:
        # Klassischer Fall: 23:00 bis 07:00 Uhr am nächsten Morgen
        return current_hour >= sleep_start or current_hour < sleep_end
    else:
        # Falls jemand tagsüber schläft (z.B. Schichtarbeit 08:00 bis 16:00)
        return sleep_start <= current_hour < sleep_end

def calculate_free_slot_score(start_dt: datetime, activity: Activity, current_calendar: list[Activity]) -> float:
    """
    Bewertet, wie gut ein potenzieller Start-Slot für eine FREE-Aktivität ist.
    Höherer Score = Bessere Platzierung.
    """
    score = 100.0
    
    # Regel 1: Schlafenszeit prüfen (Standard 23 - 7 Uhr)
    # Wenn die Aktivität während der Schlafzeit läuft oder dort hineinragt: Ausschlusskriterium
    end_dt = start_dt + timedelta(minutes=activity.duration)
    check_time = start_dt
    while check_time < end_dt:
        if is_in_sleep_window(check_time):
            return float('-inf')  # Absolut verboten
        check_time += timedelta(minutes=15)
        
    # Regel 2: Abend-Schranke (Möglichst nicht nach 20:00 Uhr starten)
    if start_dt.time() > time(20, 0):
        score -= 30.0  # Punktabzug für spätes Training
        
    # Regel 3: Abstand zu anderen Workouts maximieren
    # Da du Multi-Table-Inheritance nutzt, prüfen wir mit isinstance(), ob es ein Training ist
    if isinstance(activity, Training):
        min_distance_minutes = float('inf')
        
        for scheduled in current_calendar:
            if isinstance(scheduled, Training) and scheduled.date and scheduled.start_time:
                sched_start = datetime.combine(scheduled.date, scheduled.start_time)
                
                # Berechne den absoluten Abstand in Minuten zwischen den Starts
                distance = abs((start_dt - sched_start).total_seconds()) / 60.0
                if distance < min_distance_minutes:
                    min_distance_minutes = distance
                    
        # Wenn es andere Trainings gibt, belohnen wir einen größeren Abstand
        if min_distance_minutes != float('inf'):
            # Ein größerer Abstand erhöht den Score (wir nutzen den Logarithmus oder einen Faktor, 
            # damit extrem große Abstände nicht unendlich dominieren, aber 24h-48h ideal sind)
            score += min(min_distance_minutes / 60.0, 48.0) # Bonus gedeckelt bei 48 Stunden Abstand
            
    return score

def add_free(current_calendar: list[Activity], free_activities: list[Activity], blocked_slots: set[str], start_week_date: datetime.date) -> tuple[list[Activity], set[str]]:
    """
    Platziert die FREE-Aktivitäten nacheinander an den jeweils 
    bestbewerteten freien Plätzen der Woche.
    """
    start_dt, end_dt = get_week_boundaries(start_week_date)
    placed_free = []
    current_blocked = set(blocked_slots)
    
    # Wir loopen durch alle zu planenden FREE-Aktivitäten
    for activity in free_activities:
        best_slot = None
        best_score = float('-inf')
        
        # Wir scannen die gesamte Woche im 15-Minuten-Takt nach dem besten Platz
        current_check = start_dt
        while current_check + timedelta(minutes=activity.duration) <= end_dt:
            # Slots generieren, die diese Aktivität belegen würde
            needed_slots = datetime_to_slots(current_check, activity.duration)
            
            # Prüfen, ob der Platz rein physikalisch im Raster frei ist
            if not any(slot in current_blocked for slot in needed_slots):
                # Berechne den qualitativen Score für diesen freien Platz
                slot_score = calculate_free_slot_score(current_check, activity, current_calendar + placed_free)
                
                if slot_score > best_score:
                    best_score = slot_score
                    best_slot = current_check
                    
            current_check += timedelta(minutes=15)
            
        # Wenn wir einen gültigen Platz gefunden haben (Score ist nicht -inf)
        if best_slot and best_score > float('-inf'):
            act_copy = copy.copy(activity)
            act_copy.date = best_slot.date()
            act_copy.start_time = best_slot.time()
            
            placed_free.append(act_copy)
            # Aktualisiere das Raster für die nächste FREE-Aktivität
            needed_slots = datetime_to_slots(best_slot, activity.duration)
            current_blocked.update(needed_slots)
            
    return placed_free, current_blocked

def add_optional(current_calendar: list[Activity], optional_activities: list[Activity], blocked_slots: set[str], start_week_date: datetime.date) -> tuple[list[Activity], set[str]]:
    """
    Platziert die OPTIONAL-Aktivitäten nach denselben Kriterien wie FREE-Aktivitäten
    an den verbleibenden besten freien Plätzen der Woche.
    """
    start_dt, end_dt = get_week_boundaries(start_week_date)
    placed_optional = []
    current_blocked = set(blocked_slots)
    
    for activity in optional_activities:
        best_slot = None
        best_score = float('-inf')
        
        current_check = start_dt
        while current_check + timedelta(minutes=activity.duration) <= end_dt:
            needed_slots = datetime_to_slots(current_check, activity.duration)
            
            # Prüfen, ob der Platz frei ist
            if not any(slot in current_blocked for slot in needed_slots):
                # Wir nutzen dieselbe Bewertungsfunktion für Schlaf, 20-Uhr-Schranke und Trainingsabstand
                slot_score = calculate_free_slot_score(
                    current_check, 
                    activity, 
                    current_calendar + placed_optional
                )
                
                if slot_score > best_score:
                    best_score = slot_score
                    best_slot = current_check
                    
            current_check += timedelta(minutes=15)
            
        # Wenn ein Platz gefunden wurde, buchen wir ihn ein
        if best_slot and best_score > float('-inf'):
            act_copy = copy.copy(activity)
            act_copy.date = best_slot.date()
            act_copy.start_time = best_slot.time()
            
            placed_optional.append(act_copy)
            needed_slots = datetime_to_slots(best_slot, activity.duration)
            current_blocked.update(needed_slots)
            
    return placed_optional, current_blocked

def evaluate_version(
    calendar_version: list[Activity], 
    total_flex_count: int, 
    total_free_count: int
) -> int:
    """
    Bewertet eine fertige Kalenderversion basierend auf deinen Scoring-Regeln.
    Basis: 100 Punkte.
    """
    score = 100
    
    # 1. Zählen, wie viele Aktivitäten von welchem Typ tatsächlich platziert wurden
    placed_flex = 0
    placed_free = 0
    placed_optional = 0
    workouts = []
    
    for activity in calendar_version:
        if activity.scheduling_type == Activity.SchedulingType.FLEXIBLE and activity.start_time:
            placed_flex += 1
        elif activity.scheduling_type == Activity.SchedulingType.FREE and activity.start_time:
            placed_free += 1
        elif activity.scheduling_type == Activity.SchedulingType.OPTIONAL and activity.start_time:
            placed_optional += 1
            
        # Wenn es ein Training ist und eine Zeit hat, merken wir uns das für die Abstandsregel
        if isinstance(activity, Training) and activity.date and activity.start_time:
            workouts.append(datetime.combine(activity.date, activity.start_time))
            
    # 2. Abzüge für fehlende Aktivitäten
    missing_flex = total_flex_count - placed_flex
    score -= (missing_flex * 20)
    
    missing_free = total_free_count - placed_free
    score -= (missing_free * 10)
    
    # 3. Bonus für vorhandene optionale Aktivitäten
    score += (placed_optional * 5)
    
    # 4. Abstandsregeln für Trainingseinheiten (is_workout)
    # Wir sortieren die Trainings chronologisch, um die Abstände nacheinander zu prüfen
    workouts.sort()
    for i in range(len(workouts) - 1):
        time_diff = workouts[i+1] - workouts[i]
        diff_hours = time_diff.total_seconds() / 3600.0
        
        if diff_hours < 8.0:
            score -= 10
        elif diff_hours < 24.0:
            score -= 5
            
    return score


def generate_best_versions(profile, start_week_date: datetime.date) -> list[dict]:
    """
    Die Haupt-Engine: Verknüpft alle Teilschritte und gibt die 3 besten 
    Kalenderversionen mit dem höchsten Score zurück.
    """
    # 1. Daten laden und nach Typen kategorisieren
    cat = load_and_categorize_activities(profile, start_week_date)
    
    # 2. Initiales Belegt-Raster aus den FIXED-Terminen bauen
    initial_blocked = build_initial_blocked_slots(cat['FIXED'])
    
    # 3. Alle gültigen Kombinationen für FLEXIBLE-Termine berechnen
    flex_versions = calendar_flex(cat['FLEXIBLE'], initial_blocked, start_week_date)
    
    all_completed_versions = []
    
    # 4. Für jede Flex-Kombination die FREE- und OPTIONAL-Termine auffüllen
    for f_version in flex_versions:
        # Basis-Kalender für diese Runde: Fixe Termine + diese Flex-Kombination
        current_calendar = list(cat['FIXED']) + f_version
        
        # Das Raster aktualisieren, damit es auch die Flex-Termine dieser Runde enthält
        current_blocked = set(initial_blocked)
        for act in f_version:
            act_dt = datetime.combine(act.date, act.start_time)
            current_blocked.update(datetime_to_slots(act_dt, act.duration))
            
        # FREE-Aktivitäten einplanen
        placed_free, current_blocked = add_free(
            current_calendar, cat['FREE'], current_blocked, start_week_date
        )
        current_calendar.extend(placed_free)
        
        # OPTIONAL-Aktivitäten einplanen
        placed_optional, _ = add_optional(
            current_calendar, cat['OPTIONAL'], current_blocked, start_week_date
        )
        current_calendar.extend(placed_optional)
        
        # 5. Diese fertige Version bewerten
        version_score = evaluate_version(
            current_calendar, 
            total_flex_count=len(cat['FLEXIBLE']), 
            total_free_count=len(cat['FREE'])
        )
        
        # Version abspeichern
        all_completed_versions.append({
            'score': version_score,
            'calendar': current_calendar
        })
        
    # 6. Nach Score sortieren (höchster zuerst) und die Top 3 herausschneiden
    all_completed_versions.sort(key=lambda x: x['score'], reverse=True)
    best_three_versions = all_completed_versions[:3]
    
    return best_three_versions




