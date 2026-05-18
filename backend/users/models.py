from django.db import models
from django.contrib.auth.models import User

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