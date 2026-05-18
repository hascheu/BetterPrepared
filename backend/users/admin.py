from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'sport_type', 'status')
    search_fields = ('user__username', 'sport_type')
