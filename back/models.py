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

class Cell(BaseModel):
    quarter: int=1
    daytime: str='mon-1'

class ChatInput(BaseModel):
    questions: List[str]
    preferences: Dict[str, int]