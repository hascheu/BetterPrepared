from django.contrib.auth.models import User
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    # Das Passwort soll nur geschrieben, aber niemals über die API wieder ausgelesen werden dürfen
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

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
        """Erstellt den User mit verschlüsseltem Passwort."""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user