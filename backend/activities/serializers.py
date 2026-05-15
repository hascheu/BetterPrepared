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

# --- Spezial-Serializer ---
# Wichtig: Bei Vererbung in Meta.model die Unterklasse angeben!
class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = ['training_type', 'intensity', 'heart_rate', 'rpe']

class ResponsibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Responsibility
        fields = ['responsibility_type', 'movement', 'rpe']

class RecoverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Recovery
        fields = ['recovery_type', 'sub_type']

class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = ['status', 'result', 'fighting_weight']

class DailyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMetric
        fields = '__all__'

# --- Der zentrale ActivitySerializer ---

class ActivitySerializer(serializers.ModelSerializer):
    extra_details = serializers.SerializerMethodField(read_only=True)
    # Ein Hilfsfeld für das Frontend, um den Typ beim Erstellen mitzugeben
    activity_type = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Activity
        fields = [
            'id', 'profile', 'title', 'scheduling_type', 
            'is_all_day', 'frequency', 'date', 'weekday', 
            'start_time', 'end_time', 'extra_details', 'activity_type'
        ]

    def get_extra_details(self, obj):
        # Nutzt die One-to-One Relation der Vererbung (lowercase model name)
        if hasattr(obj, 'training'):
            return TrainingSerializer(obj.training).data
        if hasattr(obj, 'responsibility'):
            return ResponsibilitySerializer(obj.responsibility).data
        if hasattr(obj, 'recovery'):
            return RecoverySerializer(obj.recovery).data
        if hasattr(obj, 'competition'):
            return CompetitionSerializer(obj.competition).data
        return None

    def create(self, validated_data):
        # 1. Den Typ aus den Daten extrahieren
        activity_type = validated_data.pop('activity_type', None)
        
        # 2. Die restlichen Daten sind für die Basis-Activity oder Unterklasse
        # Da Training von Activity erbt, können wir direkt die Unterklasse erstellen.
        # Django erstellt dann automatisch den Activity-Eintrag mit.
        
        if activity_type == 'training':
            return Training.objects.create(**validated_data)
        elif activity_type == 'responsibility':
            return Responsibility.objects.create(**validated_data)
        elif activity_type == 'recovery':
            return Recovery.objects.create(**validated_data)
        elif activity_type == 'competition':
            return Competition.objects.create(**validated_data)
        
        # Fallback: Nur eine Basis-Activity erstellen
        return Activity.objects.create(**validated_data)