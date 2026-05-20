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
        return Activity.objects.filter(profile__user=self.request.user).all().select_related(
            'training', 
            'responsibility', 
            'recovery', 
            'competition',
            'otheractivity'
        )
    
    def perform_create(self, serializer):
        profile = Profile.objects.get(user=self.request.user)
        serializer.save(profile=profile)
    
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
        
        # Iteriere durch alle lokalen (selbst definierten) Felder des Modells
        for field in model_class._meta.local_fields:
            # Überspringe IDs, Fremdschlüssel und explizit ausgeschlossene Felder
            if field.name in exclude_fields or field.primary_key or isinstance(field, models.ForeignKey):
                continue
                
            # Ermittle das Label (nutzt verbose_name von Django oder den Feldnamen)
            label = getattr(field, 'verbose_name', field.name).capitalize()
            
            field_config = {
                'name': field.name,
                'label': label,
                'type': 'text',
                # Ein Feld ist im Formular erforderlich, wenn 'blank=False' im Modell steht
                'required': not field.blank 
            }
            
            # 1. Prüfen, ob das Feld feste Auswahlmöglichkeiten (Choices) hat
            if field.choices:
                field_config['type'] = 'select'
                # Übergibt dem Frontend eine Liste aus [Wert, Lesbarer_Text]
                field_config['options'] = [choice for choice in field.choices]
            else:
                # 2. Wenn keine Choices, ermittle den generischen Typ (date, number, etc.)
                field_config['type'] = self._get_field_type(field)
                
            form_fields.append(field_config)
            
        return form_fields

    @action(detail=False, methods=['get'])
    def schema(self, request):
        """
        Gibt dem Frontend die Struktur vor, welche Felder benötigt werden.
        Liest die Felder DYNAMISCH aus den Modellen im models.py aus.
        URL: /api/activities/schema/?type=training
        """
        activity_type = request.query_params.get('type', 'other')

        # Zuordnung der Typen zu den spezialisierten Untermodellen
        type_to_model = {
            'training': Training,
            'competition': Competition,
            'responsibility': Responsibility,
            'recovery': Recovery,
            'other': OtherActivity,
        }

        # 1. Basis-Felder direkt aus dem Activity-Modell auslesen
        # Wir schließen 'profile' aus, da das Backend dies automatisch setzt
        base_fields = self._extract_fields_from_model(Activity, exclude_fields=['profile'])

        # 2. Spezifische Zusatzfelder ermitteln
        specific_fields = []
        target_model = type_to_model.get(activity_type)

        if target_model:
            # 'activity_ptr' ist der interne Name der Vererbung bei Django, den filtern wir aus
            specific_fields = self._extract_fields_from_model(target_model, exclude_fields=['activity_ptr'])

        # 3. Zusammenführen und zurückgeben
        return Response({
            'type': activity_type,
            'fields': base_fields + specific_fields
        })

class DailyMetricViewSet(viewsets.ModelViewSet):
    queryset = DailyMetric.objects.all()
    serializer_class = DailyMetricSerializer