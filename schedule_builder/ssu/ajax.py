from django.db.models import Q
from django.utils import simplejson
from dajaxice.decorators import dajaxice_register
from dajaxice.utils import deserialize_form
from ssu.models import Course
from dajax.core import Dajax
import random

added_courses = []

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
    courses = Course.objects.filter( Q(subject_no__icontains=query.replace(" ", "")) | Q(title__icontains=query) )[:10]

    out = []

    for course in courses:
        out.append("<div><span>%s - %s</span><button onClick='Dajaxice.ssu.add_course(Dajax.process, { course_id: %d })'>Add</button></div>" % (str(course), course.title, course.id))

    dajax.assign('#course_list', 'innerHTML', ''.join(out))

    return dajax.json()

@dajaxice_register
def add_course(request, course_id):
    dajax = Dajax()
    course = Course.objects.get(id=course_id)

    added_courses.append(course_id)
    print added_courses

    out = "<p>%s - % s</p>" % ( str(course), course.title )

    dajax.append('#added_courses', 'innerHTML', out)

    return dajax.json()