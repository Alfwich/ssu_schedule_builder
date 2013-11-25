from __future__ import unicode_literals
from django.db import models

class Course(models.Model):
    class Meta:
        db_table = 'course'

    id = models.IntegerField(primary_key=True)
    subject = models.CharField(max_length=6L)
    catalog_no = models.CharField(max_length=6L)
    subject_no = models.CharField(max_length=12L)
    title = models.CharField(max_length=50L)
    units = models.CharField(max_length=6L)
    ge_code = models.CharField(max_length=8L, blank=True)

    def __unicode__(self):
        return self.subject + " " + self.catalog_no

class CourseInstance(models.Model):
    class Meta:
        db_table = 'course_instance'

    id = models.IntegerField(primary_key=True)
    course = models.ForeignKey(Course)

    def section_times(self):
        times = []
        for section in self.section_set.all():
            for time in section.sectiontime_set.all():
                times.append( dict(start_time=time.start_time, end_time=time.end_time, day=time.day) )
        return times

    def __unicode__(self):
        return str(self.course)

class Department(models.Model):
    class Meta:
        db_table = 'department'

    id = models.IntegerField(primary_key=True)
    title = models.CharField(max_length=50L)

    def __unicode__(self):
        return self.title

class Major(models.Model):
    class Meta:
        db_table = 'major'

    id = models.IntegerField(primary_key=True)
    title = models.CharField(max_length=50L, unique=True)
    super_major = models.ForeignKey('Major', null=True, db_column='super_major', blank=True)

    def __unicode__(self):
        return self.title

class MajorDepartment(models.Model):
    class Meta:
        db_table = 'major_department'

    id = models.IntegerField(primary_key=True)
    major = models.ForeignKey(Major)
    department = models.ForeignKey(Department)

class MajorRequirement(models.Model):
    class Meta:
        db_table = 'major_requirement'

    id = models.IntegerField(primary_key=True)
    major = models.ForeignKey(Major)
    course = models.ForeignKey(Course)
    typ = models.CharField(max_length=10L)

class Professor(models.Model):
    id = models.CharField(max_length=9L, primary_key=True)
    fname = models.CharField(max_length=20L)
    lname = models.CharField(max_length=20L)
    class Meta:
        db_table = 'professor'

class Schedule(models.Model):
    id = models.IntegerField(primary_key=True)
    student = models.ForeignKey('Student')
    class Meta:
        db_table = 'schedule'

class ScheduleCourseInstance(models.Model):
    id = models.IntegerField(primary_key=True)
    schedule = models.ForeignKey(Schedule)
    course_instance = models.ForeignKey(CourseInstance)
    class Meta:
        db_table = 'schedule_course_instance'

class Section(models.Model):
    id = models.CharField(max_length=4L, primary_key=True)
    course_instance = models.ForeignKey(CourseInstance)
    section_no = models.IntegerField()
    component = models.CharField(max_length=4L, blank=True)
    class Meta:
        db_table = 'section'

class SectionProfessor(models.Model):
    id = models.IntegerField(primary_key=True)
    section = models.ForeignKey(Section)
    prof = models.ForeignKey(Professor)
    class Meta:
        db_table = 'section_professor'

class SectionTime(models.Model):
    id = models.IntegerField(primary_key=True)
    section = models.ForeignKey(Section)
    day = models.CharField(max_length=3L)
    start_time = models.CharField(max_length=4L)
    end_time = models.CharField(max_length=4L, blank=True)
    location = models.CharField(max_length=16L)
    class Meta:
        db_table = 'section_time'

class Student(models.Model):
    id = models.CharField(max_length=9L, primary_key=True)
    fname = models.CharField(max_length=20L)
    lname = models.CharField(max_length=20L)
    class Meta:
        db_table = 'student'

class StudentCourse(models.Model):
    id = models.IntegerField(primary_key=True)
    student = models.ForeignKey(Student)
    course = models.ForeignKey(Course)
    class Meta:
        db_table = 'student_course'

class StudentMajor(models.Model):
    id = models.IntegerField(primary_key=True)
    major = models.ForeignKey(Major)
    student = models.ForeignKey(Student)
    class Meta:
        db_table = 'student_major'

