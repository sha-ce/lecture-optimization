from fastapi import APIRouter
from models import Item, Table, Cell
import json
import pandas as pd
from classnavi.utils.optimizer import optimize_classes

router = APIRouter(prefix="/optimizer", tags=["optimizer"])

@router.post("/conditions/")
async def post(item: Item):
    with open('./items.json', 'w') as f:
        json.dump(dict(item), f, indent=4, ensure_ascii=False)
    return item

@router.get("/items/")
def get():
    with open('./items.json') as f:
        item = f.read()
    item = json.loads(item)
    
    result = optimize_classes(
        [int(alpha) for alpha in item['alphas']],
        './classnavi/data_old/data_old.csv',
        int(item['l_early']),
        int(item['units'][0]),
        int(item['units'][1]),
        item['keywords'][0] if item['keywords'] != [] else '',
    )

    day_en2jp = {'月': 'mon', '火': 'tue', '水': 'wed', '木': 'thu', '金': 'fri'}
    table = Table()

    try:
        result_data = json.loads(result)
        # print(result_data)
        
        for entry in result_data:
            class_name = entry['classname']
            teacher = entry['teacher']
            unit = entry['numofunits']
            days = entry['days']
            period = entry['l_i']

            for day in days:
                table.time_table[str(period)][day_en2jp[day]] = {'name': class_name, 'teacher': teacher, 'unit': unit}
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

@router.get('/only-items/')
def get_only_items():
    with open('./items.json') as f:
        item = f.read()
    item = json.loads(item)
    return item