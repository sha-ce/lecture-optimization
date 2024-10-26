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

from langchain_community.vectorstores import FAISS
from langchain.document_loaders import DirectoryLoader, CSVLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Get Groq API Key
groq_api_key = os.getenv("GROQ_API")
groq_chat = ChatGroq(groq_api_key=groq_api_key, model_name="llama3-70b-8192")

# FAISS_DB_DIR = "vectorstore"

# Document Loader
# loader = DirectoryLoader(path="./../data_old", loader_cls=CSVLoader, glob="*.csv")
# raw_docs = loader.load()

# # Document Transformers
# text_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=50)
# docs = text_splitter.split_documents(raw_docs)

# # Embeddings
# embedding = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")
# faiss_db = FAISS.from_documents(documents=docs, embedding=embedding)

# # Vector Store
# faiss_db.save_local(FAISS_DB_DIR)

# retriever = faiss_db.as_retriever()

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
    - Optimization of credit hours: {alpha_2} (-5 indicates fewer credits, 5 indicates more credits)
    - Fewer remote classes: {alpha_3} (-5 indicates more remote classes, 5 indicates fewer remote classes)
    - Fewer courses of interest: {alpha_4} (-5 indicates more uninteresting courses, 5 indicates more interesting courses)
    - Fewer exams: {alpha_6} (-5 indicates more exams, 5 indicates fewer exams)

    **Important**: If there is a specific user request, prioritize it above other considerations. For example, if the user requests "I don't mind attending more school days this semester," adjust the "Optimization of class days" parameter by decreasing its value to allow for an increased number of class days. Ensure all adjustments align with the user's request.

    Based on the current values of each parameter, assess whether timetable improvements are needed, and propose appropriate adjustments. If parameter adjustments are unnecessary, respond with "None." If adjustments are needed, return JSON data in the format below, ensuring the JSON format is maintained precisely:

    {{
        "Few early morning classes": ?,
        "Optimization of class days": ?,
        "Fewer assignments": ?,
        "Optimization of credit hours": ?,
        "Fewer remote classes": ?,
        "Fewer courses of interest": ?,
        "Fewer exams": ?
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
    latest_messages = chat_history[-10:] # チャット履歴から最新10件を取得
    chat_prompt = "\n".join(latest_messages) # プロンプトとして結合

    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=system_prompt),
            HumanMessagePromptTemplate.from_template("{input_message}")
        ]
    )
    # 正規表現を用いてJSONデータを抽出
    json_pattern = r'\{\s*' + \
                   r'"Few early morning classes":\s*-?\d+,\s*' + \
                   r'"Optimization of class days":\s*-?\d+,\s*' + \
                   r'"Fewer assignments":\s*-?\d+,\s*' + \
                   r'"Optimization of credit hours":\s*-?\d+,\s*' + \
                   r'"Fewer remote classes":\s*-?\d+,\s*' + \
                   r'"Fewer courses of interest":\s*-?\d+,\s*' + \
                   r'"Fewer exams":\s*-?\d+\s*' + \
                   r'\}'

    conversation = LLMChain(
        llm=groq_chat,
        prompt=prompt,
        verbose=False
    )

    response = conversation.predict(input_message=chat_prompt)
    print(response)

    # JSONデータの部分を抽出して返す
    json_data_match = re.search(json_pattern, response)
    if json_data_match:
        json_data = json_data_match.group(0)
        return json.loads(json_data) 

    return None

# def generate_response_with_rag(chat_history: list, param_list: list, recalc: bool) -> list:
#     """
#     ユーザーへのレスポンスを生成する関数(授業情報を読み込ませる)
#     """

#     # レスポンスを再計算するかどうかに基づいてシステムプロンプトを設定
#     if recalc is True:
#         return "時間割の最適化をやり直したよ．確認よろしく!!"
#     else:
#         system_prompt = (
#             "あなたは授業スケジュールを最適化する日本人．回答は全て日本語で行いなさい．授業を進めるときは科目名だけを示して，なんでその科目を進めたのかの理由も併せて伝えて．だけどcontextの中身はなるべく伝えないように気をつけて．ただし，回答はフラットにタメ口で友達に話す感じでよろしく!!"
#             "Context: {context}"
#         )

#     chat_template = ChatPromptTemplate.from_messages(
#         [
#             ("system",system_prompt),
#             ("ai", chat_history[-2]),
#             ("human", "{input}")
#         ]
#     )

#     question_answer_chain = create_stuff_documents_chain(groq_chat, chat_template)
#     chain = create_retrieval_chain(retriever, question_answer_chain)
#     prompt = chat_history[-1]
#     response = chain.invoke({"input": prompt})

#     return response["answer"]

def generate_response(chat_history: list, param_dict: list, recalc: bool) -> str:
    """
    ユーザーへのレスポンスを生成する関数
    """

    system_prompt = "あなたは日本人の友達．回答は全て日本語で行って，フラットにタメ口で話す感じでよろしく!!"

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("ai", chat_history[-2]),
            ("human", "{input}")
        ]
    )

    conversation = LLMChain(
        llm=groq_chat,
        prompt=prompt,
        verbose=False
    )

    response = conversation.predict(input=chat_history[-1])
    print(response)

    chat_history.append(response)
    new_chat_history = chat_history

    return new_chat_history
    
# ユーザーへのレスポンスを生成する関数
def chat_pipeline(chat_history: list, param_dict: dict) -> str:

    # ユーザーからのinputを基にNeedReculcを実行
    new_params = NeedRecalc(chat_history, param_dict)
    print(new_params)

    # ユーザーへの回答を生成
    response = generate_response(chat_history, param_dict, new_params is not None)
    return response, new_params

def test_chatbot():
    chat_history = []
    agent_talk = "僕はみんなの要望を受けて，時間割の提案を変更するエージェントだよ．何か要望があれば言ってね．"
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