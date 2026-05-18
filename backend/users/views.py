from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer

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