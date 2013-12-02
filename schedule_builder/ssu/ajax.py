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
    if not 'slots' in request.session:
        request.session['slots'] = []
        
    return json.dumps( request.session['slots'] )

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
        out.append("<div><span>%s - %s</span><input type='checkbox' name='courses' data='%s' value='%s'</div>" % ( str(course), course.title, course.subject_no, course.id ))

    dajax.assign('.ge_result.list', 'innerHTML', ''.join(out))

    dajax.script('ge_callback();')
    
    request.session.modified = True 
    return dajax.json()

@dajaxice_register
def remove_course(request, id):
    dajax = Dajax()
    
    if not 'slots' in request.session:
        request.session['slots'] = []
        return dajax.json()
        
    if not 'instances' in request.session:
        request.session['instances'] = []        
    
    try:
        # Remove all courses with the id
        del request.session['slots'][int(id)]
        del request.session['instances'][int(id)]

        dajax.script('DeleteCallback();') 
        dajax.script('ProcessSessionCourses(' + json.dumps(request.session['slots']) + ');')
           
    except IndexError:
        print 'sorry, no ' + str( course )   
        
    request.session.modified = True    
    return dajax.json()

@dajaxice_register
def add_course(request, course_id, slot_id):
    dajax = Dajax()
    courses = []
    out = ""

    if isinstance(course_id, int):
        course = Course.objects.get(id=course_id)
        courses.append(course)

        out += "%s - % s" % ( str(course), course.title )
        display = "<p slot_id=\"%s\">%s</p>" % ( slot_id, out )

        dajax.append('#added_courses', 'innerHTML', display)
    else:
        for one_course in course_id:
            course = Course.objects.get(id=one_course)
            out += "%s " % course.subject_no
            courses.append(course)
    
    if not 'instances' in request.session:
        request.session['instances'] = []
        
    if not 'slots' in request.session:
        request.session['slots'] = []

    request.session['slots'].append( out )
    
    result = []
    for cur_course in courses:
        for instance in cur_course.courseinstance_set.all():
            result.append( instance.id )

    request.session['instances'].append( result )
    
    dajax.script("AddCourseCallback();");
        
    request.session.modified = True
    return dajax.json()
    
# Will take in a set of restrictions and filter the current schedule set
# returns the new length of the schedules array after reductions
@dajaxice_register  
def filter_schedules( request, filter ):
    
    # If there are no schedules then there is nothing to do
    if not 'schedules' in request.session:
        return
    
    # Filter course instances from the result
    if 'not_instance' in filter and len(filter['not_instance']) > 0:
        if not 'not_instance' in request.session:
            request.session['not_instance'] = []
        
        # Only execute if there is a difference
        if request.session['not_instance'] != filter['not_instance']:
            emptySet = set()
            notSet = set(filter['not_instance'])
            # This will return the set of schedules that do not contain any of the filtered sections
            request.session['schedules'] = [x for x in request.session['schedules'] if notSet&set(x)==emptySet]
            request.session['not_instance'] = filter['not_instance']
        
    # Filter course instances from the result
    if 'instance' in filter and len(filter['instance']) > 0:
    
        if not 'instance' in request.session:
            request.session['instance'] = []
            
        # Only execute if there is a difference    
        if request.session['instance'] != filter['instance']:    
            emptySet = set()
            notSet = set(filter['instance'])
            # This will return the set of schedules that do not contain any of the filtered sections
            request.session['schedules'] = [x for x in request.session['schedules'] if notSet&set(x)!=emptySet]
            request.session['instance'] = filter['instance']            
        
    # Filter course instances from the result
    if 'not_course' in filter and len(filter['not_course']) > 0:
    
        if not 'not_course' in request.session:
            request.session['not_course'] = []
            
       # Only execute if there is a difference    
        if request.session['not_course'] != filter['not_course']:              
    
            delete_schedules = []
            for i, schedule in enumerate(request.session['schedules']):
            
                # Get the courses in the schedule
                course_ids = []
                for instance_id in schedule:
                    ci = CourseInstance.objects.filter(id=instance_id)
                    course_ids.append( ci[0].course.id )
                
                # If the resulting set of course ids does not include all of the ids in the filter remove it
                if set(filter['not_course'])&set(course_ids)!=set():
                    delete_schedules.append( i )
            
            # Remove schedules flagged for deletion
            request.session['schedules'] = [ v for i,v in enumerate(request.session['schedules']) if i not in delete_schedules ]
            request.session['not_course'] = filter['not_course']  
        
    # Filter course instances from the result
    if 'course' in filter and len(filter['course']) > 0:
    
        if not 'course' in request.session:
            request.session['course'] = []
            
       # Only execute if there is a difference    
        if request.session['course'] != filter['course']:    
            
            delete_schedules = []
            for i, schedule in enumerate(request.session['schedules']):
            
                # Get the courses in the schedule
                course_ids = []
                for instance_id in schedule:
                    ci = CourseInstance.objects.filter(id=instance_id)
                    course_ids.append( ci[0].course.id )
                
                # If the resulting set of course ids does not include all of the ids in the filter remove it
                if set(filter['course'])&set(course_ids)==set():
                    delete_schedules.append( i )
            
            # Remove schedules flagged for deletion
            request.session['schedules'] = [ v for i,v in enumerate(request.session['schedules']) if i not in delete_schedules ]        
            request.session['course'] = filter['course']  
            
    
    # Filter based on starting time and ending time
    if 'start' in filter or 'end' in filter:
        if not 'start' in filter:
            filter['start'] = "0000"
            
        if not 'end' in filter:
            filter['end'] = "2400"
            
        if not 'start' in request.session:
            request.session['start'] = "0000"
            
        if not 'end' in request.session:
            request.session['end'] = "2400"            
                                
        # make sure that the start and end time are in the correct format
        filter['start'] = str(filter['start']).zfill(4)
        filter['end'] = str(filter['end']).zfill(4)
        
        if request.session['start'] != filter['start'] or request.session['end'] != filter['end']:
                
            delete_schedules = []
            for i, schedule in enumerate(request.session['schedules']):
            
                remove = False
                
                # Check each instance if there is a conflicting time
                for instance in schedule:
                    ci = CourseInstance.objects.filter(id=instance)
                    times = ci[0].section_times()
                    for t in times:
                        if t['start'] < filter['start'] or t['end'] > filter['end']:
                            remove = True
                            break
                    
                    if remove:
                        break
                
                # Add the schedule to be removed if true
                if remove:
                    delete_schedules.append(i)
            
            # Remove the elements that match
            request.session['schedules'] = [ v for i,v in enumerate(request.session['schedules']) if i not in delete_schedules ]
            request.session['start'] = filter['start']
            request.session['end'] = filter['end']
            
    request.session.modified = True
    return len( request.session['schedules'] )        
        

@dajaxice_register  
def make_schedules( request ):

    if not 'instances' in request.session:
        request.session['instances'] = []

    if not 'schedules' in request.session:
        request.session['schedules'] = []   

    schedules = list( product( *request.session['instances'] ) )

    request.session['schedules'] =  [x for x in schedules if valid_schedule(x)]

    request.session.modified = True
    return len( request.session['schedules'] )

def valid_schedule( schedule ):

    day_code = { 
            "M":0,
            "T":1,
            "W":2,
            "TH":3,
            "F":4,
            "S":5,
            }

    instances = [CourseInstance.objects.get(id=x) for x in schedule]
    time_slots = [0] * 2016

    for instance in instances:
        for time in instance.section_times():
            if time['start']:
                start = day_code[time['day']] * 288 + int(time['start'][:2]) * 12 + int(time['start'][2:]) / 5
                end = day_code[time['day']] * 288 + int(time['end'][:2]) * 12 + int(time['end'][2:]) / 5

                print range(start,end)
                for i in range(start, end):
                    if time_slots[i] == 1:
                        return False
                    else:
                        time_slots[i] = 1
    return True


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
            courses.append( { "title":course.title, "instance_id":ci[0].id, "subject":course.subject_no, "times":times, "id":course.id } )
     
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
        schedule_id = len(request.session['schedules'])-1

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
    return dajax.json()
            
