from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from users.models import Profile  
from .models import (
    Activity, Training, Responsibility, 
    Recovery, Competition, DailyMetric, OtherActivity
)
from .serializers import (
    ActivitySerializer, TrainingSerializer, 
    ResponsibilitySerializer, RecoverySerializer, 
    CompetitionSerializer, DailyMetricSerializer, OtherActivitySerializer
)

class ActivityViewSet(viewsets.ModelViewSet):
    """
    Der zentrale Knotenpunkt für den Kalender.
    'select_related' sorgt dafür, dass alle Spezial-Daten (Training, etc.)
    effizient mit EINER Datenbankabfrage geladen werden.
    """
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Zeigt jedem User nur seine eigenen Aktivitäten
        return Activity.objects.filter(profile__user=self.request.user).select_related(
            'training', 
            'responsibility', 
            'recovery', 
            'competition',
            'otheractivity'
        )
    
    def perform_create(self, serializer):
        # 1. Profil des aktuell eingeloggten Users holen
        profile = Profile.objects.get(user=self.request.user)
        
        # 2. Alle Daten, die das Frontend geschickt hat (auch die dynamischen!), abfangen
        raw_data = self.request.data
        
        # 3. Das Profil in die Validierungsdaten injizieren und mitspeichern
        serializer.save(profile=profile, **raw_data)
    
    def _get_field_type(self, django_field):
        """Hilfsfunktion: Übersetzt Django-Feldtypen in Frontend-Typen"""
        if isinstance(django_field, models.BooleanField):
            return 'boolean'
        elif isinstance(django_field, (models.IntegerField, models.FloatField, models.DecimalField)):
            return 'number'
        elif isinstance(django_field, models.DateField):
            return 'date'
        elif isinstance(django_field, models.TimeField):
            return 'time'
        elif isinstance(django_field, models.TextField):
            return 'textarea'
        return 'text'

    def _extract_fields_from_model(self, model_class, exclude_fields=None):
        """
        Analysiert ein Django-Modell dynamisch über das _meta-API 
        und baut die Feld-Konfiguration für das Frontend.
        """
        if exclude_fields is None:
            exclude_fields = []
            
        form_fields = []
        
        for field in model_class._meta.local_fields:
            if field.name in exclude_fields or field.primary_key or isinstance(field, models.ForeignKey):
                continue
                
            label = getattr(field, 'verbose_name', field.name).capitalize()
            
            field_config = {
                'name': field.name,
                'label': label,
                'type': 'text',
                'required': not field.blank 
            }
            
            if field.choices:
                field_config['type'] = 'select'
                # Korrektur für das JSON-Format: Übergibt lesbare Objekte statt roher Tupel
                field_config['options'] = [{'value': choice[0], 'label': choice[1]} for choice in field.choices]
            else:
                field_config['type'] = self._get_field_type(field)
                
            form_fields.append(field_config)
            
        return form_fields
    
    @action(detail=False, methods=['get'])
    def schema(self, request):
        """
        Gibt dem Frontend die Struktur vor, welche spezifischen Felder benötigt werden.
        URL: /api/activities/schema/?type=training
        """
        activity_type = request.query_params.get('type', 'other')

        type_to_model = {
            'training': Training,
            'competition': Competition,
            'responsibility': Responsibility,
            'recovery': Recovery,
            'other': OtherActivity, # Heißt in deinem Modell 'OtherActivity'
        }

        target_model = type_to_model.get(activity_type)
        specific_fields = []

        if target_model:
            # Da _extract_fields_from_model bereits mit 'local_fields' arbeitet,
            # werden alle geerbten Activity-Felder automatisch ignoriert!
            # Wir müssen nur die OneToOne-Verknüpfung zur Elternklasse (activity_ptr) ausschließen.
            specific_fields = self._extract_fields_from_model(target_model, exclude_fields=['activity_ptr'])

        return Response({
            'type': activity_type,
            'fields': specific_fields  # Schickt NUR noch die reinen Unterklassen-Felder ans Frontend!
        })

class DailyMetricViewSet(viewsets.ModelViewSet):
    """
    Sichert die täglichen Gesundheitswerte ab, sodass Athleten 
    niemals gegenseitig ihre Daten einsehen können.
    """
    serializer_class = DailyMetricSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # KORREKTUR: Absicherung gegen unbefugten Datenzugriff
        return DailyMetric.objects.filter(profile__user=self.request.user)

    def perform_create(self, serializer):
        profile = Profile.objects.get(user=self.request.user)
        serializer.save(profile=profile)