# kleine Logik-Blöcke, die sagen: „Wenn jemand /api/trainings/ aufruft, gib ihm alle Trainings des eingeloggten Nutzers

from rest_framework import viewsets
from .models import (
    Profile, Activity, Training, Responsibility, 
    Recovery, Competition, DailyMetric
)
from .serializers import (
    ProfileSerializer, ActivitySerializer, TrainingSerializer, 
    ResponsibilitySerializer, RecoverySerializer, 
    CompetitionSerializer, DailyMetricSerializer
)

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.all()
    serializer_class = TrainingSerializer

class ResponsibilityViewSet(viewsets.ModelViewSet):
    queryset = Responsibility.objects.all()
    serializer_class = ResponsibilitySerializer

class RecoveryViewSet(viewsets.ModelViewSet):
    queryset = Recovery.objects.all()
    serializer_class = RecoverySerializer

class CompetitionViewSet(viewsets.ModelViewSet):
    queryset = Competition.objects.all()
    serializer_class = CompetitionSerializer

class DailyMetricViewSet(viewsets.ModelViewSet):
    queryset = DailyMetric.objects.all()
    serializer_class = DailyMetricSerializer