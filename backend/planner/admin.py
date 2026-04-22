from django.contrib import admin

# Register your models here.
#hier registrierst du Modelle für das Django Admin Interface
from .models import Event
admin.site.register(Event)