from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

# --- 1. PROFILE ---
class Profile(models.Model):
    class SportType(models.TextChoices):
        BOXING = 'BOXING', 'Boxing'
        MMA = 'MMA', 'MMA'
        THAIBOXING = 'THAIBOXING', 'Thai Boxing'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INJURED = 'INJURED', 'Injured'
        RECOVERY = 'RECOVERY', 'Recovery'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    sport_type = models.CharField(max_length=50, choices=SportType.choices, blank=True, null=True)
    chronical_disease = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    def __str__(self):
        return f"Profile: {self.user.username}"


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
        MONTHLY = 'MONTHLY', 'Monthly'
        YEARLY = 'YEARLY', 'Yearly'
    
    class Weekday(models.IntegerChoices):
        MON = 0, 'Monday'
        TUE = 1, 'Tuesday'
        WED = 2, 'Wednesday'
        THU = 3, 'Thursday'
        FRI = 4, 'Friday'
        SAT = 5, 'Saturday'
        SUN = 6, 'Sunday'

    profile = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name='activities')
    title = models.CharField(max_length=255)
    scheduling_type = models.CharField(max_length=20, choices=SchedulingType.choices, default=SchedulingType.FIXED)
    
    is_all_day = models.BooleanField(default=False)
    frequency = models.CharField(max_length=20, choices=Frequency.choices, default='ONCE')
    date = models.DateField(null=True, blank=True)
    weekday = models.IntegerField(choices=Weekday.choices, null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

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

    training_type = models.CharField(max_length=50, choices=TrainingType.choices)
    intensity = models.CharField(max_length=10, choices=Intensity.choices)
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

    responsibility_type = models.CharField(max_length=50, choices=RespType.choices)
    movement = models.CharField(max_length=20, choices=Movement.choices)
    rpe = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])

class Recovery(Activity):
    class RecoveryType(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PASSIVE = 'PASSIVE', 'Passive'
        SOCIAL = 'SOCIAL', 'Social'

    recovery_type = models.CharField(max_length=20, choices=RecoveryType.choices)
    sub_type = models.CharField(max_length=100, blank=True, help_text="e.g. sauna, swimming, massage")

class Competition(Activity):
    class Status(models.TextChoices):
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PLANNED = 'PLANNED', 'Planned'
        PAST = 'PAST', 'Past'

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    result = models.TextField(blank=True, null=True)
    fighting_weight = models.FloatField(null=True, blank=True)


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

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='metrics')
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