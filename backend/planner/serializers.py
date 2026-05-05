# notwendig für API Schnittstelle
# Next.js kann nicht direkt mit Django Modellen sprechen --> braucht JSON Daten
# Umwandlung in JSON Daten mit Django Rest Framework
# Serializer sagt Django nimm das Training-Objekt und verwandle es in ein Format, das wie Text (JSON) aussieh

from rest_framework import serializers
from .models import (
    Profile, Activity, Training, Responsibility, 
    Recovery, Competition, DailyMetric
)

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'

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

class DailyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMetric
        fields = '__all__'