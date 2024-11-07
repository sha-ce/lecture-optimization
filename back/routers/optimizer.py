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
    print(item_data)

    if pdf_file:
        content = await pdf_file.read()
        pdf_content = io.BytesIO(content)

    result = optimize_classes(
        alpha_values=[int(alpha) for alpha in item_data['alphas']],
        data_path='./classnavi/data_old/data_old.csv',
        quarter=int(item_data['quarter']),
        L_early=int(item_data['l_early']),
        min_units=int(item_data['units'][0]),
        max_units=int(item_data['units'][1]),
        keywords=item_data['keywords'],
        pdf_content=None
    )

    days = {'月曜': 'mon', '火曜': 'tue', '水曜': 'wed', '木曜': 'thu', '金曜': 'fri'}
    times = {'１限': '1', '２限': '2', '３限': '3', '４限': '4', '５限': '5', '６限': '6'}
    day_time_dict = {d_jp+t_jp: [d_en, t_en] for d_jp, d_en in days.items() for t_jp, t_en in times.items()}
    table = Table()

    try:
        result_data = json.loads(result)
        print(result_data)
        if isinstance(result_data, dict):
            return result_data['message']
        
        for entry in result_data:
            class_name = entry['classname']
            teacher = entry['teacher']
            unit = entry['numofunits']
            daytimes = entry['when'].split('・')

            for daytime in daytimes:
                day, time = day_time_dict[daytime]
                table.time_table[time][day] = {'name': class_name, 'teacher': teacher, 'unit': unit}
    except json.JSONDecodeError as e:
        print("JSONDecodeError:", str(e))
        print("Returned data:", result)
    return table

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