from django.conf.urls import patterns, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from ssu import views

urlpatterns = patterns('',
        url(r'^$', views.index, name='index'),
        )
urlpatterns += staticfiles_urlpatterns()
