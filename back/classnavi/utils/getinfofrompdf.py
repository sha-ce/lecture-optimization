from pypdf import PdfReader
import re

def extract_class_names(text):
    pattern = r'\d{4,5}\s([^\d\s]+)\s'
    # 正規表現で授業名をすべて抽出
    class_names = re.findall(pattern, text)
    
    return class_names

def pdf2txt(pdf_path, output_txt_path):
    # PDFファイルの読み込み
    reader = PdfReader(pdf_path)
    # ページの取得
    page = reader.pages[0]
    # テキストの抽出
    text = page.extract_text()

    extracted_class_names_list = extract_class_names(text)
    
    # テキストをファイルに出力
    with open(output_txt_path, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f"Text has been written to {extracted_class_names_list}")
    # ['評価に対する得点の範囲は次のとおりです。秀：', '経営戦略特論', '思考モデリング', '暗号理論', '時系列データ解析特論', '暗号数学特論', '最適化アルゴリズム論', '機械学習特論：理論とアルゴリズム', 'マルチメディア工学特論', '人間情報システム特論']
    return extracted_class_names_list