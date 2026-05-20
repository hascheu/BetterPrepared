# backend/users/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Sobald ein neuer User erstellt wird, wird automatisch ein Profil erzeugt!"""
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Sorgt dafür, dass das Profil aktualisiert wird, wenn der User sich ändert."""
    if hasattr(instance, 'profile'):
        instance.profile.save()