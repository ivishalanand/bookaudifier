from django.shortcuts import render

# Create your views here.
import json
import os
from ml.audiobook_functionality import fetch_books, get_audiobook


def search(request):
    if request.method == 'POST':
        search = request.POST['search']
        indx_pg = search.find("&page=")
        #TODO: search/page number should also work
        #TODO: Only show results whose TOC is present
        #TODO: if the search page gives 0 result, or have gone to lets say 100 pages then should show a awww snap screen
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


def index(request):
    search_query = "startups"
    df = fetch_books(search_query, homepage=True)
    json_records = df.reset_index().to_json(orient='records')
    data = json.loads(json_records)
    context = {'books_data': data,
               'query': search,
               'current_pg_no': 0,
               }
    return render(request, 'index.html', context)



def generate_audiobook(request):
    book_data, total_reading_time, cover_pic_link, book_title, book_author = get_audiobook(request.GET['book'])
    context = {'toc': book_data,
               'cover_pic_link': cover_pic_link,
               'total_reading_time': total_reading_time,
               'book_title': book_title,
               'book_author': book_author}
    return render(request, 'audiobook.html', context)