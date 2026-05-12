from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ActivityViewSet, TrainingViewSet, ProfileViewSet, 
    DailyMetricViewSet, CompetitionViewSet
)

# Der Router erstellt automatisch die Pfade wie /activities/ oder /activities/1/
router = DefaultRouter()
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'trainings', TrainingViewSet, basename='training')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'metrics', DailyMetricViewSet, basename='metric')
router.register(r'competitions', CompetitionViewSet, basename='competition')

urlpatterns = [
    path('', include(router.urls)),
]