import os
import re
import urllib

import pandas as pd
import pyttsx3
import requests
from bs4 import BeautifulSoup
from pdfminer import high_level
from requests.structures import CaseInsensitiveDict
import time

HOME_DIR = os.getcwd()


def remove_tags(text):
    TAG_RE = re.compile(r'<[^>]+>')
    return TAG_RE.sub('', text)


def get_info(rows, i):
    try:
        pdf_link = "https://www.pdfdrive.com" + rows[i].find(class_='file-left').find('a').get('href')
    except:
        pdf_link = ''
    try:
        img_link = rows[i].find(class_='file-left').find('img')['src'].replace('-s', "")
    except:
        img_link = HOME_DIR + "/default_cover.jpeg"
    try:
        title = remove_tags(str(rows[i].find(class_='file-right').find('h2')))
    except:
        title = ''
    try:
        year = rows[i].find(class_='file-info').find(class_='fi-year').text
    except:
        year = ''
    try:
        page_count = rows[i].find(class_='file-info').find(class_='fi-pagecount').text
    except:
        page_count = ''
    try:
        size = rows[i].find(class_='file-info').find(class_='fi-size').text
    except:
        size = ''
    try:
        hits = rows[i].find(class_='file-info').find(class_='fi-hit').text
    except:
        hits = ''

    return pdf_link, img_link, title, year, page_count, size, hits


def get_headers():
    headers = CaseInsensitiveDict()
    headers["authority"] = "www.pdfdrive.com"
    headers["upgrade-insecure-requests"] = "1"
    headers[
        "user-agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36"
    headers[
        "accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
    headers["sec-gpc"] = "1"
    headers["sec-fetch-site"] = "cross-site"
    headers["sec-fetch-mode"] = "navigate"
    headers["sec-fetch-user"] = "?1"
    headers["sec-fetch-dest"] = "document"
    headers["referer"] = "https://www.google.com/"
    headers["accept-language"] = "en-GB,en-US;q=0.9,en;q=0.8"
    headers[
        "cookie"] = "pd_session=vum1hbo7t3j1nlvij9fhqokuv4e104jp; pdfdriveAlerts=1; pubyear=true; welcomed=true; redirected=1"
    return headers


def get_results(rows):
    results = pd.DataFrame(columns=['title', 'pdf_link', 'img_link', 'year', 'page_count', 'size', 'hits'])

    for i in range(len(rows)):
        pdf_link, img_link, title, year, page_count, size, hits = get_info(rows, i)
        data = {'title': title,
                'pdf_link': pdf_link,
                'img_link': img_link,
                'year': year,
                'page_count': page_count,
                'size': size,
                'hits': hits}
        results = results.append(data, ignore_index=True)
    return results


def fetch_books(query):
    query_modified = query.replace(" ", '+')
    URL = "https://www.pdfdrive.com/search?q=" + query_modified

    headers = get_headers()
    resp = requests.get(URL, headers=headers)

    soup = BeautifulSoup(resp.text, "html.parser")
    rows = soup.findAll("div", {"class": "col-sm"})
    results = get_results(rows)
    # results.set_index('title', inplace=True)
    # results = results.T
    return results  # .to_dict()


def get_download_link(download_soup):
    download_base = 'https://www.pdfdrive.com/download.pdf?'
    security = download_soup.find("button", {"id": "previewButtonMain"})['data-preview'].replace("/ebook/preview?",
                                                                                                 "").replace(
        "session",
        'h')
    tail = '&u=cache&ext=pdf'

    download_link = download_base + security + tail

    return download_link


def save_book(book_save_path, response):
    with open(book_save_path, 'wb') as f:
        f.write(response.content)


def create_audiobook(content):
    '''
    Some good ui
    https://github.com/JacintoDesign/music-player
    https://github.com/shadman346/music-player
    https://github.com/sayantanm19/js-music-player
    https://arimariojesus.github.io/myMusicPlayer/
    '''
    engine = pyttsx3.init()
    start = time.time()
    # engine.say(content)
    engine.save_to_file(content, HOME_DIR + '/static/audiobook.mp3')
    engine.runAndWait()
    end = time.time()
    print("Time taken for generating audiobook: {}s".format(end-start))

    return


def get_text(PDF_file_name):
    directory = HOME_DIR + "/audiobook_assets/" + PDF_file_name
    start = time.time()
    content = high_level.extract_text(directory)
    end = time.time()
    print("Time taken for generating text: {}s".format(end-start))
    with open(HOME_DIR + '/audiobook_assets/book_content.txt', 'w') as f:
        f.write(content)
    return content


def delete_unnecessary_files():
    try:
        os.remove(HOME_DIR + "/audiobook_assets/book.pdf")
        os.remove(HOME_DIR + "/static/audiobook.mp3")
        os.remove(HOME_DIR + "/static/cover.jpeg")
        os.remove(HOME_DIR + "/audiobook_assets/book_content.txt")
    except:
        pass



def get_audiobook(pdf_link):
    delete_unnecessary_files()
    pdf_link_resp = requests.get(pdf_link)
    download_soup = BeautifulSoup(pdf_link_resp.text, "html.parser")
    cover_pic_link = download_soup.find(class_='ebook-img')['src']
    urllib.request.urlretrieve(cover_pic_link,
                               HOME_DIR + "/static/cover.jpeg")

    download_link = get_download_link(download_soup)
    response = requests.get(download_link)
    print("Downloading Book")
    save_book(HOME_DIR + "/audiobook_assets/book.pdf", response)
    print("Extracting text")
    content = get_text("book.pdf")
    # print("Converting to audiobook")
    # create_audiobook(content)
    return content