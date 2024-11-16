import csv
import re

def clean_and_format_csv(input_path, output_path):
    # 半角英数字を全角英数字に変換するマッピングを作成
    hankaku_to_zenkaku = str.maketrans(
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        "０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
    )

    # ファイルを開いて、整形して新しいファイルに書き出す
    with open(input_path, 'r', encoding='utf-8') as infile:
        # ヘッダーを取得してインデックスを特定
        reader = csv.reader(infile)
        headers = next(reader)
        when_index = headers.index("when")  # whenカラムのインデックスを取得

        # 新しいCSVを書き出す
        with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.writer(outfile)
            writer.writerow(headers)  # ヘッダーを書き込み

            for row in reader:
                cleaned_row = []
                for i, cell in enumerate(row):
                    # 半角空白を削除
                    cleaned_cell = re.sub(r'\s+', '', cell.replace("　", "").strip())
                    
                    # whenカラムのみカンマを「・」に置き換える
                    if i == when_index:
                        cleaned_cell = cleaned_cell.replace(",", "・")
                    
                    # "~限"の部分の半角英数字を全角英数字に変換
                    cleaned_cell = re.sub(r'(\d+限)', lambda x: x.group(1).translate(hankaku_to_zenkaku), cleaned_cell)
                    cleaned_row.append(cleaned_cell)
                
                # 最後のカラムが空文字の場合、そのカラムを削除
                while cleaned_row and cleaned_row[-1] == '':
                    cleaned_row.pop()

                writer.writerow(cleaned_row)

    print(f"整形されたデータを {output_path} に保存しました。")

# 実行例
input_file = "data.csv"  # 入力ファイルパス
output_file = "after.csv"  # 出力ファイルパス
clean_and_format_csv(input_file, output_file)
