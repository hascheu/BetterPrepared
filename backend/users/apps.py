# backend/users/apps.py
from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        # Das zwingt Django, die Signale zu laden, sobald die App bereit ist
        from . import signals