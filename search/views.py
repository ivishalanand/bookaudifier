from django.shortcuts import render

# Create your views here.
import json
import os
from ml.audiobook_functionality import fetch_books, get_book_pdf


def index(request):
    return render(request, 'index.html')

def search(request):
    if request.method == 'POST':
        search = request.POST['search']
        df = fetch_books(search)
        json_records = df.reset_index().to_json(orient='records')
        data = json.loads(json_records)
        context = {'books_data': data}
        return render(request, 'search.html', context)
    else:
        return render(request, 'search.html')


def generate_audiobook(request):
    get_book_pdf(request.GET['book'])
    return render(request, 'audiobookplayer.html')