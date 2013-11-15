from django.conf.urls import patterns, url

from ssu import views

urlpatterns = patterns('',
        url(r'^$', views.index, name='index'),
        )

