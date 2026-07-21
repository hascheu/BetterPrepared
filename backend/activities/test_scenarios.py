# test_scenario.py
from datetime import datetime, timedelta, time
from .models import Responsibility, OtherActivity, Activity

def create_conflict_scenario(profile, start_week_date):
    """
    Szenario 1: Ein harter Konflikt (Zahnarzt vs. Vorlesung) 
    unter Verwendung der echten, spezialisierten Unterklassen.
    """
    # 1. Vorherige Testdaten sauber aufräumen
    # Weil Django-Vererbung kaskadiert, löscht das Löschen der Activity 
    # automatisch auch die verknüpften Responsibility- und OtherActivity-Einträge!
    Activity.objects.filter(profile=profile, title__startswith="Test-").delete()
    
    # --- VORLESUNG BERECHNEN (Responsibility) ---
    vorlesung_start = time(10, 0)
    vorlesung_duration = 90
    vorlesung_end = (datetime.combine(start_week_date, vorlesung_start) + timedelta(minutes=vorlesung_duration)).time()

    # Wir nutzen das spezialisierte Modell Responsibility
    Responsibility.objects.create(
        profile=profile,
        title="Test-Wichtige Vorlesung (Gewinner)",
        scheduling_type=Activity.SchedulingType.FIXED,
        priority=Activity.Priority.HIGH, # Prio 3
        duration=vorlesung_duration,
        is_all_day=False,
        frequency=Activity.Frequency.ONCE,
        date=start_week_date,
        start_time=vorlesung_start,
        end_time=vorlesung_end,
        
        # Felder, die NUR die Unterklasse Responsibility besitzt:
        responsibility_type=Responsibility.RespType.UNIVERSITY,
        movement=Responsibility.Movement.SITTING,
        rpe=2 # Niedrige gefühlte Anstrengung für eine Vorlesung
    )
    
    # --- ZAHNARZT BERECHNEN (OtherActivity) ---
    zahnarzt_start = time(10, 30)
    zahnarzt_duration = 30
    zahnarzt_end = (datetime.combine(start_week_date, zahnarzt_start) + timedelta(minutes=zahnarzt_duration)).time()

    # Wir nutzen das spezialisierte Modell OtherActivity
    OtherActivity.objects.create(
        profile=profile,
        title="Test-Zahnarzt (Verlierer)",
        scheduling_type=Activity.SchedulingType.FIXED,
        priority=Activity.Priority.LOW, # Prio 1
        duration=zahnarzt_duration,
        is_all_day=False,
        frequency=Activity.Frequency.ONCE,
        date=start_week_date,
        start_time=zahnarzt_start,
        end_time=zahnarzt_end,
        
        # Feld, das NUR die Unterklasse OtherActivity besitzt:
        notes="Reguläre Zahnreinigung. Erwarteter Konflikt mit Vorlesung."
    )