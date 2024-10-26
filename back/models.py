from pydantic import BaseModel
from typing import List, Dict, Tuple, Any

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

class ChatInput(BaseModel):
    questions: List[str]
    preferences: Dict[str, int]