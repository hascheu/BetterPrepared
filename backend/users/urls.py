# backend/users/urls.py
from django.urls import path
from .views import RegisterView

urlpatterns = [
    # Diese Route ist relativ zu dem, was wir in der allgemeinen urls.py definieren
    path('register/', RegisterView.as_view(), name='register'),
]