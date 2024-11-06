from fastapi import APIRouter, File, UploadFile, Form
from models import Item, Table, Cell
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

    if pdf_file:
        content = await pdf_file.read()
        pdf_content = io.BytesIO(content)

    result = optimize_classes(
        [int(alpha) for alpha in item_data['alphas']],
        './classnavi/data_old/data_old.csv',
        int(item_data['l_early']),
        int(item_data['units'][0]),
        int(item_data['units'][1]),
        item_data['keywords'][0] if item_data['keywords'] != [] else '',
        pdf_content
    )

    day_en2jp = {'月': 'mon', '火': 'tue', '水': 'wed', '木': 'thu', '金': 'fri'}
    table = Table()

    try:
        result_data = json.loads(result)

        print(f"result_data: {result_data}")
        for entry in result_data:
            class_name = entry['classname']
            teacher = entry['teacher']
            unit = entry['numofunits']
            days = entry['formatted_times']
            period = entry['l_i']

            for time_entry in days.split(" & "):
                day_jp, period_str = time_entry[:1], time_entry[2:3]
                print(f"day_jp: {day_jp}, period_str: {period_str}")
                period_str = period_str.strip()
                print(period_str)
                # period_strが空でない場合のみ処理
                if period_str.isdigit():
                    period = int(period_str)  # 時限を整数に変換
                print(period)

                day_en = day_en2jp.get(day_jp)
                if day_en and str(period) in table.time_table:
                    table.time_table[str(period)][day_en] = {
                        "name": class_name,
                        "teacher": teacher,
                        "unit": unit
                    }

    except json.JSONDecodeError as e:
        print("JSONDecodeError:", str(e))
        print("Returned data:", result)

    return {"time_table": table.time_table, "item": item_data}

@router.post('/cell/')
def get_courses_percell(info: Cell):
    days = {'月曜': 'mon-', '火曜': 'tue-', '水曜': 'wed-', '木曜': 'thu-', '金曜': 'fri-'}
    times = {'１限': '1', '２限': '2', '３限': '3', '４限': '4', '５限': '5', '６限': '6'}
    day_time_dict = {d_jp+t_jp: d_en+t_en for d_jp, d_en in days.items() for t_jp, t_en in times.items()}

    df = pd.read_csv('./classnavi/data_old/data_old.csv')
    df = df[df.semester==info.quarter].reset_index(drop=True)
    idxs = []
    for i, when in enumerate(df.when.values):
        days_times = when.split('・')
        for day_time in days_times:
            if day_time_dict[day_time] == info.daytime:
                idxs.append(i)
    out = df.loc[idxs]
    return out.to_json(force_ascii=False, orient='table')

@router.get('/only-items/')
def get_only_items():
    with open('./items.json') as f:
        item = f.read()
    item = json.loads(item)
    return item