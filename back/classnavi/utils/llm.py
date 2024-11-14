import torch
import os
import json
import re

from langchain.chains import LLMChain
from langchain_core.messages import SystemMessage
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from langchain.vectorstores import Chroma
from langchain_core.documents import Document
from langchain.chains import RetrievalQA
import pandas as pd

# Get Groq API Key
groq_api_key = os.getenv("GROQ_API")
groq_chat = ChatGroq(groq_api_key=groq_api_key, model_name="llama3-70b-8192")
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", task_type="retrieval_document")
csv_path = "classnavi/data_old/data_old.csv"

def create_class_documents(data_path: str):
    """
    data_path: str: 授業情報を含むCSVファイルのパス
    """
    # データ読み込み
    df = pd.read_csv(data_path)

    # 課題の量の数値を文章に変換するマッピング
    homework_mapping = {
        -5: "ほとんど課題がない",
        -4: "かなり少ない課題量",
        -3: "少なめの課題量",
        -2: "やや少ない課題量",
        -1: "少しだけ課題がある",
        0: "平均的な課題量",
        1: "少し多めの課題",
        2: "やや多い課題量",
        3: "多めの課題量",
        4: "かなり多い課題量",
        5: "非常に多い課題量"
    }

    # 各行に対してDocumentオブジェクトを生成
    documents = []
    for _, row in df.iterrows():
        classname = row['classname']
        teacher = row['teacher']
        test = "あり" if row['test'].lower() == "yes" else "なし"
        remote = "リモート授業" if row['remote'].lower() == "yes" else "対面授業"
        homework = homework_mapping.get(row['homework'], "不明な課題量")
        numofunits = row['numofunits']
        when = row['when']
        semester = row['semester']
        unitclass = row['unitclass']
        keyword = row['keyword']
        classoutline = row['classoutline']

        # 文章を作成
        description = (
            f"{classname}の授業は{when}に開講され、"
            f"担当教員は{teacher}で、テストは{test}、"
            f"{remote}であり、宿題の量は{homework}、"
            f"単位数は{numofunits}、学期は{semester}、"
            f"授業区分は{unitclass}、キーワードは{keyword}、"
            f"授業概要は{classoutline}です。"
        )

        # Documentオブジェクトを作成しリストに追加
        documents.append(Document(page_content=description))

    return documents

def create_class_vector_store(documents):
    """
    documents: list: Documentオブジェクトのリスト
    """

    # ベクトルストアの作成
    vector_store = Chroma.from_documents(documents, embedding=embeddings, persist_directory=None)
    retriever = vector_store.as_retriever(search_kwargs={'k': 5})

    return retriever

documents = create_class_documents(csv_path)
retriever = create_class_vector_store(documents)

# パラメータの再計算が必要かどうかを判定する関数
def NeedRecalc(chat_history: list, param_dict: dict) -> dict:
    """parameter
    chat_history: list: チャット履歴(古い順)
    chat_history = [
        "こんにちは、何かご要望がありましたらお知らせください．",
        "もう少し朝の授業を減らしてほしいです．また，課題の数ももっと減らしたいです．",
    ]
    param_list: list: パラメータリスト
    param_list = [0, 0, 0, 0, 0, 0, 0]

    ourput: dict: パラメータの再計算が必要な場合は新しいパラメータ値を含む辞書を返す
    例:
    {'早朝授業の少なさ': 2, '授業日数の最適化': 0, '課題の少なさ': 3, '単位数の最適化': 0, 'リモート授業の少なさ': 0, '興味のある授業の少なさ': 0, 'テストの少なさ': 0}
    """
    
    system_prompt = """You are an agent for parameter adjustment to optimize a university timetable. Each parameter indicates the importance of a specific aspect of the class schedule, with a range from -5 to 5. The current values of each parameter and their descriptions are as follows:

        - Few early morning classes: {alpha_5} (-5 indicates more early morning classes, 5 indicates fewer early morning classes)
        - Optimization of class days: {alpha_0} (-5 indicates more class days, 5 indicates fewer class days)
        - Fewer assignments: {alpha_1} (-5 indicates more assignments, 5 indicates fewer assignments)
        - Optimization of credit hours: {alpha_2} (-5 indicates more credits, 5 indicates fewer credits)
        - Fewer remote classes: {alpha_3} (-5 indicates more remote classes, 5 indicates fewer remote classes)
        - Fewer courses of interest: {alpha_4} (-5 indicates more uninteresting courses, 5 indicates more interesting courses)
        - Fewer exams: {alpha_6} (-5 indicates more exams, 5 indicates fewer exams)

        **Important**: If there is a specific user request, prioritize it above other considerations. For example, if the user requests "I don't mind attending more school days this semester," adjust the "Optimization of class days" parameter by decreasing its value to allow for an increased number of class days. Ensure all adjustments align with the user's request.

        If no specific user request is identified in the latest conversation, return "None" with no additional explanation or details. Only if a clear user request exists, analyze whether the current parameter values meet the user's preference and propose adjustments in the following JSON format:

        {{
            "Few early morning classes": ?,
            "Optimization of class days": ?,
            "Fewer assignments": ?,
            "Optimization of credit hours": ?,
            "Fewer remote classes": ?,
            "Fewer courses of interest": ?,
            "Fewer exams": ?
        }}

        If no adjustments are needed, return "None" with no additional explanation or details.
        If the input contains the lecture name or the instructor's name, please output it in the following JSON format.
        **Important**: Please make sure to output the lecture name and instructor's name exactly as they are, without any translation into English or other modifications.

        {{
            "class_name": "<class name>",
            "teacher": "<teacher's name>"
        }}

        """.format(
                alpha_0=param_dict['Optimization of class days'],
                alpha_1=param_dict['Fewer assignments'],
                alpha_2=param_dict['Optimization of credit hours'],
                alpha_3=param_dict['Fewer remote classes'],
                alpha_4=param_dict['Fewer courses of interest'],
                alpha_5=param_dict['Few early morning classes'],
                alpha_6=param_dict['Fewer exams'],
            )

    # 最後から10個のメッセージを取り出してプロンプトを作成
    latest_messages = chat_history[-1:] # チャット履歴を取得
    chat_prompt = "\n".join(latest_messages) # プロンプトとして結合

    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=system_prompt),
            HumanMessagePromptTemplate.from_template("{input_message}")
        ]
    )
    # 正規表現を用いてJSONデータを抽出
    json_pattern = re.compile(r'\{\s*"Few early morning classes":\s*-?\d+,\s*"Optimization of class days":\s*-?\d+,\s*"Fewer assignments":\s*-?\d+,\s*"Optimization of credit hours":\s*-?\d+,\s*"Fewer remote classes":\s*-?\d+,\s*"Fewer courses of interest":\s*-?\d+,\s*"Fewer exams":\s*-?\d+\s*\}')
    json_pattern_class_info = re.compile(r'\{\s*"class_name":\s*"([^"]+)",\s*"teacher":\s*"([^"]*)"\s*\}')
    conversation = LLMChain(
        llm=groq_chat,
        prompt=prompt,
        verbose=False
    )

    response = conversation.predict(input_message=chat_prompt)
    print(response)

    # 不要なコメント部分を削除して、純粋なJSONデータ部分を取得
    cleaned_response = re.sub(r'//.*', '', response)
    response_cleaned = re.sub(r'\(.*?\)', '', cleaned_response) # ()内の文言を削除
    response_cleaned = re.sub(r'\n', '', response_cleaned)
    print(response_cleaned)

    json_matches = re.findall(r'\{.*?\}', response_cleaned)

    # JSONデータの部分を抽出して返す
    result = {}
    for json_str in json_matches:
        try:
            json_obj = json.loads(json_str)
            # 各キーに基づき、どちらのJSONかを判別して格納
            if "Few early morning classes" in json_obj:
                result["params"] = json_obj
            elif "class_name" in json_obj:
                result["class_info"] = json_obj
        except json.JSONDecodeError:
            # JSONとしてパースできなかった場合は無視
            continue

    # パラメータやクラス情報が見つからなければNoneを設定
    result["params"] = result.get("params", None)
    result["class_info"] = result.get("class_info", None)
    print(f"result: {result}")

    return result

def generate_response(chat_history: list, param_dict: list, class_info: dict) -> str:
    """
    ユーザーへのレスポンスを生成する関数
    """
    print(f"class info: {class_info}")
    if class_info: 
        class_data = pd.read_csv(csv_path)
        teacher_name = class_info.get('teacher', '').replace(' ', '').replace('先生', '')
        # 関連する授業情報を抽出
        filtered_data = class_data[
            (class_data['classname'] == class_info.get('class_name', '')) |
            (class_data['teacher'].str.replace('　', '').str.replace('先生', '') == teacher_name)
        ]
        extracted_info = "\n".join([
            (
                f"{row['classname']}の授業は{row['when']}に開講され、"
                f"担当教員は{row['teacher']}で、テストは{row['test']}、"
                f"{row['remote']}であり、宿題の量は{row['homework']}、"
                f"単位数は{row['numofunits']}、学期は{row['semester']}、"
                f"授業区分は{row['unitclass']}、キーワードは{row['keyword']}、"
                f"授業概要は{row['classoutline']}です。"
            )
            for _, row in filtered_data.iterrows()
        ])

    system_prompt = "あなたは大学の友達．ユーザーが時間割を決定する上で役立ちそうな情報があれば，ユーザーに教えてあげて．回答は全て日本語で行って，友達みたいにフラットにタメ口で話す感じでよろしく!!"

    # チャット履歴が10を超える場合は最新の10件に制限する
    if len(chat_history) > 10:
        chat_history = chat_history[-10:]

    # 最新のユーザーの入力を取得
    user_input = chat_history[-1]

    # 関連コンテキストの取得
    related_docs = retriever.get_relevant_documents(user_input)
    
    context = "\n".join([doc.page_content for doc in related_docs])

    # プロンプトの組み立て
    messages = [("system", system_prompt)]
    for i in range(len(chat_history)):
        role = "ai" if i % 2 == 0 else "human"
        messages.append((role, chat_history[i]))
    print(f"context: {context}")

    if class_info:
        if extracted_info:
            messages.append(("system", f"以下の情報を参考にしてください:\n{context}\n{extracted_info}"))
    else:
        messages.append(("system", f"以下の情報を参考にしてください:\n{context}"))

    print(messages)
    prompt = ChatPromptTemplate.from_messages(messages)

    conversation = LLMChain(
        llm=groq_chat,
        prompt=prompt,
        verbose=False
    )

    response = conversation.predict(input=user_input)
    print(response)

    chat_history.append(response)
    new_chat_history = chat_history

    return new_chat_history
    
# ユーザーへのレスポンスを生成する関数
def chat_pipeline(chat_history: list, param_dict: dict) -> str:

    # ユーザーからのinputを基にNeedReculcを実行
    results = NeedRecalc(chat_history, param_dict)
    print(f"results2: {results}")

    # ユーザーへの回答を生成
    response = generate_response(chat_history, param_dict, results["class_info"])
    return response, results["params"]

def test_chatbot():
    chat_history = []
    agent_talk = "僕はみんなの要望を受けて，時間割の提案を変更するエージェントだよ．何か要望があれば言ってね．回答は一言で簡潔にお願い．"
    print(agent_talk)
    chat_history.append(agent_talk)
    param = {'Few early morning classes': 2, 'Optimization of class days': 0, 'Fewer assignments': 0, 'Optimization of credit hours': 0, 'Fewer remote classes': 0, 'Fewer courses of interest': 0, 'Fewer exams': 0}
    while True:
        user_input = input("ユーザー: ")
        chat_history.append(user_input)
        response, new_params = chat_pipeline(chat_history, param)
        print("エージェント: ", response[-1])
        print(f"parameter: {new_params}")
        chat_history  = response
        if new_params is not None:
            param = new_params

        if "終了" in user_input:
            break
    

if __name__=="__main__":
    test_chatbot()