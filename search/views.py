from django.shortcuts import render

# Create your views here.
import json
import os
from ml.audiobook_functionality import fetch_books, get_audiobook


def index(request):
    contexts = {"books":[
        {
            "imgSrc": "https://cdn.asaha.com/assets/thumbs/6cd/6cd0c558c84a90110d7c1952faef0cbd.jpg"
        },
        {
            "imgSrc": "https://cdn.asaha.com/assets/thumbs/a7e/a7e255138629db35a9fdd695a3499e1d.jpg"
        },
        {
            "imgSrc": "https://cdn.asaha.com/assets/thumbs/29c/29c31e04c5e8eb202e16918b95c55351.jpg"
        },
        {
            "imgSrc": "https://cdn.asaha.com/assets/thumbs/184/1845a35eac780023f93566137a8e13b1.jpg"
        },
        {
            "imgSrc": "https://cdn.asaha.com/assets/thumbs/01e/01edcb5eb7c85dc97af100103e9924f8.jpg"
        },
        {
            "imgSrc": "https://cdn.asaha.com/assets/thumbs/ebf/ebf3e031b6c101bd02b4fcf9dbc34127.jpg"
        },
        {
            "imgSrc": "https://cdn.asaha.com/assets/thumbs/6a5/6a59305fb1a546424177bd188dfc6b02.jpg"
        }
    ]}

    return render(request, 'index.html',contexts)


def search(request):
    if request.method == 'POST':
        search = request.POST['search']
        indx_pg = search.find("&page=")
        # TODO: search/page number should also work
        # TODO: Only show results whose TOC is present
        # TODO: if the search page gives 0 result, or have gone to lets say 100 pages then should show a awww snap screen
        if indx_pg >= 0:
            current_pg_no = int(search[6 + indx_pg:])
            search_query = search
            search = search[:indx_pg]
        else:
            search_query = search
            current_pg_no = 1

        df = fetch_books(search_query)
        json_records = df.reset_index().to_json(orient='records')
        data = json.loads(json_records)
        context = {'books_data': data,
                   'query': search,
                   'current_pg_no': current_pg_no,
                   }
        return render(request, 'search.html', context)
    else:
        return render(request, 'search.html')


def generate_audiobook(request):
    book_data, total_reading_time, cover_pic_link, book_title, book_author = get_audiobook(
        request.GET['book'])
    context = {'toc': book_data,
               'cover_pic_link': cover_pic_link,
               'total_reading_time': total_reading_time,
               'book_title': book_title,
               'book_author': book_author}
    return render(request, 'audiobook.html', context)
