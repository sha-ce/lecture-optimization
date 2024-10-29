import json
import pandas as pd
import matplotlib.pyplot as plt
import japanize_matplotlib

def plot_timetable(class_data):
    # 曜日と限目を定義
    days_of_week = ["月", "火", "水", "木", "金", "土", "日"]
    periods = [f"{i}限" for i in range(1, 8)]  # 1限～7限まで

    # 空のデータフレームを作成 (曜日 × 限目)
    timetable_df = pd.DataFrame("", index=periods, columns=days_of_week)

    # 授業データを使って時間割を埋める
    for entry in class_data:
        class_name = entry["classname"]
        days = entry["days"]
        period = entry["l_i"]

        # 曜日をループして時間割に授業を配置
        for day in days:
            if day in days_of_week:
                timetable_df.at[f"{period}限", day] = class_name

    # 時間割表を描画
    fig, ax = plt.subplots(figsize=(10, 5))  # 図のサイズを設定

    # テーブルデータを表示
    ax.set_axis_off()
    table = ax.table(cellText=timetable_df.values, colLabels=timetable_df.columns, rowLabels=timetable_df.index, cellLoc='center', loc='center')

    # テーブルのスタイルを調整
    table.scale(1, 1.5)  # セルのサイズ調整
    table.auto_set_font_size(False)
    table.set_fontsize(12)  # フォントサイズ調整

    # テーブルを描画
    plt.title("時間割表", fontsize=16, pad=20)
    plt.show()

if __name__ == "__main__":
    from utils.optimizer import optimize_classes
    from utils.user_interaction import get_user_input
    
    # ユーザーからの入力取得
    alpha_values, L_early, min_units, max_units, user_prefer = get_user_input()
    
    # 授業選択の最適化
    result = optimize_classes(alpha_values, 'datas/data_old.csv', L_early, min_units, max_units, user_prefer, "/Users/furuyatatsuma/Downloads/seisekiTsuuchiPrint (1).PDF")
    print(result)
    
    # JSON形式の文字列を辞書形式に変換
    try:
        result_data = json.loads(result)
        print(result_data)
        # 時間割を表示
        plot_timetable(result_data)
    except json.JSONDecodeError as e:
        print("JSONDecodeError:", str(e))
        print("Returned data:", result)