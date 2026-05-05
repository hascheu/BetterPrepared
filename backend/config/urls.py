from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from planner.views import (
    ProfileViewSet, ActivityViewSet, TrainingViewSet, 
    ResponsibilityViewSet, RecoveryViewSet, 
    CompetitionViewSet, DailyMetricViewSet
)

# Der Router erstellt automatisch alle Pfade für deine ViewSets
router = DefaultRouter()
router.register(r'profiles', ProfileViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'trainings', TrainingViewSet)
router.register(r'responsibilities', ResponsibilityViewSet)
router.register(r'recoveries', RecoveryViewSet)
router.register(r'competitions', CompetitionViewSet)
router.register(r'metrics', DailyMetricViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # Das bindet alle oben registrierten Routen unter /api/ ein
]