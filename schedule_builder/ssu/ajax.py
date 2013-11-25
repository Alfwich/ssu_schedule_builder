from django.db.models import Q
from django.utils import simplejson
from dajaxice.decorators import dajaxice_register
from dajaxice.utils import deserialize_form
from ssu.models import Course
from dajax.core import Dajax
from itertools import chain
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

    courses_by_subject = Course.objects.filter(subject_no__istartswith=query.replace(" ", ""))
    courses_by_title = Course.objects.filter( Q(catalog_no__startswith=query) | Q(title__icontains=query) )
    result_courses = list(chain(courses_by_subject, courses_by_title))[:10]


    out = []

    for index, course in enumerate(result_courses):
        
        if index is 0:
            div_class = "class='selected'"
        else:
            div_class = ""

        out.append("<div %s><span>%s - %s</span><button onClick='add_course(%d)'>Add</button></div>" % (div_class, str(course), course.title, course.id))

    dajax.assign('.course.list', 'innerHTML', ''.join(out))

    return dajax.json()

@dajaxice_register
def populate_ge_result(request, code):
    dajax = Dajax()

    courses = Course.objects.filter(ge_code__iexact=code)

    out = []

    for course in courses:
        out.append("<div><span>%s - %s</span><input type='checkbox' name='courses' value='%s'</div>" % ( str(course), course.title, course.id ))

    dajax.assign('.ge_result.list', 'innerHTML', ''.join(out))

    dajax.script('ge_callback();')

    return dajax.json()

@dajaxice_register
def add_course(request, course_id):
    dajax = Dajax()
    course = Course.objects.get(id=course_id)

    out = "<p>%s - % s</p>" % ( str(course), course.title )

    dajax.append('#added_courses', 'innerHTML', out)

    return dajax.json()
