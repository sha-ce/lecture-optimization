import pandas as pd
import pulp
import json
import re
import matplotlib.pyplot as plt
import japanize_matplotlib
from utils.optimizer import optimize_classes



# 授業のスケジュールパース
def parse_times(schedule):
    """
    例えば
    "火曜２限・木曜２限"が与えられた場合，
    ["火曜２限", "木曜２限"]を返す関数
    """
    return re.findall(r'[月火水木金土日]曜\d限', schedule)

# 評価関数
def evaluate_optimization_result(opt_result, alpha_values, min_units, max_units):
    result_df = pd.DataFrame(json.loads(opt_result))

    # 'when'カラムから授業開始時間 (l_i) と曜日を抽出
    result_df['times'] = result_df['when'].apply(parse_times)
    result_df['l_i'] = result_df['times'].apply(lambda x: [int(re.search(r'\d+', time).group()) for time in x])
    result_df['days'] = result_df['times'].apply(lambda x: ''.join([time[0] for time in x]))
    # 授業日数を計算
    result_df['num_days'] = result_df['days'].apply(lambda x: len(x) //2) 


    # 授業ごとの評価スコアを計算
    individual_scores = []
    for _, row in result_df.iterrows():
        class_score = {
            "classname": row["classname"],
            "day_score": -alpha_values[0] * row["num_days"],
            "homework_score": -alpha_values[1] * row["homework"],
            "unit_score": -alpha_values[2] * row["numofunits_normalized"],
            "remote_score": -alpha_values[3] * row["remote"],
            "similarity_score": alpha_values[4] * row["similarity"],
            "early_class_score": -alpha_values[5] * row["q_i"],
            "test_score": -alpha_values[6] * row["test"],
        }
        # 授業ごとの合計スコア（'classname'を除く）
        class_score["total_class_score"] = sum(value for key, value in class_score.items() if key != "classname")
        individual_scores.append(class_score)

    # 単位数の制約評価
    total_units = int(result_df['numofunits'].sum())
    if total_units < min_units:
        unit_constraint = f"不足: {min_units - total_units}単位"
    elif total_units > max_units:
        unit_constraint = f"超過: {total_units - max_units}単位"
    else:
        unit_constraint = total_units

    # 結果の出力
    return {
        "individual_scores": individual_scores,
        "unit_constraint": unit_constraint
    }


# 時間割のプロット
def plot_timetable(class_data):
    days_of_week = ["月", "火", "水", "木", "金", "土", "日"]
    periods = [f"{i}限" for i in range(1, 8)]

    timetable_df = pd.DataFrame("", index=periods, columns=days_of_week)

    for entry in class_data:
        class_name = entry["classname"]
        formatted_times = entry["formatted_times"]
        
        times = re.findall(r'([月火水木金土日])曜([１-７1-7])限', formatted_times)
        times = [(day, str(int(period.translate(str.maketrans("１２３４５６７", "1234567"))))) for day, period in times]
        
        for day, period in times:
            timetable_df.at[f"{period}限", day] = class_name

    timetable_df = timetable_df.fillna("")

    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_axis_off()
    table = ax.table(cellText=timetable_df.values, colLabels=timetable_df.columns, rowLabels=timetable_df.index, cellLoc='center', loc='center')

    table.scale(1, 1.2)
    table.auto_set_font_size(False)
    table.set_fontsize(12)

    plt.title("時間割表", fontsize=16, pad=20)
    plt.show()

# main関数
def main():
    alpha_values = [1, 1, 1, 1, 1, 1, 1]
    data_path = 'datas/data.csv'
    L_early = 1  # 早朝授業の判定基準
    min_units = 4
    max_units = 10
    keywords = "自然言語"

    # 授業の最適化を実行
    opt_result = optimize_classes(alpha_values, data_path, L_early, min_units, max_units, keywords)
    print("最適化結果:", opt_result)

    # 最適化結果の評価
    evaluation = evaluate_optimization_result(opt_result, alpha_values, min_units, max_units)
    print("評価結果:", json.dumps(evaluation, ensure_ascii=False, indent=2))

    # 最適化結果を辞書形式に変換し、時間割をプロット
    result_data = json.loads(opt_result)
    plot_timetable(result_data)

if __name__ == "__main__":
    main()
