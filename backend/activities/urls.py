# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, DailyMetricViewSet

router = DefaultRouter()
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'metrics', DailyMetricViewSet, basename='dailymetric')

urlpatterns = [
    path('', include(router.urls)),
]