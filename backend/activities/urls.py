from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, DailyMetricViewSet

router = DefaultRouter()

# Füge hier bei beiden Registern den 'basename' am Ende hinzu!
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'metrics', DailyMetricViewSet, basename='dailymetric')

urlpatterns = [
    path('', include(router.urls)),
]