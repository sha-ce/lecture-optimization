from fastapi import APIRouter, File, UploadFile, Form
from models import Item, Cell
import json
import pandas as pd
from classnavi.utils.optimizer import optimize_classes
from pathlib import Path
from typing import Optional
import os
import io

router = APIRouter(prefix="/optimizer", tags=["optimizer"])

@router.post("/items/")
async def get_items(item: str = Form(...), pdf_file: Optional[UploadFile] = File(None)):
    item_data = json.loads(item)
    print(item_data)

    if pdf_file:
        content = await pdf_file.read()
        pdf_content = io.BytesIO(content)

    result = optimize_classes(
        alpha_values=[int(alpha) for alpha in item_data['alphas']],
        data_path='./classnavi/datas/after.csv',
        quarter=int(item_data['quarter']),
        L_early=int(item_data['l_early']),
        min_units=int(item_data['units'][0]),
        max_units=int(item_data['units'][1]),
        keywords=item_data['keywords'],
        pdf_content=None,
        must_select_classes=item_data['must_select_classes'],
        special=item_data['special'],
        social=item_data['social']
    )

    try:
        result_data = json.loads(result)
        print(result_data)
    except json.JSONDecodeError as e:
        print("JSONDecodeError:", str(e))
        print("Returned data:", result)
    return result_data

@router.post('/cell/')
def get_courses_percell(info: Cell):
    # 曜日と対応する英語のプレフィックスを含む辞書を定義
    days = {'月曜': 'mon-', '火曜': 'tue-', '水曜': 'wed-', '木曜': 'thu-', '金曜': 'fri-'}
    # 時限と対応する文字列を含む辞書を定義
    times = {'１限': '1', '２限': '2', '３限': '3', '４限': '4', '５限': '5', '６限': '6'}
    # 日本語の曜日・時限の組み合わせを英語の曜日・時限に変換する辞書を作成
    day_time_dict = {d_jp+t_jp: d_en+t_en for d_jp, d_en in days.items() for t_jp, t_en in times.items()}
    day_time_dict['非同期'] = '非同期'

    # CSVファイルから授業データを読み込む
    df = pd.read_csv('./classnavi/datas/after.csv')
    # 指定された楽器に一致するデータのみを抽出し，インデックスをリセット
    df = df[df.semester==info.quarter].reset_index(drop=True)

    # 該当する授業のインデックスを格納するリストを初期化
    idxs = []
    # 各授業の開催曜日・時限情報をもとにループ処理
    for i, when in enumerate(df.when.values):
        # 複数曜日・時限が設定されている場合，「・」で分割してリスト化
        days_times = when.split('・')
        # 各曜日・時限がday_time_dictの値と一致するかを確認
        for day_time in days_times:
            # 一致する場合，その授業のインデックスをリストに追加
            if day_time_dict[day_time] == info.daytime:
                idxs.append(i)

    # 抽出したインデックスに対応する授業データを取得
    out = df.loc[idxs]
    # JSON形式で授業データを返却
    return out.to_json(force_ascii=False, orient='table')