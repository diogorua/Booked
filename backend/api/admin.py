from django.contrib import admin
from .models import ClientProfile, Category, Book

admin.site.register(ClientProfile)
admin.site.register(Category)
admin.site.register(Book)