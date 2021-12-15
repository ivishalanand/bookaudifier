from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('search', views.search, name='search'),
    path('generate_audiobook', views.generate_audiobook, name='generate_audiobook')
]