from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone  # WICHTIG: Für das automatische Datum importieren

# --- 2. ACTIVITY (Base Class) ---

class Activity(models.Model):
    class SchedulingType(models.TextChoices):
        FIXED = 'FIXED', 'Fixed'
        FLEXIBLE = 'FLEXIBLE', 'Flexible'
        FREE = 'FREE', 'Free'
        OPTIONAL = 'OPTIONAL', 'Optional'

    class Frequency(models.TextChoices):
        ONCE = 'ONCE', 'Once'
        DAILY = 'DAILY', 'Daily'
        WEEKLY = 'WEEKLY', 'Weekly'
    
    class Weekday(models.IntegerChoices):
        MON = 0, 'Monday'
        TUE = 1, 'Tuesday'
        WED = 2, 'Wednesday'
        THU = 3, 'Thursday'
        FRI = 4, 'Friday'
        SAT = 5, 'Saturday'
        SUN = 6, 'Sunday'

    profile = models.ForeignKey('users.Profile', on_delete=models.CASCADE, related_name='activities')
    title = models.CharField(max_length=255)
    scheduling_type = models.CharField(max_length=20, choices=SchedulingType.choices, default=SchedulingType.FIXED)
    
    is_all_day = models.BooleanField(default=False)
    frequency = models.CharField(max_length=20, choices=Frequency.choices, default='ONCE')
    
    date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Pflicht bei ONCE. Startdatum bei DAILY/WEEKLY (optional, Standard ist heute)."
    )
    weekday = models.IntegerField(choices=Weekday.choices, null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    def clean(self):
        super().clean()
        errors = {}

        # 1. Validierung & Logik für FREQUENZEN
        
        # Regel: ONCE -> Datum ist absolut verpflichtend
        if self.frequency == self.Frequency.ONCE:
            if not self.date:
                errors['date'] = 'Für einmalige Aktivitäten ist ein Datum erforderlich.'

        # Regel: DAILY -> Datum optional, falls leer: setze auf heute
        elif self.frequency == self.Frequency.DAILY:
            if not self.date:
                self.date = timezone.now().date()

        # Regel: WEEKLY -> Wochentag verpflichtend, Datum optional (falls leer: heute)
        elif self.frequency == self.Frequency.WEEKLY:
            if self.weekday is None:
                errors['weekday'] = 'Wenn die Frequenz wöchentlich ist, muss ein Wochentag ausgewählt werden.'
            if not self.date:
                self.date = timezone.now().date()

        # 2. Validierung für Zeiten vs. All-Day (Nur wenn nicht ganztägig)
        if not self.is_all_day:
            if not self.start_time:
                errors['start_time'] = 'Startzeit ist erforderlich, wenn es keine ganztägige Aktivität ist.'
            if not self.end_time:
                errors['end_time'] = 'Endzeit ist erforderlich, wenn es keine ganztägige Aktivität ist.'
        else:
            # Wenn ganztägig, bereinigen wir die Zeiten für die Datenbank
            self.start_time = None
            self.end_time = None

        # Wenn gesammelte Fehler existieren, werfen wir sie gesammelt für das Formular
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        # clean() manuell aufrufen, damit die Logik (wie das automatische Datum) 
        # auch bei API-Saves über den Serializer getriggert wird!
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

# --- 3. SPEZIALISIERTE KLASSEN (Multi-Table Inheritance) ---

class Training(Activity):
    class TrainingType(models.TextChoices):
        TECHNICAL = 'TECHNICAL', 'Technical'
        SPARRING = 'SPARRING', 'Sparring'
        PADS = 'PADS', 'Pads'
        BAGWORK = 'BAGWORK', 'Bagwork'

    class Intensity(models.TextChoices):
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    training_type = models.CharField(max_length=50, choices=TrainingType.choices, blank=True, null=True)
    intensity = models.CharField(max_length=10, choices=Intensity.choices, blank=True, null=True)
    heart_rate = models.IntegerField(blank=True, null=True)
    rpe = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)], null=True, blank=True)

class Responsibility(Activity):
    class RespType(models.TextChoices):
        WORK = 'WORK', 'Work'
        UNIVERSITY = 'UNIVERSITY', 'University'
        INTERNSHIP = 'INTERNSHIP', 'Internship'
        SCHOOL = 'SCHOOL', 'School'
        OTHERS = 'OTHERS', 'Others'

    class Movement(models.TextChoices):
        SITTING = 'SITTING', 'Sitting'
        STANDING = 'STANDING', 'Standing'
        WALKING = 'WALKING', 'Walking'
        LIFTING = 'LIFTING', 'Lifting'

    responsibility_type = models.CharField(max_length=50, choices=RespType.choices, blank=True, null=True)
    movement = models.CharField(max_length=20, choices=Movement.choices, blank=True, null=True)
    rpe = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)], blank=True, null=True)

class Recovery(Activity):
    class RecoveryType(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PASSIVE = 'PASSIVE', 'Passive'
        SOCIAL = 'SOCIAL', 'Social'

    recovery_type = models.CharField(max_length=20, choices=RecoveryType.choices, blank=True, null=True)
    sub_type = models.CharField(max_length=100, blank=True, help_text="e.g. sauna, swimming, massage", null=True)

class Competition(Activity):
    class Status(models.TextChoices):
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PLANNED = 'PLANNED', 'Planned'
        PAST = 'PAST', 'Past'

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    result = models.TextField(blank=True, null=True)
    fighting_weight = models.FloatField(null=True, blank=True)

class OtherActivity(Activity):
    """
    Für alle Aktivitäten, die in keine andere Kategorie passen.
    Bietet ein einfaches Freitextfeld für Notizen.
    """
    notes = models.TextField(blank=True, null=True,  help_text="Any details about this activity")
   

# --- 4. DAILY METRIC ---
class DailyMetric(models.Model):
    class Energy(models.TextChoices):
        HIGH = 'HIGH', 'High'
        MIDDLE = 'MIDDLE', 'Middle'
        LOW = 'LOW', 'Low'

    class CyclePhase(models.TextChoices):
        MENSTRUATION = 'MENSTRUATION', 'Menstruation'
        FOLLICULAR = 'FOLLICULAR', 'Follicular'
        OVULATION = 'OVULATION', 'Ovulation'
        LUTEAL = 'LUTEAL', 'Luteal'

    profile = models.ForeignKey('users.Profile', on_delete=models.CASCADE, related_name='metrics')
    date = models.DateField()
    sleep_hours = models.FloatField()
    mood = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    current_weight = models.FloatField()
    energy = models.CharField(max_length=10, choices=Energy.choices)
    menstrual_cycle = models.CharField(max_length=20, choices=CyclePhase.choices, blank=True, null=True)

    class Meta:
        unique_together = ('profile', 'date')
        verbose_name_plural = "Daily Metrics"

    def __str__(self):
        return f"Metric for {self.profile.user.username} on {self.date}"