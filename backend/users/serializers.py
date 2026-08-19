from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password  # <-- 1. Importieren
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import Profile

class RegisterSerializer(serializers.ModelSerializer):
    # Das Passwort soll nur geschrieben, aber niemals über die API wieder ausgelesen werden dürfen
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def validate_password(self, value):
        """Prüft das Passwort gegen Djangos Passwort-Regeln."""
        try:
            # Reicht das Passwort an Djangos Prüfungs-Pipeline weiter
            validate_password(password=value)
        except DjangoValidationError as e:
            # Wandelt Djangos ValidationError in den Fehler-Typ von Django REST Framework um
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_username(self, value):
        """Prüft, ob der Username bereits vergeben ist."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Dieser Benutzername ist leider schon vergeben.")
        return value

    def validate_email(self, value):
        """Prüft, ob die E-Mail-Adresse bereits registriert wurde."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Diese E-Mail-Adresse wird bereits verwendet.")
        return value
    
    def create(self, validated_data):
        """Erstellt den User mit verschlüsseltem Passwort und legt sofort das Profil an."""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # NEU: Sofort das verknüpfte Profil in der Datenbank erstellen!
        Profile.objects.create(user=user)
        
        return user

class ProfileSerializer(serializers.ModelSerializer):
    # Diese Felder holen wir schreibgeschützt direkt aus dem verknüpften User-Modell
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        # Diese Felder kann das Frontend abrufen und (bis auf username/email) bearbeiten
        fields = ['username', 'email', 'sport_type', 'chronical_disease', 'status']