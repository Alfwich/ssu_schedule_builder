from django.conf.urls import patterns, include, url
from dajaxice.core import dajaxice_autodiscover, dajaxice_config
dajaxice_autodiscover()

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
        url(dajaxice_config.dajaxice_url, include('dajaxice.urls')),
        url(r'^ssu/', include('ssu.urls')),
        
    # Examples:
    # url(r'^$', 'schedule_builder.views.home', name='home'),
    # url(r'^schedule_builder/', include('schedule_builder.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
