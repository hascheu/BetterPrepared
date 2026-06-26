from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import (
    OtherActivity, Activity, Training, Responsibility, 
    Recovery, Competition, DailyMetric, FlexibleSlot
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


# --- Hilfs-Serializer für die Ausgabe der flexiblen Slots ---
class FlexibleSlotSerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format='%H:%M')
    end_time = serializers.TimeField(format='%H:%M')
    
    class Meta:
        model = FlexibleSlot
        fields = ['id', 'date', 'weekday', 'start_time', 'end_time']


class ActivitySerializer(serializers.ModelSerializer):
    extra_details = serializers.SerializerMethodField(read_only=True)
    activity_type = serializers.CharField(write_only=True, required=False)
    activity_kind = serializers.SerializerMethodField(read_only=True)
    
    # NEU: flexible_slots liest via MethodField (für GET) und akzeptiert rohes JSON (für POST)
    flexible_slots = serializers.SerializerMethodField(read_only=True)
    flexible_slots_input = serializers.JSONField(write_only=True, required=False, allow_null=True, source='flexible_slots')
    
    # Erzwingt das Format HH:MM bei der Ausgabe ans Frontend
    start_time = serializers.TimeField(format='%H:%M', required=False, allow_null=True)
    end_time = serializers.TimeField(format='%H:%M', required=False, allow_null=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'profile', 'title', 'scheduling_type', 'duration',
            'is_all_day', 'frequency', 'date', 'weekday', 
            'start_time', 'end_time', 'extra_details', 'activity_type', 'activity_kind',
            'flexible_slots', 'flexible_slots_input'
        ]
        extra_kwargs = {
            'profile': {'required': False},
            'date': {'required': False, 'allow_null': True},
            'weekday': {'required': False, 'allow_null': True},
            'start_time': {'required': False, 'allow_null': True},
            'end_time': {'required': False, 'allow_null': True},
        }

    def get_activity_kind(self, obj):
        if hasattr(obj, 'training'): return 'TRAINING'
        if hasattr(obj, 'responsibility'): return 'RESPONSIBILITY'
        if hasattr(obj, 'recovery'): return 'RECOVERY'
        if hasattr(obj, 'competition'): return 'COMPETITION'
        if hasattr(obj, 'otheractivity'): return 'OTHER'
        return 'BASE'

    def get_extra_details(self, obj):
        if hasattr(obj, 'training'): return TrainingSerializer(obj.training).data
        if hasattr(obj, 'responsibility'): return ResponsibilitySerializer(obj.responsibility).data
        if hasattr(obj, 'recovery'): return RecoverySerializer(obj.recovery).data
        if hasattr(obj, 'competition'): return CompetitionSerializer(obj.competition).data
        if hasattr(obj, 'otheractivity'): return OtherActivitySerializer(obj.otheractivity).data
        return None

    # NEU: Gibt die gespeicherten Slots zurück ans Frontend
    def get_flexible_slots(self, obj):
        slots = obj.flexible_slots.all()
        return FlexibleSlotSerializer(slots, many=True).data

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)

        for field in ['date', 'start_time', 'end_time', 'weekday']:
            if field in data and data[field] == "":
                data[field] = None

        if 'time' in data and data['time'] and not data.get('start_time'):
            data['start_time'] = data['time']

        # Wochentags-Mapping
        weekday_mapping = {'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5, 'SUN': 6}
        
        raw_weekday = data.get('weekdays') or data.get('weekday')
        if raw_weekday:
            weekday_str = raw_weekday[0] if isinstance(raw_weekday, list) else raw_weekday
            if str(weekday_str).upper() in weekday_mapping:
                data['weekday'] = weekday_mapping[str(weekday_str).upper()]

        # Endzeit-Berechnung für FIXED
        if data.get('duration') and data.get('start_time') and not data.get('end_time'):
            from datetime import datetime, timedelta
            try:
                start_str = data['start_time'][:5]
                start_dt = datetime.strptime(start_str, "%H:%M")
                end_dt = start_dt + timedelta(minutes=int(data['duration']))
                data['end_time'] = end_dt.time().strftime("%H:%M")
            except Exception:
                pass

        return super().to_internal_value(data)

    def validate(self, attrs):
        attrs_copy = attrs.copy()
        activity_type = attrs_copy.pop('activity_type', None)
        attrs_copy.pop('flexible_slots', None) # Pop die Source-Zuweisung weg für die Validierung
        
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
            instance.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
            
        if instance.date and not attrs.get('date'):
            attrs['date'] = instance.date
            
        if instance.end_time and not attrs.get('end_time'):
            attrs['end_time'] = instance.end_time
            
        return attrs

    def create(self, validated_data):
        activity_type = validated_data.pop('activity_type', None)
        # Abfangen der flexiblen Slots, bevor die Aktivität gebaut wird
        slots_data = validated_data.pop('flexible_slots', None) or []

        request = self.context.get('request')
        raw_data = request.data if request else {}

        # MTI-Instanz erstellen
        if activity_type == 'training':
            specific_fields = {f: raw_data.get(f) for f in ['training_type', 'intensity', 'heart_rate', 'rpe'] if raw_data.get(f) is not None}
            activity = Training.objects.create(**validated_data, **specific_fields)
        elif activity_type == 'responsibility':
            specific_fields = {f: raw_data.get(f) for f in ['responsibility_type', 'movement', 'rpe'] if raw_data.get(f) is not None}
            activity = Responsibility.objects.create(**validated_data, **specific_fields)
        elif activity_type == 'recovery':
            specific_fields = {f: raw_data.get(f) for f in ['recovery_type', 'sub_type'] if raw_data.get(f) is not None}
            activity = Recovery.objects.create(**validated_data, **specific_fields)
        elif activity_type == 'competition':
            specific_fields = {f: raw_data.get(f) for f in ['status', 'result', 'fighting_weight'] if raw_data.get(f) is not None}
            activity = Competition.objects.create(**validated_data, **specific_fields)
        elif activity_type == 'other':
            specific_fields = {f: raw_data.get(f) for f in ['notes'] if raw_data.get(f) is not None}
            activity = OtherActivity.objects.create(**validated_data, **specific_fields)
        else:
            activity = Activity.objects.create(**validated_data)

        # NEU: Speichern der flexiblen Slot-Optionen in der Zusatz-Tabelle
        if validated_data.get('scheduling_type') == 'FLEXIBLE' and slots_data:
            weekday_mapping = {'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5, 'SUN': 6}
            
            for slot in slots_data:
                # Wochentag aus dem Frontend-String in Django-Integer umwandeln
                raw_wd = slot.get('weekday')
                wd_int = weekday_mapping.get(str(raw_wd).upper()) if raw_wd else None
                
                FlexibleSlot.objects.create(
                    activity=activity,
                    date=slot.get('date') or None,
                    weekday=wd_int,
                    start_time=slot.get('start_time'),
                    end_time=slot.get('end_time')
                )

        return activity