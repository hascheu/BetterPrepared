from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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
    
    @action(detail=False, methods=['get'])
    def schema(self, request):
        activity_type = request.query_params.get('type')

        # Gemeinsame Felder für ALLE Aktivitäten (aus der Klasse Activity)
        base_fields = [
            {'name': 'title', 'label': 'Titel', 'type': 'text', 'required': True},
            {'name': 'date', 'label': 'Datum', 'type': 'date', 'required': False},
            {'name': 'start_time', 'label': 'Startzeit', 'type': 'time', 'required': False},
            {'name': 'end_time', 'label': 'Endzeit', 'type': 'time', 'required': False},
            {
                'name': 'scheduling_type', 
                'label': 'Planungstyp', 
                'type': 'select', 
                'options': [choice for choice in Activity.SchedulingType.choices]
            },
        ]

        # Spezifische Felder je nach Typ
        specific_fields = []

        if activity_type == 'training':
            specific_fields = [
                {'name': 'training_type', 'label': 'Trainingsart', 'type': 'select', 'options': [c for c in Training.TrainingType.choices]},
                {'name': 'intensity', 'label': 'Intensität', 'type': 'select', 'options': [c for c in Training.Intensity.choices]},
                {'name': 'rpe', 'label': 'Anstrengung (RPE 1-10)', 'type': 'number', 'min': 1, 'max': 10},
                {'name': 'heart_rate', 'label': 'Puls (Ø)', 'type': 'number'},
            ]
        elif activity_type == 'responsibility':
            specific_fields = [
                {'name': 'responsibility_type', 'label': 'Kategorie', 'type': 'select', 'options': [c for c in Responsibility.RespType.choices]},
                {'name': 'movement', 'label': 'Belastung', 'type': 'select', 'options': [c for c in Responsibility.Movement.choices]},
                {'name': 'rpe', 'label': 'Anstrengung (1-10)', 'type': 'number'},
            ]
        elif activity_type == 'recovery':
            specific_fields = [
                {'name': 'recovery_type', 'label': 'Erholungsart', 'type': 'select', 'options': [c for c in Recovery.RecoveryType.choices]},
                {'name': 'sub_type', 'label': 'Details (z.B. Sauna)', 'type': 'text'},
            ]
        elif activity_type == 'competition':
            specific_fields = [
                {'name': 'status', 'label': 'Status', 'type': 'select', 'options': [c for c in Competition.Status.choices]},
                {'name': 'fighting_weight', 'label': 'Kampfgewicht (kg)', 'type': 'number'},
                {'name': 'result', 'label': 'Ergebnis/Notizen', 'type': 'textarea'},
            ]

        return Response({
            'type': activity_type,
            'fields': base_fields + specific_fields
        })
    
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class DailyMetricViewSet(viewsets.ModelViewSet):
    queryset = DailyMetric.objects.all()
    serializer_class = DailyMetricSerializer
