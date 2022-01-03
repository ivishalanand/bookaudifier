import PyPDF2
import numpy as np
import re
from collections import Counter


from PyPDF2 import PdfFileReader
import PyPDF2 as pyPdf

def _setup_page_id_to_num(pdf, pages=None, _result=None, _num_pages=None):
    if _result is None:
        _result = {}
    if pages is None:
        _num_pages = []
        pages = pdf.trailer["/Root"].getObject()["/Pages"].getObject()
    t = pages["/Type"]
    if t == "/Pages":
        for page in pages["/Kids"]:
            _result[page.idnum] = len(_num_pages)
            _setup_page_id_to_num(pdf, page.getObject(), _result, _num_pages)
    elif t == "/Page":
        _num_pages.append(1)
    return _result
def outlines_pg_zoom_info(outlines, pg_id_num_map, result=None):
    if result is None:
        result = dict()
    if type(outlines) == list:
        for outline in outlines:
            result = outlines_pg_zoom_info(outline, pg_id_num_map, result)
    elif type(outlines) == pyPdf.pdf.Destination:
        title = outlines['/Title']
        result[title.split()[0]] = dict(title=outlines['/Title'], top=outlines['/Top'], \
        left=outlines['/Left'], page=(pg_id_num_map[outlines.page.idnum]+1))
    return result

# main

def m():
    pdf_name = 'sapiens.pdf'
    f = open(pdf_name,'rb')
    pdf = PdfFileReader(f)
    # map page ids to page numbers
    pg_id_num_map = _setup_page_id_to_num(pdf)
    outlines = pdf.getOutlines()
    bookmarks_info = outlines_pg_zoom_info(outlines, pg_id_num_map)
    bookmarks_info



if __name__ == '__main__':
    from pdfminer.high_level import extract_pages
    from pdfminer.layout import LTTextContainer, LTChar, LTLine, LAParams
    import os

    path = r'/Users/visanand2/Desktop/b.pdf'

    data = []

    page_number = 0
    for page_layout in extract_pages(path):
        # print("Page Number {}".format(page_number))


        extract_data = []
        for element in page_layout:
            if isinstance(element, LTTextContainer):
                for text_line in element:
                    for character in text_line:
                        if isinstance(character, LTChar):
                            font_size = character.size
                extract_data.append([round(font_size, 1), (element.get_text())])

        if len(extract_data) <= 0:
            continue
        fonts_size = [values[0] for values in extract_data]

        data = Counter(fonts_size)
        mode_font_size = data.most_common(1)[0][0]  #

        unique_font_size = list(np.unique(fonts_size))
        dikt = {}
        for size in unique_font_size:
            dikt[size] = ""

        for size in extract_data:
            dikt[size[0]] = dikt[size[0]] + size[1]

        def get_heading(unique_font_size):
            max_font_size = np.max(unique_font_size)
            max_font_text = dikt[max_font_size]
            num_digits = len("".join(re.findall(r'\d+', max_font_text)))
            num_char = len(max_font_text)

            if (num_digits / len(max_font_text) < .3) & (num_char < 111):
                return max_font_size
            else:
                unique_font_size.remove(max_font_size)
                if len(unique_font_size) > 0:
                    return get_heading(unique_font_size)
                else:
                    return 0


        probable_heading_font_size = get_heading(list(unique_font_size))
        if probable_heading_font_size > mode_font_size:
            heading_title = dikt[probable_heading_font_size]
            refined_heading = heading_title.replace("\t", " ").replace("\n", " ")
            print("Heading on page number {} is {}".format(page_layout.pageid, refined_heading))
