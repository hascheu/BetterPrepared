from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import (
    OtherActivity, Activity, Training, Responsibility, 
    Recovery, Competition, DailyMetric
)

# --- Spezial-Serializer ---

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

class OtherActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = OtherActivity
        fields = ['notes']  # Das Freitextfeld für Notizen

class DailyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMetric
        fields = '__all__'

# --- Der zentrale ActivitySerializer ---

class ActivitySerializer(serializers.ModelSerializer):
    extra_details = serializers.SerializerMethodField(read_only=True)
    # Das Hilfsfeld für das Frontend, um den Typ beim Erstellen mitzugeben
    activity_type = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Activity
        fields = [
            'id', 'profile', 'title', 'scheduling_type', 
            'is_all_day', 'frequency', 'date', 'weekday', 
            'start_time', 'end_time', 'extra_details', 'activity_type'
        ]
        extra_kwargs = {
            'profile': {'required': False}  # Wird automatisch in der View über das User-Token gesetzt
        }

    def get_extra_details(self, obj):
        """
        Übersetzt die One-to-One-Relation der Django-Vererbung 
        in die jeweiligen Zusatzdaten für das Frontend.
        """
        if hasattr(obj, 'training'):
            return TrainingSerializer(obj.training).data
        if hasattr(obj, 'responsibility'):
            return ResponsibilitySerializer(obj.responsibility).data
        if hasattr(obj, 'recovery'):
            return RecoverySerializer(obj.recovery).data
        if hasattr(obj, 'competition'):
            return CompetitionSerializer(obj.competition).data
        if hasattr(obj, 'otheractivity'):  # <-- HIER ERGÄNZT
            return OtherActivitySerializer(obj.otheractivity).data
        return None

    def validate(self, attrs):
        """
        Triggert die 'clean()'-Logik aus models.py, damit Pflichtfelder 
        (wie weekday bei WEEKLY oder start_time/end_time) bereits beim
        API-Eingang ordentlich geprüft werden.
        """
        # Kopie erstellen und das schreibgeschützte Hilfsfeld temporär entfernen
        attrs_copy = attrs.copy()
        attrs_copy.pop('activity_type', None)
        
        # Ein virtuelles Modell-Objekt erstellen (noch nicht speichern!)
        instance = Activity(**attrs_copy)
        
        try:
            # Die Modell-eigene Validierungslogik ausführen
            instance.clean()
        except DjangoValidationError as e:
            # Eventuelle Django-Validierungsfehler in DRF-Fehler (400 Bad Request) umwandeln
            raise serializers.ValidationError(e.message_dict)
            
        return attrs

    def create(self, validated_data):
        # 1. Den Typ aus den Daten extrahieren
        activity_type = validated_data.pop('activity_type', None)
        
        # 2. Daten an das jeweils richtige (Unter-)Modell weiterleiten
        if activity_type == 'training':
            return Training.objects.create(**validated_data)
        elif activity_type == 'responsibility':
            return Responsibility.objects.create(**validated_data)
        elif activity_type == 'recovery':
            return Recovery.objects.create(**validated_data)
        elif activity_type == 'competition':
            return Competition.objects.create(**validated_data)
        elif activity_type == 'other':
            return OtherActivity.objects.create(**validated_data)
        
        # Fallback: Nur eine Basis-Activity erstellen
        return Activity.objects.create(**validated_data)