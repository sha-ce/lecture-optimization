import pandas as pd
import pulp
import json
from .calc_similarity import calc_similarity

def optimize_classes(alpha_values, data_path='data.csv', L_early=0, min_units=1, max_units=float('inf'), keywords=""):
    
    # データ読み込み
    df = pd.read_csv(data_path)
    
    # 'when'カラムから授業開始時間 (l_i) と曜日を抽出
    df['l_i'] = df['when'].str.extract('(\d+)').astype(int)
    df['days'] = df['when'].str.extractall('([月火水木金土日])').groupby(level=0).agg(''.join)
    # 早朝の授業インジケータ (q_i) 計算
    df['q_i'] = (df['l_i'] <= L_early).astype(int)
    # 'remote' と 'test' 列を事前に 0 または 1 に変換
    df['remote'] = df['remote'].map({'yes': 1, 'no': 0}).astype(int)
    df['test'] = df['test'].map({'yes': 1, 'no': 0}).astype(int)

    # コサイン類似度を計算
    classkeywords_list = [[row['classname'], row['keyword']] for _, row in df.iterrows()]
    similarities = calc_similarity(keywords, classkeywords_list)

    # コサイン類似度を df に追加
    similarity_dict = {item[0]: item[2] for item in similarities}
    df['similarity'] = df['classname'].map(similarity_dict)
    
    # MILP 問題を定義
    problem = pulp.LpProblem("Class_Selection", pulp.LpMinimize)
    
    # 変数の定義
    x_vars = {i: pulp.LpVariable(f'x_{i}', cat='Binary') for i in df.index}
    y_vars = {d: pulp.LpVariable(f'y_{d}', cat='Binary') for d in set(''.join(df['days'].unique()))}
    
    # 目的関数の設定
    problem += (
        alpha_values[0] * pulp.lpSum(y_vars[d] for d in y_vars) + # 授業日数の最適化
        alpha_values[1] * pulp.lpSum(df.loc[i, 'homework'] * x_vars[i] for i in df.index) - # 課題の多さの最適化
        alpha_values[2] * pulp.lpSum(df.loc[i, 'numofunits'] * x_vars[i] for i in df.index) - # 単位数の最適化
        alpha_values[3] * pulp.lpSum(df.loc[i, 'remote'] * x_vars[i] for i in df.index) - # リモート授業の多さの最適化
        alpha_values[4] * pulp.lpSum(df.loc[i, 'similarity'] * x_vars[i] for i in df.index) + # 興味のある授業の多さを最適化
        alpha_values[5] * pulp.lpSum(df.loc[i, 'q_i'] * x_vars[i] for i in df.index) + # 早朝授業の多さを最適化
        alpha_values[6] * pulp.lpSum(df.loc[i, 'test'] * x_vars[i] for i in df.index) # テストの多さを最適化
    )
    
    # 制約条件: 授業日数のインジケータ
    for d in y_vars:
        problem += y_vars[d] >= pulp.lpSum(x_vars[i] for i in df[df['days'].str.contains(d)].index)
    
    # 制約条件: 授業時間の重複を避ける
    for day in set(''.join(df['days'].unique())):
        for hour in range(1, 8):  # 想定される授業時間帯は1限から7限
            indices = df[(df['days'].str.contains(day)) & (df['l_i'] == hour)].index
            if len(indices) > 1:
                for i in indices:
                    for j in indices:
                        if i != j:
                            problem += x_vars[i] + x_vars[j] <= 1

    # **追加された制約条件: '必修'科目は必ず選択する**
    for i in df[df['unitclass'] == '必修'].index:
        problem += x_vars[i] == 1, f"RequiredClass_{i}"
    
    # 制約条件: 最低単位数と最大単位数の制約を追加
    total_units = pulp.lpSum(df.loc[i, 'numofunits'] * x_vars[i] for i in df.index)
    problem += total_units >= min_units, "MinimumUnits"
    problem += total_units <= max_units, "MaximumUnits"
    total_units_available = df['numofunits'].sum()
    print(f"Available total units: {total_units_available}")
    
    # 最適化
    status = problem.solve(pulp.PULP_CBC_CMD(msg=False))
    
    # 結果の取得
    result = df[df.index.isin([i for i in df.index if x_vars[i].value() == 1])].to_dict(orient='records')
    
    # 最適化問題のステータスを確認し、適切なメッセージを出力
    if pulp.LpStatus[status] == 'Infeasible':
        # infeasible になった場合、必修科目のみ選択して結果を返す
        required_classes = df[df['unitclass'] == '必修']
        return json.dumps({
            "message": "制約が厳しすぎます。必修科目のみ選択されました。",
            "selected_classes": required_classes.to_dict(orient='records')
        }, ensure_ascii=False)
    elif pulp.LpStatus[status] == 'Optimal':
        result = df[df.index.isin([i for i in df.index if x_vars[i].value() == 1])].to_dict(orient='records')
        return json.dumps(result, ensure_ascii=False)
    else:
        return f"最適化問題の解決に失敗しました。ステータス: {pulp.LpStatus[status]}"