from transformers import BertJapaneseTokenizer, BertModel
import torch
import torch.nn.functional as F

class SentenceBertJapanese:
    def __init__(self, model_name_or_path, device=None):
        self.tokenizer = BertJapaneseTokenizer.from_pretrained(model_name_or_path)
        self.model = BertModel.from_pretrained(model_name_or_path)
        self.model.eval()

        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = torch.device(device)
        self.model.to(device)

    def _mean_pooling(self, model_output, attention_mask):
        token_embeddings = model_output[0] #First element of model_output contains all token embeddings
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

    @torch.no_grad()
    def encode(self, sentences, batch_size=8):
        all_embeddings = []
        iterator = range(0, len(sentences), batch_size)
        for batch_idx in iterator:
            batch = sentences[batch_idx:batch_idx + batch_size]

            encoded_input = self.tokenizer.batch_encode_plus(batch, padding="longest", 
                                           truncation=True, return_tensors="pt").to(self.device)
            model_output = self.model(**encoded_input)
            sentence_embeddings = self._mean_pooling(model_output, encoded_input["attention_mask"]).to('cpu')

            all_embeddings.extend(sentence_embeddings)

        # return torch.stack(all_embeddings).numpy()
        return torch.stack(all_embeddings)

MODEL_NAME = "sonoisa/sentence-bert-base-ja-mean-tokens-v2"  # <- v2です。
model = SentenceBertJapanese(MODEL_NAME)

def calc_similarity(user_prefer, classkeywords_list):
    # user_prefer と各授業キーワードをまとめて sentences に入れる
    sentences = [user_prefer] + [class_keywords for _, class_keywords in classkeywords_list]

    # 一括で埋め込みを計算
    sentence_embeddings = model.encode(sentences, batch_size=8)

    # 最初の埋め込みが user_prefer のベクトル
    user_embedding = sentence_embeddings[0]

    # コサイン類似度を計算して結果をリストに格納
    results = []
    for idx, (class_name, class_keywords) in enumerate(classkeywords_list):
        class_embedding = sentence_embeddings[idx + 1]  # idx+1で授業のベクトルを取得
        similarity = F.cosine_similarity(user_embedding, class_embedding, dim=0).item()
        results.append([class_name, class_keywords, similarity])

    return results