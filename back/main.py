from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import json

from classnavi.utils.optimizer import optimize_classes

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Item(BaseModel):
    compulsory: str
    grade: str
    quarter: str
    special: str
    social: str
    alphas: list
    l_early: str
    units: list
    keywords: list

class Table(BaseModel):
    time_table: object = {
        '1': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '2': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '3': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '4': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '5': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '6': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
    }

@app.post('/conditions/')
async def post(item: Item):
    with open('./items.json', 'w') as f:
        json.dump(dict(item), f, indent=4, ensure_ascii=False)
    return item

@app.get('/items/')
def get():
    with open('./items.json') as f:
        item = f.read()
    item = json.loads(item)
    
    result = optimize_classes(
        [int(alpha) for alpha in item['alphas']],
        './classnavi/datas/data.csv',
        int(item['l_early']),
        int(item['units'][0]),
        int(item['units'][1]),
        item['keywords'][0],
    )

    day_en2jp = {'月': 'mon', '火': 'tue', '水': 'wed', '木': 'thu', '金': 'fri'}
    table = Table()

    try:
        result_data = json.loads(result)
        print(result_data)
        
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

