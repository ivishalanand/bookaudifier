from pathlib import Path
from typing import Iterable, Any
from collections import Counter
import re
import pandas as pd
import pdfminer.layout
from pdfminer.high_level import extract_pages

dictionary = {}
# html_codes = [
#     ['&', '&amp;'],
#     ['<', '&lt;'],
#     ['>', '&gt;'],
#     ['"', '&quot;'],
# ]
# html_codes = ['&amp;', '&lt;', '&gt;', '&quot;']


def get_font_and_size(o):
    font = []
    size = []
    for i in o:
        if hasattr(i, 'fontname') and hasattr(i, 'size'):
            font.append(i.fontname)
            size.append(i.size)
    text_font = Counter(font).most_common(1)[0][0]
    text_size = Counter(size).most_common(1)[0][0]
    return text_font, text_size


def show_ltitem_hierarchy(o: Any, depth=0):
    """Show location and text of LTItem and all its descendants"""
    if depth == 0:
        print('element                        bounding_box    fontname         text')
        print('------------------------------ --------------- ---------------- ---------------')
    #
    # print(
    #     f'{get_indented_name(o, depth):<30.30s} '
    #     f'{get_optional_bbox(o)} '
    #     f'{get_optional_fontinfo(o):<20.20s} '
    #     f'{get_optional_text(o)}'
    # )
    # o.find_neighbors(pdfminer.layout.Plane(o.bbox), 1)
    max_depth = 1
    if (isinstance(o, Iterable)):
        if type(o) == pdfminer.layout.LTTextLineHorizontal: # manual change done
            text_font, text_size = get_font_and_size(o)
            dictionary[o.get_text().replace("\n","").replace(".", "")] = [o.bbox[0], o.bbox[1], o.bbox[2], o.bbox[3], o.height, o.width, text_font, text_size, (o.bbox[1]+o.bbox[3])/2]
            return
        for i in o:
            show_ltitem_hierarchy(i, depth=max(max_depth, depth + 1))


def get_indented_name(o: Any, depth: int) -> str:
    """Indented name of class"""
    return '  ' * depth + o.__class__.__name__


def get_optional_fontinfo(o: Any) -> str:
    """Font info of LTChar if available, otherwise empty string"""
    if hasattr(o, 'fontname') and hasattr(o, 'size'):
        return f'{o.fontname} {round(o.size)}pt'
    return ''


def get_optional_text(o: Any) -> str:
    """Text of LTItem if available, otherwise empty string"""
    if hasattr(o, 'get_text'):
        return o.get_text().strip()
    return ''

def get_optional_bbox(o: Any) -> str:
    """Bounding box of LTItem if available, otherwise empty string"""
    if hasattr(o, 'bbox'):
        return ''.join(f'{i:<4.0f}' for i in o.bbox)
    return ''


def pct_dgt(x):
    num_digits = len("".join(re.findall(r'\d+', x)))
    if num_digits >0 :
        return num_digits/len(x)
    return 0


def post_processing(matched_df):
    cleaned_index = [int("".join(re.findall(r'\d+', index))) for index in matched_df.index]
    matched_df.index = cleaned_index
    return matched_df.sort_index()


def extract_info(df):
    cleaned_df = df.loc[[index for index in df.index.values if (pct_dgt(index)>.3) | ((pct_dgt(index)==0) & (len(index)>=2)) ],:]
    page_number_cleaned_index = [ (i,v) for i, v in enumerate(cleaned_df.index.values) if pct_dgt(v) >.3 ]
    page_numbers_index = [i[1] for i in page_number_cleaned_index]
    page_num_df = pd.DataFrame(cleaned_df.loc[page_numbers_index,"mid_point_y"])
    non_page_number_index = [index for index in cleaned_df.index.values if index not in page_num_df.index]

    for column in non_page_number_index:
        page_num_df[column] = cleaned_df[cleaned_df.index == column]['mid_point_y'].values[0]

    # Finding closest page
    subtracted_df = abs(page_num_df.T - page_num_df.T.iloc[0, :])
    subtracted_df.iloc[1:,:].idxmin(axis=0, skipna=True)
    subtracted_df.iloc[1:, :].idxmin(axis=0, skipna=True)

    matched_df = subtracted_df.iloc[1:, :].idxmin(axis=0, skipna=True)
    extracted_toc = post_processing(matched_df)
    return extracted_toc


def logical_pdf_split(path):
    for page_layout in extract_pages("test.pdf"):
        for element in page_layout:
            if isinstance(element, pdfminer.layout.LTTextContainer):
                print(element.get_text())


if __name__ == '__main__':

    # path = Path('/Users/visanand2/Desktop/a.pdf').expanduser()
    # pages = extract_pages(path)
    # show_ltitem_hierarchy(pages)
    # # pd.set_option('display.max_columns', None)
    # df = pd.DataFrame.from_dict(dictionary, orient='index', columns=['x1', 'y1', 'x2', 'y2', 'height', 'width', 'font', 'size', 'mid_point_y'])
    # print(df)
    # extracted_toc = extract_info(df)
    # print(extracted_toc)

    logical_pdf_split("/Users/visanand2/Desktop/a.pdf")