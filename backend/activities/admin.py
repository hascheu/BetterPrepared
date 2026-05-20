# backend/activities/admin.py
from django.contrib import admin
from .models import (
    Activity, Training, Responsibility, 
    Recovery, Competition, DailyMetric
)

# Wir registrieren hier jedes Modell einzeln. 
# Das erzeugt separate Menüpunkte im Admin-Panel.

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('title', 'profile', 'date')

@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    # Hier zeigen wir Felder aus Activity UND Training an
    list_display = ('title', 'profile', 'training_type', 'intensity')

@admin.register(Responsibility)
class ResponsibilityAdmin(admin.ModelAdmin):
    list_display = ('title', 'profile', 'responsibility_type')

@admin.register(Recovery)
class RecoveryAdmin(admin.ModelAdmin):
    list_display = ('title', 'profile', 'recovery_type')

@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ('title', 'profile', 'status')

@admin.register(DailyMetric)
class DailyMetricAdmin(admin.ModelAdmin):
    list_display = ('profile', 'date', 'energy')