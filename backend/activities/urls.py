from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Wichtig: Der Import muss auf deine App zeigen
from .views import ActivityViewSet, DailyMetricViewSet

router = DefaultRouter()
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'metrics', DailyMetricViewSet)

urlpatterns = [
    path('', include(router.urls)),
]