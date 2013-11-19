from django import forms

class CourseSearchForm(forms.Form):
    query = forms.CharField(max_length=30, label=u'Course Search')

