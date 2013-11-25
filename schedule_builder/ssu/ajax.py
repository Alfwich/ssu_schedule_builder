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
		out.append("<div><span>%s - %s</span><button onClick='add_course(%d)'>Add</button></div>" % (str(course), course.title, course.id))

	dajax.assign('#course_list', 'innerHTML', ''.join(out))

	return dajax.json()

@dajaxice_register
def add_course(request, course_id):
	dajax = Dajax()
	course = Course.objects.get(id=course_id)

	out = "<p>%s - % s</p>" % ( str(course), course.title )

	dajax.append('#added_courses', 'innerHTML', out)
	
	# Add the course to the session
	if 'courses' in request.session:
		request.session['courses'].append( course_id )
	else:
		request.session['courses'] = [ course_id ]
		
	return dajax.json()
	
@dajaxice_register
def get_course_data( request ):
	courses = Course.objects.all()
	return serializers.serialize("json", courses)

@dajaxice_register	
def make_schedules( request ):
	dajax = Dajax()
	request.session['courses'] = [ [100, 60, 110, 87], [ 1337, 1335 ] ]
	request.session['schedules'] = list( product( *request.session['courses'] ) )
	return dajax.json();
	
@dajaxice_register
def render_schedule( request, width, height, schedule_id ):
			
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
		course = Course.objects.filter(id=CourseInstance.objects.filter(id=instance)[0].course_id)
		sections = Section.objects.filter(course_instance_id=instance)
		for section in sections:
			block = SectionTime.objects.filter(section_id=section)
			day = block[0].day
			startTime = block[0].start_time.zfill(4)
			endTime = block[0].end_time.zfill(4)
			start = int(startTime[0:2]) + ( int(startTime[2:4]) / 60 )
			end = int(endTime[0:2]) + ( int(endTime[2:4]) / 60 )
			length = end-start
			dajax.append( '.'+dayCode[day]+' .entries', 'innerHTML', scheduleBlock % ( str(length*height)+"px", str( (start-8)*height) + "px", str(width)+"px",course[0].subject_no ) )

	dajax.add_data( "", "SetScheduleEvents" )
	return dajax.json();
		