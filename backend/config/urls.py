from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Login: Schicke Username/Passwort -> erhalte Access & Refresh Token
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Refresh: Schicke Refresh Token -> erhalte neuen Access Token
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/', admin.site.urls),
    path('api/', include('planner.urls')), # Hier wird die App eingebunden
]