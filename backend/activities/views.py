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
        
        # 2. Das Profil injizieren und mitspeichern. 
        # Da wir im ViewSet sind, hat der Serializer automatisch Zugriff auf self.request über den Context!
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
    
    @action(detail=False, methods=['get'], url_path='generate-versions')
    def generate_versions(self, request):
        """
        Berechnet die 3 besten Kalenderversionen für eine Kalenderwoche.
        URL: /api/activities/generate-versions/?date=2026-07-06
        """
        import copy  # Erlaubt uns, Objekte im RAM sauber zu kopieren
        
        date_str = request.query_params.get('date')
        if not date_str:
            return Response(
                {'error': 'Ein Startdatum (?date=YYYY-MM-DD) ist erforderlich.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            start_week_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {'error': 'Falsches Datumsformat. Bitte YYYY-MM-DD nutzen.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Profil über den eingeloggten User ziehen
        profile = request.user.profile
        
        # Deinen Algorithmus anwerfen
        best_three = generate_best_versions(profile, start_week_date)
        
        # Daten für das Frontend serialisieren
        response_data = []
        for version in best_three:
            serialized_activities = []
            for act in version['calendar']:
                # Wir kopieren die Aktivität kurz im RAM, um ihre Felder temporär 
                # mit den berechneten Zeiten zu füttern, bevor der Serializer anspringt.
                act_copy = copy.copy(act)
                act_copy.date = act.date
                act_copy.start_time = act.start_time

                # Der Serializer übernimmt nun das automatische Formatieren (z.B. %H:%M für start_time)
                serializer = self.get_serializer(act_copy, context={'request': request})
                act_data = serializer.data
                
                # Endzeit synchron im gleichen Format (%H:%M) für die Kalenderdarstellung berechnen
                if act.date and act.start_time:
                    full_dt = datetime.combine(act.date, act.start_time) + timedelta(minutes=act.duration)
                    act_data['end_time'] = full_dt.time().strftime("%H:%M")
                else:
                    act_data['end_time'] = None
                    
                serialized_activities.append(act_data)
                
            response_data.append({
                'score': version['score'],
                'activities': serialized_activities
            })
            
        return Response({'versions': response_data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='save-version')
    def save_version(self, request):
        """
        Nimmt die vom User gewählte Version entgegen und speichert sie fest in der DB.
        URL: /api/activities/save-version/
        """
        activities_data = request.data.get('activities', [])
        if not activities_data:
            return Response(
                {'error': 'Keine Aktivitäten zum Speichern übergeben.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        profile = request.user.profile
        
        try:
            # Wir nutzen eine Datenbank-Transaktion: Entweder ALLES wird gespeichert oder NICHTS
            from django.db import transaction
            with transaction.atomic():
                for act_data in activities_data:
                    # Sicherstellen, dass die Aktivität auch wirklich diesem User gehört
                    activity = Activity.objects.get(id=act_data['id'], profile=profile)
                    
                    # Berechnete Zeiten parsen
                    activity.date = datetime.strptime(act_data['date'], "%Y-%m-%d").date()
                    
                    # KORREKTUR: Erwartet das vom Serializer gelieferte HH:MM Format (ohne Sekunden)
                    start_time_obj = datetime.strptime(act_data['start_time'], "%H:%M").time()
                    activity.start_time = start_time_obj
                    
                    # Endzeit berechnen und eintragen
                    full_datetime = datetime.combine(activity.date, start_time_obj) + timedelta(minutes=activity.duration)
                    activity.end_time = full_datetime.time()
                    
                    # Fest in die Datenbank schreiben
                    activity.save()
                    
            return Response({'status': 'success', 'message': 'Kalenderwoche erfolgreich gespeichert!'}, status=status.HTTP_200_OK)
            
        except Activity.DoesNotExist:
            return Response(
                {'error': 'Eine oder mehrere Aktivitäten wurden nicht gefunden oder gehören nicht zu deinem Profil.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Fehler beim Speichern: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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