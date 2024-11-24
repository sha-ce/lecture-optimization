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
    "火曜２限・木曜２限"が与えられた場合，
    ["火曜２限", "木曜２限"]を返す関数
    """
    if "集中講義" in schedule:
        return ["集中講義"]
    return re.findall(r'[月火水木金土日]曜\d限', schedule)

def optimize_classes(alpha_values, data_path='data.csv', quarter=1, L_early=0, min_units=1, max_units=float('inf'), keywords="", pdf_content=None, non_selectable_classes=[], must_select_classes=[], special="", social=""):
    # データ読み込み
    df = pd.read_csv(data_path)

    special_dict = {"メディア情報学コース": "メディア情報学", "データ科学コース": "データ科学", "人工知能コース": "人工知能", "": "人工知能"}
    social_dict = {"AI応用コース": "AI応用", "金融流通コース": "金融・流通", "ソフトウェア開発プロセスコース": "ソフトウェア開発プロセス", "画像認識コース": "画像認識", "アントレプレナーシップコース": "アントレプレナーシップ", "": "アントレプレナーシップ"}
    matching_data = df[df['semester'] == f"第{quarter}クォーター"]

    # 開講クオーターの制限
    df = df[((df['semester'] == "前期") & (quarter in [1, 2])) |
        ((df['semester'] == "後期") & (quarter in [3, 4])) |
        (df['semester'] == f"第{quarter}クォーター")]
    target_classname = "最適化アルゴリズム論"
    target_data = df[df["classname"] == target_classname]

    df = df[
        ((df["course"] == special_dict[special]) |
        (df["course"] == social_dict[social]) |
        (df["course"] == "基礎科目") |
        (df["course"] == "GEプログラム") |
        (df["class"] == special_dict[special]) |
        (df["class"] == social_dict[social]) |
        (df["class"] == "基礎科目") |
        (df["class"] == "GEプログラム"))
    ]

    # PDFファイルから習得済みの授業を抽出
    if pdf_content is not None:
        completed_courses = identify_completed_courses_pipeline(pdf_content, data_path)
    else:
        completed_courses = []

    # 'when'カラムから授業開始時間 (l_i) と曜日を抽出
    df['times'] = df['when'].apply(parse_times)
    df['is_concentrated'] = df['times'].apply(lambda x: "集中講義" in x)

    df['l_i'] = df['times'].apply(lambda x: [int(re.search(r'\d+', time).group()) for time in x if time != "集中講義"])
    df['days'] = df['times'].apply(lambda x: ''.join([time[0] for time in x]))
    # 早朝の授業インジケータ (q_i) 計算
    df['q_i'] = df['l_i'].apply(lambda x: 1 if any(time <= L_early for time in x) else 0)
    # 'remote' と 'test' 列を事前に 0 または 1 に変換
    df['remote'] = df['remote'].map({'yes': 1, 'no': 0}).astype(int)
    df['test'] = df['test'].map({'yes': 1, 'no': 0}).astype(int)

    # 集中講義でない行をフィルタリング
    non_concentrated_df = df[~df['is_concentrated']].copy()

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

    # 最適化のための MILP 問題を定義
    problem = pulp.LpProblem("Class_Selection", pulp.LpMaximize)

    # 各クラスの変数定義
    x_vars = {i: pulp.LpVariable(f'x_{i}', cat='Binary') for i in df.index}

    # non_selectable_classes と must_select_classes の制約を追加
    for i in df.index:
        # non_selectable_classes に含まれている授業は選択しないようにする
        if df.loc[i, 'classname'] in non_selectable_classes:
            problem += x_vars[i] == 0
        
        # must_select_classes に含まれている授業は必ず選択する
        if df.loc[i, 'classname'] in must_select_classes:
            problem += x_vars[i] == 1

    # 単位数の合計が最低単位数を満たす制約を追加
    problem += pulp.lpSum(df.loc[i, 'numofunits'] * x_vars[i] for i in df.index) >= min_units, "Minimum_Units_Constraint"
    problem += pulp.lpSum(df.loc[i, 'numofunits'] * x_vars[i] for i in df.index) <= max_units, "Maximum_Units_Constraint"
    # 目的関数の設定: ここで x_vars を直接使用して授業日数を最適化
    problem += (
        (
            -alpha_values[0] * pulp.lpSum(x_vars[i] for i in non_concentrated_df[non_concentrated_df['days'].str.contains(day)].index)  # 授業日数
            for day in ['月', '火', '水', '木', '金']
        ) + pulp.lpSum(x_vars[i] for i in df.index) * 0.01 +
        -alpha_values[1] * pulp.lpSum(df.loc[i, 'homework'] * x_vars[i] for i in df.index) +  # 宿題が少ない方が良い
        -alpha_values[2] * pulp.lpSum(df.loc[i, 'numofunits_normalized'] * x_vars[i] for i in df.index) +  # 単位数が少ない方が良い
        alpha_values[3] * pulp.lpSum(df.loc[i, 'remote'] * x_vars[i] for i in df.index) +  # リモート授業が少ない方が良い
        alpha_values[4] * pulp.lpSum(df.loc[i, 'similarity'] * x_vars[i] for i in df.index) +  # 類似度が高い授業を選ぶ
        -alpha_values[5] * pulp.lpSum(df.loc[i, 'q_i'] * x_vars[i] for i in df.index) +  # 早朝授業が少ない方が良い
        -alpha_values[6] * pulp.lpSum(df.loc[i, 'test'] * x_vars[i] for i in df.index)    # テストが少ない方が良い
    )

    # 各制約を可視化するためのデバッグ用リスト
    debug_constraints = []

    # 修得済み授業の制約を追加
    for i in df.index:
        if df.loc[i, 'classname'] in completed_courses:
            problem += x_vars[i] == 0

    # 制約条件: 授業時間の重複を避ける
    for i, row in non_concentrated_df.iterrows():
        times = row['times']
        for time1 in times:
            for j, row2 in non_concentrated_df.iterrows():
                if i >= j:
                    continue
                if any(time1 == time2 for time2 in row2['times']):
                    constraint = x_vars[i] + x_vars[j] <= 1
                    problem += constraint
                    debug_constraints.append((f"時間重複制約({row['classname']} & {row2['classname']})", constraint))

    # **追加された制約条件: '必修'科目は必ず選択する**
    for i in df[df['unitclass'] == '必修'].index:
        problem += constraint
        debug_constraints.append((f"必修制約({df.loc[i, 'classname']})", constraint))

    # 最適化
    status = problem.solve(pulp.PULP_CBC_CMD(msg=False))

    # 制約違反を可視化
    violated_constraints = [desc for desc, constraint in debug_constraints if not constraint.valid()]
    
    # 結果の取得
    result = df[df.index.isin([i for i in df.index if x_vars[i].value() == 1])].to_dict(orient='records')

    # 最適化問題のステータスを確認し、適切なメッセージを出力
    if pulp.LpStatus[status] == 'Infeasible':
        # infeasible の場合、必修科目のみ選択し、他の授業は選択可能なもののみを返す
        selected_classes = df[(df['unitclass'] == '必修') | (df.index.isin([i for i in df.index if x_vars[i].value() == 1]))]
        return json.dumps({
            "message": "制約が厳しすぎます。",
            "selected_classes": selected_classes.to_dict(orient='records')
        }, ensure_ascii=False)
    elif pulp.LpStatus[status] == 'Optimal':
        selected_classes = df[df.index.isin([i for i in df.index if x_vars[i].value() == 1])].copy()
    
        # times 列を見やすい形式に整形
        selected_classes['formatted_times'] = selected_classes['times'].apply(lambda times: ' & '.join(times))
        
        # 整形した times 列を使用して結果を出力
        result = selected_classes[['classname', 'formatted_times', 'unitclass', 'numofunits', "teacher", "test", "remote", "homework", "when", "semester", "l_i"]].to_dict(orient='records')
        return json.dumps(result, ensure_ascii=False)
    else:
        return f"最適化問題の解決に失敗しました。ステータス: {pulp.LpStatus[status]}"