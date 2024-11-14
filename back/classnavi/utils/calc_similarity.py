import torch
import torch.nn.functional as F

from langchain_google_genai import GoogleGenerativeAIEmbeddings
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

def calc_similarity(user_prefer, classkeywords_list):
    # user_preferと各授業キーワードをまとめてsentencesに入れる
    sentences = [user_prefer] + [class_keywords for _, class_keywords in classkeywords_list]
    # Googleのembeddingモデルを使って埋め込みを計算
    vectors = embeddings.embed_documents(sentences)

    # 最初の埋め込みがuser_preferのベクトル
    user_embedding = torch.tensor(vectors[0])

    # コサイン類似度を計算して結果をリストに格納
    results = []
    for idx, (class_name, class_keywords) in enumerate(classkeywords_list):
        class_embedding = torch.tensor(vectors[idx + 1])  # idx+1で授業のベクトルを取得
        similarity = F.cosine_similarity(user_embedding, class_embedding, dim=0).item()
        results.append([class_name, class_keywords, similarity])

    return results