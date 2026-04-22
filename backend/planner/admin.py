from django.contrib import admin

# Register your models here.
# planner/admin.py
from .models import Event
admin.site.register(Event)