from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
async def root():
    return {'message': 'hello world.'}


class Item(BaseModel):
    compulsory: str
    grade: str
    quarter: str
    special: str
    social: str
    nums: list
    keywords: list

@app.post('/conditions/')
async def post(item: Item):
    print(item)
    return item

class Table(BaseModel):
    time_table: object = {
        '1': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '2': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '3': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '4': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '5': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
        '6': {'mon': None, 'tue': None, 'wed': None, 'thu': None, 'fri': None},
    }

@app.get('/table/')
def get():
    table = Table()
    table.time_table['2']['tue'] = {'name': '自然言語処理特論', 'teacher': '嶋田 和孝', 'unit': 2}
    table.time_table['3']['fri'] = {'name': '自然言語処理特論', 'teacher': '嶋田 和孝', 'unit': 2}
    table.time_table['4']['wed'] = {'name': 'ベンチャービジネス創出論', 'teacher': '中藤 良久', 'unit': 1}
    table.time_table['5']['wed'] = {'name': 'ベンチャービジネス創出論', 'teacher': '中藤 良久', 'unit': 1}
    table.time_table['1']['thu'] = {'name': '知能情報演習', 'teacher': '嶋田 和孝', 'unit': 1}
    table.time_table['2']['thu'] = {'name': '知能情報演習', 'teacher': '嶋田 和孝', 'unit': 1}
    return table

