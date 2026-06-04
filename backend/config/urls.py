# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Alles was mit Users zu tun hat (Register, Login, Refresh) wird hierhin delegiert:
    path('api/users/', include('users.urls')), 
    
    # Deine Sport-App-Logik
    path('api/', include('activities.urls')), 
]