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

class ActivityViewSet(viewsets.ModelViewSet):
    """
    Der zentrale Knotenpunkt für den Kalender.
    'select_related' sorgt dafür, dass alle Spezial-Daten (Training, etc.)
    effizient mit EINER Datenbankabfrage geladen werden.
    """
    serializer_class = ActivitySerializer

    def get_queryset(self):
        # Wir sagen Django: Hol Activity UND schau direkt in die Untertabellen
        return Activity.objects.all().select_related(
            'training', 
            'responsibility', 
            'recovery', 
            'competition'
        )

# Die anderen ViewSets bleiben spezifisch, falls du mal NUR Trainings 
# oder NUR Competitions (z.B. in einer Statistik-Liste) abrufen willst.

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

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class DailyMetricViewSet(viewsets.ModelViewSet):
    queryset = DailyMetric.objects.all()
    serializer_class = DailyMetricSerializer