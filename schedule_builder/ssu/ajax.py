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
def get_session_courses(request):
    if not 'courses' in request.session:
            request.session['courses'] = []
            
    return json.dumps( request.session['courses'] )

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
    
    request.session.modified = True
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
    
    request.session.modified = True	
    return dajax.json()

@dajaxice_register
def remove_course(request, id):
    dajax = Dajax()
    
    if not 'courses' in request.session:
        request.session['courses'] = []
        return dajax.json()
        
    if not 'instances' in request.session:
        request.session['instances'] = []        
    
    try:
        # Remove all courses with the id
        request.session['courses'] = [x for x in request.session['courses'] if not int(x['id']) == int(id)]
                
        request.session['instances'] = []   
        
        # Recalc course instances *** Better way to do this? ***
        for c in request.session['courses']:
            result = []
            courseInstances = CourseInstance.objects.filter(course_id=c['id'])
            for instance in courseInstances:
                result.append( instance.id )
                
            request.session['instances'].append( result )            
            
        dajax.script('DeleteCallback();') 
           
    except IndexError:
        print 'sorry, no ' + str( course )   
        
    request.session.modified = True    
    return dajax.json()

@dajaxice_register
def add_course(request, course_id):
    dajax = Dajax()
    course = Course.objects.get(id=course_id)

    out = "%s - % s" % ( str(course), course.title )
    display = "<p course_id=\"%s\">%s</p>" % ( str(course.id), out )

    dajax.append('#added_courses', 'innerHTML', display)
	
    if not 'instances' in request.session:
        request.session['instances'] = []
		
    if not 'courses' in request.session:
        request.session['courses'] = []

    courseId = course.id
    request.session['courses'].append( { "id":courseId, "out":out } )
    
    courseInstances = CourseInstance.objects.filter(course_id=course_id)
    
    result = []
    for instance in courseInstances:
        result.append( instance.id )
		
    request.session['instances'].append( result )
    
    dajax.script("AddCourseCallback();");
		
    request.session.modified = True
    return dajax.json()

@dajaxice_register	
def make_schedules( request ):

    if not 'instances' in request.session:
        request.session['instances'] = []

    if not 'schedules' in request.session:
        request.session['schedules'] = []	

    request.session['schedules'] = list( product( *request.session['instances'] ) )
    request.session.modified = True
  
    return len( request.session['schedules'] )

@dajaxice_register
def get_schedules( request, start, end ):
    schedules = []
	# Make sure that there are schedules to process
    if not 'schedules' in request.session:
        request.session['schedules'] = []
        return
    
	# If end is 0 then return all of the schedules
    if( end == 0 ):
        end = len(request.session['schedules'])
        
    if( start < 0 ):
        start = 0
        
    if( end >= len(request.session['schedules']) ):
        end = len(request.session['schedules'])
    
	# If there are no schedules return an empty array
    if( len(request.session['schedules']) <= 0 ):
        return []
        
    # Convert each schedule into a json object
    for schedule in range( start, end ):
        courses = []
        for instance in request.session['schedules'][schedule]:
            times = []
            ci = CourseInstance.objects.filter(id=instance)
            course = ci[0].course
            times.append( ci[0].section_times() )
            
            # Add the course to the course array
            courses.append( { "title":course.title, "subject":course.subject_no, "times":times, "id":course.id } )
     
        schedules.append( courses )
    
    # Return the data to the client
    return json.dumps( schedules )
    
	
@dajaxice_register
def render_schedule( request, width, height, schedule_id ):

    if not 'instances' in request.session:
        request.session['instances'] = []

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

    scheduleBlock = "<div class=\"class_block_wrapper\"><div class=\"class_block\" style=\"height: %s; top: %s; width: %s;\">%s</div></div>"
    
    if( len(request.session['schedules']) <= 0):
        return dajax.json()

    if( schedule_id >= len(request.session['schedules']) ):
        schedule_id = 0;

    if( schedule_id <= 0 ):
        schedule_id = len(request.session['schedules'])-1;         

    for instance in request.session['schedules'][schedule_id]:
        course = Course.objects.filter(id=CourseInstance.objects.filter(id=instance)[0].course_id)[0]
        sections = Section.objects.filter(course_instance_id=instance)
        for section in sections:
            block = SectionTime.objects.filter(section_id=section)[0]
            day = block.day
            startTime = block.start_time.zfill(4)
            endTime = block.end_time.zfill(4)
            start = float(startTime[0:2]) + ( float(startTime[2:4]) / 60.0 )
            end = float(endTime[0:2]) + ( float(endTime[2:4]) / 60.0 )
            length = end-start
            dajax.append( '.'+dayCode[day]+' .entries', 'innerHTML', scheduleBlock % ( str(length*height)+"px", str( (start-8)*height) + "px", str(width)+"px",course.subject_no ) )

            
    dajax.add_data( "", "SetScheduleEvents" )
    request.session.modified = True    
    return dajax.json();
            