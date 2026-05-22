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

class ActivitySerializer(serializers.ModelSerializer):
    extra_details = serializers.SerializerMethodField(read_only=True)
    activity_type = serializers.CharField(write_only=True, required=False)
    
    # Als Write-Only deklarieren, damit DRF sie bei der Vor-Validierung akzeptiert
    duration = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    flexible_slots = serializers.JSONField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'profile', 'title', 'scheduling_type', 
            'is_all_day', 'frequency', 'date', 'weekday', 
            'start_time', 'end_time', 'extra_details', 'activity_type',
            'duration', 'flexible_slots'
        ]
        extra_kwargs = {
            'profile': {'required': False},
            'date': {'required': False, 'allow_null': True},
            'weekday': {'required': False, 'allow_null': True},
            'start_time': {'required': False, 'allow_null': True},
            'end_time': {'required': False, 'allow_null': True},
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

    def to_internal_value(self, data):
        """
        Schritt 1: Bereinigung der rohen Frontend-Daten, BEVOR DRF die Typen prüft.
        Das verhindert Abstürze bei leeren Strings.
        """
        # Kopie erstellen, da 'data' QueryDicts oft unveränderlich sind
        data = data.copy() if hasattr(data, 'copy') else dict(data)

        # 1. Leere Datums- und Zeit-Strings in echtes 'None/null' umwandeln
        for field in ['date', 'start_time', 'end_time', 'weekday']:
            if field in data and data[field] == "":
                data[field] = None

        # 2. Wenn das Frontend 'time' schickt, mappen wir es auf 'start_time'
        if 'time' in data and data['time'] and not data.get('start_time'):
            data['start_time'] = data['time']

        # 3. Wochentags-Mapping von String (z.B. 'MON' oder ['MON']) auf Djangos Integer (0-6)
        weekday_mapping = {'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5, 'SUN': 6}
        
        raw_weekday = data.get('weekdays') or data.get('weekday')
        if raw_weekday:
            # Falls ein Array kommt, nimm das erste Element, sonst den String selbst
            weekday_str = raw_weekday[0] if isinstance(raw_weekday, list) else raw_weekday
            if str(weekday_str).upper() in weekday_mapping:
                data['weekday'] = weekday_mapping[str(weekday_str).upper()]

        # 4. Vorab-Berechnung der Endzeit falls 'duration' und 'start_time' da sind,
        # damit das Modell-clean() wegen fehlender Endzeit nicht meckert!
        if data.get('duration') and data.get('start_time') and not data.get('end_time'):
            from datetime import datetime, timedelta
            try:
                start_str = data['start_time'][:5]  # Nur HH:MM
                start_dt = datetime.strptime(start_str, "%H:%M")
                end_dt = start_dt + timedelta(minutes=int(data['duration']))
                data['end_time'] = end_dt.time().strftime("%H:%M")
            except Exception:
                pass

        return super().to_internal_value(data)

    def validate(self, attrs):
        """
        Schritt 2: Modell-Validierung (clean) triggern
        """
        attrs_copy = attrs.copy()
        activity_type = attrs_copy.pop('activity_type', None)
        attrs_copy.pop('duration', None)
        attrs_copy.pop('flexible_slots', None)
        
        # Profil-Dummy injizieren für die Validierungsphase
        request = self.context.get('request')
        if 'profile' not in attrs_copy and request:
            from users.models import Profile
            try:
                attrs_copy['profile'] = Profile.objects.get(user=request.user)
            except Profile.DoesNotExist:
                pass

        model_mapping = {
            'training': Training,
            'responsibility': Responsibility,
            'recovery': Recovery,
            'competition': Competition,
            'other': OtherActivity,
        }
        
        TargetModel = model_mapping.get(activity_type, Activity)
        instance = TargetModel(**attrs_copy)
        
        try:
            # Hier läuft jetzt deine Modell-clean() Methode völlig fehlerfrei durch
            instance.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
            
        # Generiertes Datum (z.B. von DAILY/WEEKLY) zurück in den Serializer schreiben
        if instance.date and not attrs.get('date'):
            attrs['date'] = instance.date
            
        # Errechnete Endzeit für das finale Speichern sichern
        if instance.end_time and not attrs.get('end_time'):
            attrs['end_time'] = instance.end_time
            
        return attrs

    def create(self, validated_data):
        """
        Schritt 3: Speichern der korrekten Unterklassen-Instanz inklusive dynamischer Felder
        """
        activity_type = validated_data.pop('activity_type', None)
        validated_data.pop('duration', None)
        validated_data.pop('flexible_slots', None)

        request = self.context.get('request')
        raw_data = request.data if request else {}

        # MTI-Spezifische Felder direkt aus den Rohdaten fischen
        if activity_type == 'training':
            specific_fields = {f: raw_data.get(f) for f in ['training_type', 'intensity', 'heart_rate', 'rpe'] if raw_data.get(f) is not None}
            return Training.objects.create(**validated_data, **specific_fields)
            
        elif activity_type == 'responsibility':
            specific_fields = {f: raw_data.get(f) for f in ['responsibility_type', 'movement', 'rpe'] if raw_data.get(f) is not None}
            return Responsibility.objects.create(**validated_data, **specific_fields)
            
        elif activity_type == 'recovery':
            specific_fields = {f: raw_data.get(f) for f in ['recovery_type', 'sub_type'] if raw_data.get(f) is not None}
            return Recovery.objects.create(**validated_data, **specific_fields)
            
        elif activity_type == 'competition':
            specific_fields = {f: raw_data.get(f) for f in ['status', 'result', 'fighting_weight'] if raw_data.get(f) is not None}
            return Competition.objects.create(**validated_data, **specific_fields)
            
        elif activity_type == 'other':
            specific_fields = {f: raw_data.get(f) for f in ['notes'] if raw_data.get(f) is not None}
            return OtherActivity.objects.create(**validated_data, **specific_fields)
        
        return Activity.objects.create(**validated_data)
    

