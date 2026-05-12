from rest_framework import serializers
from .models import (
    Profile, Activity, Training, Responsibility, 
    Recovery, Competition, DailyMetric
)

# --- Basis-Serializer ---

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

# --- Spezial-Serializer (Zuerst definieren!) ---

class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = '__all__'

class ResponsibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Responsibility
        fields = '__all__'

class RecoverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Recovery
        fields = '__all__'

class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = '__all__'

# --- Der "Intelligente" ActivitySerializer ---

class ActivitySerializer(serializers.ModelSerializer):
    # Wir fügen ein extra Feld hinzu, um die Details der Unterklasse zu schicken
    extra_details = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            'id', 'profile', 'title', 'scheduling_type', 
            'is_all_day', 'frequency', 'date', 'weekday', 
            'start_time', 'end_time', 'extra_details'
        ]

    def get_extra_details(self, obj):
        # Prüfung: Zu welcher Unterklasse gehört diese Activity?
        if hasattr(obj, 'training'):
            return TrainingSerializer(obj.training).data
        if hasattr(obj, 'responsibility'):
            return ResponsibilitySerializer(obj.responsibility).data
        if hasattr(obj, 'recovery'):
            return RecoverySerializer(obj.recovery).data
        if hasattr(obj, 'competition'):
            return CompetitionSerializer(obj.competition).data
        return None

class DailyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMetric
        fields = '__all__'