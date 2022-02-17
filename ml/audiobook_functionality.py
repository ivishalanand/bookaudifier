import os
import re
import pandas as pd
import pyttsx3
import requests
from bs4 import BeautifulSoup
from pdfminer import high_level
from requests.structures import CaseInsensitiveDict
import time
import unicodedata
import fitz
import readtime
from search.models import TOC
import urllib
from requests import get
from io import BytesIO
from PIL import Image


HOME_DIR = os.getcwd()


def remove_tags(text):
    TAG_RE = re.compile(r'<[^>]+>')
    return TAG_RE.sub('', text)


def resolve(url):
    return urllib.request.urlopen(url).geturl()


def get_info(rows, i):
    try:
        pdf_link = "https://www.pdfdrive.com" + rows[i].find(class_='file-left').find('a').get('href')
    except:
        pdf_link = ''
    try:
        img_link = rows[i].find(class_='file-left').find('img')['src'].replace('-s', "")
    except:
        img_link = "https://drive.google.com/file/d/1qcKLYPMh8RhA4_3ta1oiXLIOrYLlaBz5/view?usp=sharing"
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
    try:
        book_id = rows[i].find('a').get('data-id')
    except:
        book_id = ''

    return pdf_link, img_link, title, year, page_count, size, hits, book_id


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


def no_cover_available_update(row):
    img_link = row['img_link']
    image_raw = get(img_link)
    image = Image.open(BytesIO(image_raw.content))
    if image.width == 210:
        return "https://i.imgur.com/BxgcRaS.jpeg"
    return img_link


def get_results(rows):
    results = pd.DataFrame(columns=['title', 'pdf_link', 'img_link', 'year', 'page_count', 'size', 'hits', 'book_id'])

    for i in range(len(rows)):
        pdf_link, img_link, title, year, page_count, size, hits, book_id = get_info(rows, i)
        data = {'title': title,
                'pdf_link': pdf_link,
                'img_link': img_link,
                'year': year,
                'page_count': page_count,
                'size': size,
                'hits': hits,
                'book_id': book_id}
        results = results.append(data, ignore_index=True)
        # results['img_link'] = results.apply(lambda x: no_cover_available_update(x), axis=1)
    return results


def get_books(URL):
    headers = get_headers()
    resp = requests.get(URL, headers=headers)

    soup = BeautifulSoup(resp.text, "html.parser")
    rows = soup.findAll("div", {"class": "col-sm"})
    results = get_results(rows)
    return results


def fetch_books(query, homepage=False):
    if homepage:
        URL = "https://www.pdfdrive.com/category/112"
    else:
        query_modified = query.replace(" ", '+')
        URL = "https://www.pdfdrive.com/search?q=" + query_modified

    return get_books(URL)





def get_download_link(download_soup):
    download_base = 'https://www.pdfdrive.com/download.pdf?'
    security = download_soup.find("button", {"id": "previewButtonMain"})['data-preview'].replace("/ebook/preview?",
                                                                                                 "").replace("session",
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
    print("Time taken for generating audiobook: {}s".format(end - start))

    return


def get_text(PDF_file_name):
    directory = HOME_DIR + "/audiobook_assets/" + PDF_file_name
    start = time.time()
    content = high_level.extract_text(directory)
    end = time.time()

    postprocessed_text = " ".join(content.replace("\n", " ").replace("\t", " ").split())

    print("Time taken for generating text: {}s".format(end - start))
    with open(HOME_DIR + '/audiobook_assets/book_content.txt', 'w') as f:
        f.write(postprocessed_text)
    return postprocessed_text


def extract_toc(reader):
    def bookmark_dict(bookmark_list):
        result = {}
        for item in bookmark_list:
            if isinstance(item, list):  # recursive call
                result.update(bookmark_dict(item))
            else:
                try:
                    result[reader.getDestinationPageNumber(item) + 1] = item.title
                except:
                    pass
        return result

    return bookmark_dict(reader.getOutlines())


def get_text_between_pags(page_start, page_end, doc):
    text = ""
    for page in range(page_start, page_end):
        text = text + doc.load_page(page).get_text()
    cleaned_text = unicodedata.normalize("NFKD",text)
    return cleaned_text


def get_book_data(my_raw_data):
    # TODO: handle things like 5nbspnbspnbspnbspnbspnbspnbspnbspnbsp in elon musk
    doc = fitz.open(stream=my_raw_data, filetype="pdf")
    toc = doc.get_toc(False)
    for index in range(len(toc)):
        page_start = toc[index][3]['page']
        if index + 1 < len(toc):
            page_end = toc[index + 1][3]['page']
        else:
            page_end = doc.page_count
        toc[index].append(get_text_between_pags(page_start, page_end, doc))

    book_data = []
    text = ""
    total_reading_time = ""
    for info in toc:
        level = "  "*(info[0]-1)
        read_time_int = readtime.of_text(info[4]).minutes
        read_time_str = str(read_time_int) + " min"
        book_data.append(TOC(info[1], info[4], level, read_time_str))
        text = text + info[4]

    total_time_to_read = readtime.of_text(text).minutes
    if total_time_to_read > 60:
        total_reading_time = "{:.2f}".format(total_time_to_read/60) + " hour"
    else:
        total_reading_time = str(total_time_to_read) + " mins"
    # print("total readin time :", total_reading_time)
    return book_data, total_reading_time


def get_audiobook(pdf_link):
    pdf_link_resp = requests.get(pdf_link)
    download_soup = BeautifulSoup(pdf_link_resp.text, "html.parser")
    cover_pic_link = download_soup.find(class_='ebook-img')['src']
    book_title = download_soup.find(class_='ebook-title').text
    book_author = " ".join(download_soup.find(class_='ebook-author').text.replace("\n", "").split(" ")[1:])
    download_link = get_download_link(download_soup)
    response = requests.get(download_link)
    my_raw_data = response.content
    book_data, total_reading_time = get_book_data(my_raw_data)
    return book_data, total_reading_time, cover_pic_link, book_title, book_author
