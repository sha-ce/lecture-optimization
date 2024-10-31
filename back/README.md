# バックエンドのリクエストボティとレスポンスボディに関するドキュメント
## /optimizer/conditions/(post)
### リクエストボディ(文字列型)
```
{"compulsory": "知能情報工学科","grade": "default","quarter": "Q1","special": "データ科学コース","social": "AI応用コース","alphas": ["0","0","0","0","0","0","0"],"l_early": "1","units": ["2","10"],"keywords": ["最適化"]}
```
上記のjsonを文字列型にしたものとPDFファイルをリクエストとして受け付ける
### レスポンスボディ
```
{
  "item": "{\"compulsory\": \"知能情報工学科\",\"grade\": \"default\",\"quarter\": \"Q1\",\"special\": \"データ科学コース\",\"social\": \"AI応用コース\",\"alphas\": [\"0\",\"0\",\"0\",\"0\",\"0\",\"0\",\"0\"],\"l_early\": \"1\",\"units\": [\"2\",\"10\"],\"keywords\": [\"最適化\"]}",
  "pdf_file_path": "./uploads/pdf_files/seisekiTsuuchiPrint.PDF"
}
```

## /llm/chat/(post)
### リクエストボディ（文字列型）
