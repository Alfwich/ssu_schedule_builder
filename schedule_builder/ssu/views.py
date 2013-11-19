from django.shortcuts import render
from dajaxice.core import dajaxice_autodiscover, dajaxice_config
from ssu.forms import CourseSearchForm

def index(request):
    form = CourseSearchForm()
    context = { 'form' : form }
    return render(request, 'ssu/index.html', context)

