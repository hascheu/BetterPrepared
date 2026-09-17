from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import Profile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )
    # E-Mail im Serializer als Pflichtfeld definieren, damit leere Werte sofort abgefangen werden
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def validate_password(self, value):
        """Prüft das Passwort gegen Djangos Passwort-Regeln."""
        # 1. Passwort an die Validierung von Django übergeben (nutzt den aktuellen User-Kontext falls möglich)
        try:
            validate_password(password=value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_username(self, value):
        """Prüft, ob der Username bereits vergeben ist."""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Dieser Benutzername ist leider schon vergeben.")
        return value

    def validate_email(self, value):
        """Prüft, ob die E-Mail-Adresse bereits registriert wurde."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Diese E-Mail-Adresse wird bereits verwendet.")
        return value
    
    def create(self, validated_data):
        """Erstellt den User mit verschlüsseltem Passwort und legt das Profil an (falls kein Signal existiert)."""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Sicherstellen, dass das Profil nicht doppelt erstellt wird (falls du Django Signals nutzt)
        Profile.objects.get_or_create(user=user)
        
        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = ['username', 'email', 'sport_type', 'chronical_disease', 'status']