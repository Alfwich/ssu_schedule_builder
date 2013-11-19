from django.utils import simplejson
from dajaxice.decorators import dajaxice_register
from dajaxice.utils import deserialize_form
from ssu.models import Course
from dajax.core import Dajax
import random

@dajaxice_register
def sayhello(request):
    return simplejson.dumps({'message':'Hello Ajax'})

@dajaxice_register
def randomize(request):
    dajax = Dajax()
    dajax.assign('#query', 'value', random.randint(1, 10))
    return dajax.json()

@dajaxice_register
def find_courses(request, query):
    dajax = Dajax()
    print query
    courses = Course.objects.filter(title__icontains=query)

    out = []

    for course in courses:
        out.append("<p>%s - %s</p>" % (str(course), course.title))

    dajax.assign('#course_list', 'innerHTML', ''.join(out))

    return dajax.json()
