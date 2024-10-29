from pypdf import PdfReader
import re
import csv

def extract_course_names(text):
    print(text)
    pattern = r'\d{4,5}[^\d]*?([^\d\s]+(?:\s[^\d\s]+)*)'

    # 正規表現で授業名をすべて抽出
    course_names = re.findall(pattern, text)
    
    return course_names

def pdf_to_text(pdf_path, output_txt_path=None):
    # PDFファイルの読み込み
    reader = PdfReader(pdf_path)
    # ページの取得
    page = reader.pages[0]
    # テキストの抽出
    text = page.extract_text()

    extracted_course_names_list = extract_course_names(text)
    
    if output_txt_path is not None:
        # テキストをファイルに出力
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            f.write(text)
    
    print(f"extracted_course_names_list: {extracted_course_names_list}")
    
    # ['評価に対する得点の範囲は次のとおりです。秀：', '経営戦略特論', '思考モデリング', '暗号理論', '時系列データ解析特論', '暗号数学特論', '最適化アルゴリズム論', '機械学習特論：理論とアルゴリズム', 'マルチメディア工学特論', '人間情報システム特論']
    return extracted_course_names_list

def detect_completed_courses(user_course_names, extracted_course_names_list):
    """
    すでに習得済みの授業を検出する関数
    param:
        user_course_names: list
            ユーザが習得済みの授業名のリスト
        extracted_course_names_list: list
            PDFファイルから抽出した授業名のリスト

    return:
        matched_courses: list
            ユーザが習得済みの授業名のリスト

    """

    matched_courses = []
    
    for extracted_course in extracted_course_names_list:
        for user_course in user_course_names:
            if extracted_course in user_course:
                matched_courses.append(user_course)
                break

    print(f"matched_courses: {matched_courses}")
                
    return matched_courses

def identify_completed_courses_pipeline(pdf_path, csv_file):
    """
    PDFファイルとCSVファイルから授業名を抽出し、習得済みの授業を検出するパイプライン関数
    param:
        pdf_path: str
            PDFファイルのパス
        csv_file: str
            CSVファイルのパス
    return:
        matched_courses: list
            抽出された授業名リストの中で習得済みのものに該当する授業名のリスト
    """
    # CSVファイルからcourse_nameを抽出
    user_course_names = []
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            user_course_names.append(row['classname'])
    
    # PDFファイルから授業名を抽出
    extracted_course_names_list = pdf_to_text(pdf_path)
    
    # 授業の一致を検出
    matched_courses = detect_completed_courses(user_course_names, extracted_course_names_list)
    
    return matched_courses

if __name__ == "__main__":
    pdf_path = r"/Users/furuyatatsuma/Downloads/seisekiTsuuchiPrint (1).PDF"
    csv_file = "/Users/furuyatatsuma/Desktop/lecture-optimization/back/classnavi/data_old/data_old.csv"
    matched_courses = identify_completed_courses_pipeline(pdf_path, csv_file)

    print(matched_courses)