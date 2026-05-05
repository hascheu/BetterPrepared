from django.db import models

# Create your models here.
#Hier definierst du deine Datenbankstruktur

class Event(models.Model):
    title = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    priority = models.IntegerField()