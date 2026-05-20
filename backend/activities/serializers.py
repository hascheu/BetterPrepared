from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import (
    OtherActivity, Activity, Training, Responsibility, 
    Recovery, Competition, DailyMetric
)

# --- Spezial-Serializer (Bleiben unverändert, super!) ---
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
        fields = ['notes']

class DailyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMetric
        fields = '__all__'


# --- Der zentrale ActivitySerializer (Anpassung für die Unterklassen-Validierung) ---
class ActivitySerializer(serializers.ModelSerializer):
    extra_details = serializers.SerializerMethodField(read_only=True)
    activity_type = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Activity
        fields = [
            'id', 'profile', 'title', 'scheduling_type', 
            'is_all_day', 'frequency', 'date', 'weekday', 
            'start_time', 'end_time', 'extra_details', 'activity_type'
        ]
        extra_kwargs = {
            'profile': {'required': False}  # Wird in der View über das Token gesetzt
        }

    def get_extra_details(self, obj):
        if hasattr(obj, 'training'):
            return TrainingSerializer(obj.training).data
        if hasattr(obj, 'responsibility'):
            return ResponsibilitySerializer(obj.responsibility).data
        if hasattr(obj, 'recovery'):
            return RecoverySerializer(obj.recovery).data
        if hasattr(obj, 'competition'):
            return CompetitionSerializer(obj.competition).data
        if hasattr(obj, 'otheractivity'):
            return OtherActivitySerializer(obj.otheractivity).data
        return None

    def validate(self, attrs):
        """
        Triggert die 'clean()'-Logik aus models.py auf der KORREKTEN Unterklasse.
        Füllt automatische Standardwerte (wie das heutige Datum) direkt in den Serializer ab.
        """
        attrs_copy = attrs.copy()
        activity_type = attrs_copy.pop('activity_type', None)
        
        # Mapping: Welcher 'activity_type' gehört zu welchem Django-Modell Klasse?
        model_mapping = {
            'training': Training,
            'responsibility': Responsibility,
            'recovery': Recovery,
            'competition': Competition,
            'other': OtherActivity,
        }
        
        # Bestimme das Zielmodell (Nutze Basis-Activity als Fallback)
        TargetModel = model_mapping.get(activity_type, Activity)
        
        # Erstelle eine temporäre Instanz des exakten Modells
        instance = TargetModel(**attrs_copy)
        
        try:
            # Jetzt läuft clean() im Kontext des richtigen Modells!
            instance.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
            
        # WICHTIG: Da clean() bei DAILY/WEEKLY das Datum automatisch auf heute 
        # setzt, müssen wir dieses von der Modell-Instanz zurück in den Serializer schreiben!
        if instance.date and not attrs.get('date'):
            attrs['date'] = instance.date
            
        return attrs

    def create(self, validated_data):
        # Den Typ aus den Daten extrahieren
        activity_type = validated_data.pop('activity_type', None)
        
        # Da wir nun das vom Modell in clean() generierte Datum in validated_data haben,
        # wird es hier perfekt mit in die Tabellen geschrieben.
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
        
        return Activity.objects.create(**validated_data)