from django.shortcuts import render

def index(request):
    hello_message = "Hello, world"
    context = { 'hello_message' : hello_message }
    return render(request, 'ssu/index.html', context)

