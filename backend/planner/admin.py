from django.contrib import admin
from .models import Profile, Activity, Training, Responsibility, Recovery, Competition, DailyMetric

# Wir registrieren hier alle deine neuen Modelle, 
# damit sie im Admin-Interface (Browser) sichtbar werden.

admin.site.register(Profile)
admin.site.register(Activity)
admin.site.register(Training)
admin.site.register(Responsibility)
admin.site.register(Recovery)
admin.site.register(Competition)
admin.site.register(DailyMetric)