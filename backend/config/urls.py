# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. JWT-Authentifizierung (Login & Token-Refresh)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 2. NEU: Benutzerverwaltung (Registrierung etc.) aus der 'users'-App
    # Das bedeutet, im Frontend rufst du für die Registrierung auf:
    # http://127.0.0.1:8000/api/users/register/
    path('api/users/', include('users.urls')), 
    
    # 3. Sport-App-Logik (Delegation an activities/urls.py)
    # Wichtig: Wenn in activities.urls z.B. path('activities/', ...) steht,
    # bleibt die URL fürs Frontend weiterhin: http://127.0.0.1:8000/api/activities/
    path('api/', include('activities.urls')), 
]
