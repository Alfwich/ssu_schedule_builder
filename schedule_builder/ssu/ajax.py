from django.db.models import Q
from django.utils import simplejson
from dajaxice.decorators import dajaxice_register
from dajaxice.utils import deserialize_form
from django.core import serializers
from ssu.models import *
from itertools import *
from dajax.core import Dajax
import json
import random

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
	
    if not 'courses' in request.session:
        request.session['courses'] = []	
		
    request.session['courses'].append( [ course_id ] )
		
    request.session.modified = True

    return dajax.json()

@dajaxice_register	
def make_schedules( request ):
	dajax = Dajax()
	
	if not 'courses' in request.session:
		request.session['courses'] = []
		
	if not 'schedules' in request.session:
		request.session['schedules'] = []	
		
	request.session['schedules'] = list( product( *request.session['courses'] ) )
	return dajax.json();
	
@dajaxice_register
def render_schedule( request, width, height, schedule_id ):

	if not 'courses' in request.session:
		request.session['courses'] = []
		
	if not 'schedules' in request.session:
		request.session['schedules'] = []

			
	dajax = Dajax()
	dajax.clear( '.entries', 'innerHTML' )
	
	dayCode = { 
	"M":"monday",
	"T":"tuesday",
	"W":"wednesday",
	"TH":"thursday",
	"F":"friday",
	"S":"saturday",
	"ARR":"null",
	}
	
	if( schedule_id >= len(request.session['schedules']) ):
		schedule_id = len(request.session['schedules'])-1;
		
	if( len(request.session['schedules']) <= 0  ):
		dajax.assign( '.schedule_label', 'innerHTML', "Schedules" )
		return	dajax.json()	
		
	scheduleBlock = "<div class=\"class_block_wrapper\"><div class=\"class_block\" style=\"height: %s; top: %s; width: %s;\">%s</div></div>"
	dajax.add_data( len(request.session['schedules']), "SetMaxSchedules")
	dajax.assign( '.schedule_label', 'innerHTML', "Schedules(%s/%s)"%( str(schedule_id+1),str(len(request.session['schedules']))))
	
	for instance in request.session['schedules'][schedule_id]:
		course = Course.objects.filter(id=CourseInstance.objects.filter(id=instance)[0].course_id)[0]
		sections = Section.objects.filter(course_instance_id=instance)
		for section in sections:
			block = SectionTime.objects.filter(section_id=section)[0]
			day = block.day
			startTime = block.start_time.zfill(4)
			endTime = block.end_time.zfill(4)
			start = int(startTime[0:2]) + ( int(startTime[2:4]) / 60 )
			end = int(endTime[0:2]) + ( int(endTime[2:4]) / 60 )
			length = end-start
			dajax.append( '.'+dayCode[day]+' .entries', 'innerHTML', scheduleBlock % ( str(length*height)+"px", str( (start-8)*height) + "px", str(width)+"px",course.subject_no ) )

	dajax.add_data( "", "SetScheduleEvents" )
	return dajax.json();
		