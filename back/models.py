from pydantic import BaseModel
from typing import List, Dict, Tuple, Any

class Item(BaseModel):
    compulsory: str # 知能情報，情報・通信，知的システム，物理情報，生命科学情報
    grade: str # "default"
    quarter: str # "Q1","Q2","Q3","Q4"
    special: str # "メディア情報学コース", "データ科学コース", "人工知能コース", "ソフトウェアデザインコース", "情報通信ネットワークコース", "コンピュータ工学コース", "ロボティクスコース", "システム制御コース", "先進機械コース", "電子物理コース", "生物物理コース", "分子生命工学コース", "医用生命工学コース"
    social: str # "AI応用コース", "金融流通コース", "ソフトウェア開発プロセスコース", "画像認識コース", "ロボティクスシンセシス導入コース", "計算力学エンジニアコース", "大規模計算科学：基礎と実践コース", "アントレプレナーシップコース", "情報教育支援コース", "生命体工学コース", "国際エンジニアリング共同講義コース", "需要創発コース", "マイクロ化技術実践コース", "情報工学導入コース"
    alphas: list
    l_early: str
    units: list
    keywords: list
    must_select_classes: list

class Cell(BaseModel):
    quarter: int=1
    daytime: str='mon-1'

class ChatInput(BaseModel):
    questions: List[str]
    preferences: Dict[str, int]