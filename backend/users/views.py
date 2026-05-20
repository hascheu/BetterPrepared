from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
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