import pandas as pd
import pulp
import json
from classnavi.utils.calc_similarity import calc_similarity
from classnavi.utils.getinfofrompdf import identify_completed_courses_pipeline
import re

def normalize_column(df, column):
    """各列を0から1の範囲に正規化するための関数"""
    min_val = df[column].min()
    max_val = df[column].max()
    if max_val - min_val == 0:
        return df[column]
    return (df[column] - min_val) / (max_val - min_val)

# 授業のスケジュールパース
def parse_times(schedule):
    """
    例えば
    "火曜２限・木曜２限"が与えられた場合，
    ["火曜２限", "木曜２限"]を返す関数
    """
    return re.findall(r'[月火水木金土日]曜\d限', schedule)

def optimize_classes(alpha_values, data_path='data.csv', quarter=1, L_early=0, min_units=1, max_units=float('inf'), keywords="", pdf_content=None, non_selectable_classes=[], must_select_classes=[]):
    
    # データ読み込み
    df = pd.read_csv(data_path)

    # 開講クオーターの制限
    df = df[df['semester']==quarter]

    # PDFファイルから習得済みの授業を抽出
    if pdf_content is not None:
        completed_courses = identify_completed_courses_pipeline(pdf_content, data_path)
    else:
        completed_courses = []
    
    # 'when'カラムから授業開始時間 (l_i) と曜日を抽出
    df['times'] = df['when'].apply(parse_times)
    df['l_i'] = df['times'].apply(lambda x: [int(re.search(r'\d+', time).group()) for time in x])
    df['days'] = df['times'].apply(lambda x: ''.join([time[0] for time in x]))
    # 早朝の授業インジケータ (q_i) 計算
    df['q_i'] = df['l_i'].apply(lambda x: 1 if any(time <= L_early for time in x) else 0)
    # 'remote' と 'test' 列を事前に 0 または 1 に変換
    df['remote'] = df['remote'].map({'yes': 1, 'no': 0}).astype(int)
    df['test'] = df['test'].map({'yes': 1, 'no': 0}).astype(int)

    # コサイン類似度を計算
    classkeywords_list = [[row['classname'], row['keyword']] for _, row in df.iterrows()]
    similarities = calc_similarity(keywords, classkeywords_list)

    # コサイン類似度を df に追加
    similarity_dict = {item[0]: item[2] for item in similarities}
    df['similarity'] = df['classname'].map(similarity_dict)

    # 各項目を正規化 (0-1にスケーリング)
    df['homework'] = normalize_column(df, 'homework')
    df['numofunits_normalized'] = normalize_column(df, 'numofunits')
    df['similarity'] = normalize_column(df, 'similarity')
    df['q_i'] = normalize_column(df, 'q_i')
    df['test'] = normalize_column(df, 'test')
    
    # MILP 問題を定義
    problem = pulp.LpProblem("Class_Selection", pulp.LpMaximize)
    
    # 変数の定義
    x_vars = {i: pulp.LpVariable(f'x_{i}', cat='Binary') for i in df.index}

    # non_selectable_classes と must_select_classes の制約を追加
    for i in df.index:
        # non_selectable_classes に含まれている授業は選択しないようにする
        if df.loc[i, 'classname'] in non_selectable_classes:
            problem += x_vars[i] == 0
        
        # must_select_classes に含まれている授業は必ず選択する
        if df.loc[i, 'classname'] in must_select_classes:
            problem += x_vars[i] == 1
    
    # 目的関数の設定: ここで x_vars を直接使用して授業日数を最適化
    problem += (
        -alpha_values[0] * pulp.lpSum(  # 授業日数が少ない方が良い
            pulp.lpSum(x_vars[i] for i in df[df['days'].str.contains(day)].index) >= 1
            for day in ['月', '火', '水', '木', '金']
        ) +
        -alpha_values[1] * pulp.lpSum(df.loc[i, 'homework'] * x_vars[i] for i in df.index) +  # 宿題が少ない方が良い
        -alpha_values[2] * pulp.lpSum(df.loc[i, 'numofunits_normalized'] * x_vars[i] for i in df.index) +  # 単位数が少ない方が良い
        -alpha_values[3] * pulp.lpSum(df.loc[i, 'remote'] * x_vars[i] for i in df.index) +  # リモート授業が多い方が良い
        alpha_values[4] * pulp.lpSum(df.loc[i, 'similarity'] * x_vars[i] for i in df.index) +  # 類似度が高い授業を選ぶ
        -alpha_values[5] * pulp.lpSum(df.loc[i, 'q_i'] * x_vars[i] for i in df.index) +  # 早朝授業が少ない方が良い
        -alpha_values[6] * pulp.lpSum(df.loc[i, 'test'] * x_vars[i] for i in df.index)    # テストが少ない方が良い
    )

    # 修得済み授業の制約を追加
    for i in df.index:
        if df.loc[i, 'classname'] in completed_courses:
            problem += x_vars[i] == 0
    
    # 制約条件: 授業時間の重複を避ける
    for i, row in df.iterrows():
        times = row['times']
        for time1 in times:
            for j, row2 in df.iterrows():
                if i >= j:
                    continue
                if any(time1 == time2 for time2 in row2['times']):
                    problem += x_vars[i] + x_vars[j] <= 1

    # **追加された制約条件: '必修'科目は必ず選択する**
    for i in df[df['unitclass'] == '必修'].index:
        problem += x_vars[i] == 1
    
    # 制約条件: 最低単位数と最大単位数の制約を追加
    total_units = pulp.lpSum(df.loc[i, 'numofunits'] * x_vars[i] for i in df.index)
    problem += total_units >= min_units, "MinimumUnits"
    problem += total_units <= max_units, "MaximumUnits"
    total_units_available = df['numofunits'].sum()
    print(f"Available total units: {total_units_available}")

    problem.writeLP("class_selection.lp")
    
    # 最適化
    status = problem.solve(pulp.PULP_CBC_CMD(msg=False))
    
    # 結果の取得
    result = df[df.index.isin([i for i in df.index if x_vars[i].value() == 1])].to_dict(orient='records')
    
    # 最適化問題のステータスを確認し、適切なメッセージを出力
    if pulp.LpStatus[status] == 'Infeasible':
        # infeasible の場合、必修科目のみ選択し、他の授業は選択可能なもののみを返す
        selected_classes = df[(df['unitclass'] == '必修') | (df.index.isin([i for i in df.index if x_vars[i].value() == 1]))]
        print("infeasible")
        return json.dumps({
            "message": "制約が厳しすぎます。",
            "selected_classes": selected_classes.to_dict(orient='records')
        }, ensure_ascii=False)
    elif pulp.LpStatus[status] == 'Optimal':
        selected_classes = df[df.index.isin([i for i in df.index if x_vars[i].value() == 1])]
    
        # times 列を見やすい形式に整形
        selected_classes['formatted_times'] = selected_classes['times'].apply(lambda times: ' & '.join(times))
        
        # 整形した times 列を使用して結果を出力
        result = selected_classes[['classname', 'formatted_times', 'unitclass', 'numofunits', "teacher", "test", "remote", "homework", "when", "semester", "l_i"]].to_dict(orient='records')
        return json.dumps(result, ensure_ascii=False)
    else:
        return f"最適化問題の解決に失敗しました。ステータス: {pulp.LpStatus[status]}"
