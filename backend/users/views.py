from django.shortcuts import render
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import RegisterSerializer, ProfileSerializer
from .models import Profile

class RegisterView(APIView):
    # JEDER darf diesen Endpunkt aufrufen, um ein Konto zu erstellen
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": f"Benutzer '{user.username}' wurde erfolgreich registriert!",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)
        
        print("\n❌ VALIDIERUNGSFEHLER IM BACKEND:", serializer.errors, "\n")
        
        # Falls z.B. der Username schon existiert, schicken wir die Fehler (400 Bad Request) zurück
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ProfileView(APIView):
    # Nur eingeloggte Nutzer mit gültigem JWT-Token dürfen hier rein
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Sendet die Profildaten des aktuell eingeloggten Nutzers ans Frontend."""
        profile = request.user.profile  # Holt das Profil über das OneToOneField des Users
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        """Aktualisiert Teile des Profils (z.B. Sportart, Status oder Vorerkrankung)."""
        profile = request.user.profile
        # partial=True erlaubt es, z.B. NUR den Status zu ändern, ohne andere Felder mitsenden zu müssen
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Liest das Refresh-Token entweder aus dem Body (Mobile) oder aus dem Cookie (Web)
            refresh_token = request.data.get("refresh") or request.COOKIES.get("refresh_token")
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            response = Response({"message": "Erfolgreich ausgeloggt."}, status=status.HTTP_205_RESET_CONTENT)
            
            # Cookie im Browser sicher löschen
            response.delete_cookie('refresh_token', samesite='Lax')
            return response
        except Exception as e:
            return Response({"error": "Ungültiges Token."}, status=status.HTTP_400_BAD_REQUEST)
        
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            refresh_token = response.data.get("refresh")
            
            # Setzt das Refresh-Token als HttpOnly-Cookie für den Browser
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,              # JavaScript kann das Cookie NICHT auslesen (XSS-Schutz)
                secure=not settings.DEBUG,  # True in Produktion (NUR HTTPS), False bei localhost
                samesite='Lax',             # Schutz vor CSRF
                max_age=7 * 24 * 60 * 60    # 7 Tage (passend zu deiner SIMPLE_JWT Einstellung)
            )
            
        return response

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Kopie der Daten erstellen, falls request.data immutable ist
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        # Falls kein 'refresh' im Body liegt, das HttpOnly-Cookie nutzen
        if 'refresh' not in data and 'refresh_token' in request.COOKIES:
            data['refresh'] = request.COOKIES.get('refresh_token')
            request._full_data = data  # Aktualisiert die Daten für die Super-Klasse

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200 and 'refresh' in response.data:
            response.set_cookie(
                key='refresh_token',
                value=response.data['refresh'],
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=7 * 24 * 60 * 60
            )
        return response
