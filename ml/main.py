import re
import os

import PyPDF2
import pandas as pd
import requests
from bs4 import BeautifulSoup
from requests.structures import CaseInsensitiveDict

from audiobook_functionality import get_text


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
        img_link = ''
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


def get_download_link(download_soup):
    download_base = 'https://www.pdfdrive.com/download.pdf?'
    security = download_soup.find("button", {"id": "previewButtonMain"})['data-preview'].replace("/ebook/preview?",
                                                                                                 "").replace(
        "session",
        'h')
    tail = '&u=cache&ext=pdf'

    download_link = download_base + security + tail

    return download_link


def save_book(chosen_book_title, response):
    with open(chosen_book_title + '.pdf', 'wb') as f:
        f.write(response.content)


def code(query):
    query_modified = query.replace(" ", '+')
    URL = "https://www.pdfdrive.com/search?q=" + query_modified

    headers = get_headers()
    resp = requests.get(URL, headers=headers)

    soup = BeautifulSoup(resp.text, "html.parser")
    rows = soup.findAll("div", {"class": "col-sm"})
    results = get_results(rows)


    print(results)

    book_number = input("Which book do you want to read?: ")
    chosen_book_link = results["pdf_link"].iloc[int(book_number)]
    chosen_book_title = results['title'].iloc[int(book_number)]
    print("You have chose to read: {}".format(chosen_book_title))

    pdf_link_resp = requests.get(chosen_book_link)
    download_soup = BeautifulSoup(pdf_link_resp.text, "html.parser")
    download_link = get_download_link(download_soup)
    response = requests.get(download_link)
    save_book(chosen_book_title, response)

    get_text(chosen_book_title + '.pdf')

def remove_existing_pdf_files():
    files = [f.path for f in os.scandir("/Users/visanand2/Desktop/")]
    pdf_files = [file for file in files if ".pdf" in file]
    for pdf in pdf_files:
        os.remove(pdf)

    files = [f.path for f in os.scandir("/images")]
    img_files = [file for file in files if ".jpg" in file]
    for img in img_files:
        os.remove(img)

    try:
        os.remove("/out_text.txt")
        os.remove("/Users/visanand2/Desktop/bookaudifier/audiobook_assets.mp3")
    except:
        pass


if __name__ == "__main__":
    remove_existing_pdf_files()
    query = input("Search for any book: ")
    # code()
    code(query)
