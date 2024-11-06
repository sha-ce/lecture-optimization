# バックエンドのリクエストボティとレスポンスボディに関するドキュメント
## Postメソッド： /optimizer/items/
### リクエストボディ(文字列型)
```
{"compulsory": "知能情報工学科","grade": "default","quarter": "Q1","special": "データ科学コース","social": "AI応用コース","alphas": ["0","0","0","0","0","0","0"],"l_early": "1","units": ["2","10"],"keywords": ["最適化"]}
```
上記のjsonを文字列型にしたものとPDFファイルをリクエストとして受け付ける
### レスポンスボディ
```
{
  "time_table": {
    "1": {
      "mon": {
        "name": "データ構造とアルゴリズム",
        "teacher": "鈴木　大輔",
        "unit": 3
      },
      "tue": null,
      "wed": null,
      "thu": null,
      "fri": null
    },
    "2": {
      "mon": null,
      "tue": null,
      "wed": null,
      "thu": null,
      "fri": null
    },
    "3": {
      "mon": null,
      "tue": null,
      "wed": null,
      "thu": {
        "name": "データ構造とアルゴリズム",
        "teacher": "鈴木　大輔",
        "unit": 3
      },
      "fri": null
    },
    "4": {
      "mon": null,
      "tue": null,
      "wed": null,
      "thu": null,
      "fri": null
    },
    "5": {
      "mon": null,
      "tue": null,
      "wed": null,
      "thu": null,
      "fri": null
    },
    "6": {
      "mon": null,
      "tue": null,
      "wed": null,
      "thu": null,
      "fri": null
    }
  },
  "item": {
    "compulsory": "知能情報工学科",
    "grade": "default",
    "quarter": "Q1",
    "special": "データ科学コース",
    "social": "AI応用コース",
    "alphas": [
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "l_early": "1",
    "units": [
      "2",
      "10"
    ],
    "keywords": [
      "最適化"
    ]
  }
}
```

## /llm/chat/(post)
### リクエストボディ（文字列型）
```
{
  "questions": [
    "僕はみんなの要望を受けて，時間割の提案を変更するエージェントだよ．何か要望があれば言ってね．",
    "朝起きるの苦手なんだー"
  ],
  "preferences": {
    "Few early morning classes": 0,
    "Optimization of class days": 0,
    "Optimization of credit hours": 0,
    "Fewer remote classes": 0,
    "Fewer courses of interest":0,
    "Fewer exams": 0,
    "Fewer assignments": 0
  }
}
```

### レスポンスボティ
```
{
  "response": [
    "僕はみんなの要望を受けて，時間割の提案を変更するエージェントだよ．何か要望があれば言ってね．",
    "朝起きるの苦手なんだー",
    "あはは、寝るのが好きな奴だな！朝起きるのは大変だよねぇ。何時まで寝てたの？"
  ],
  "new_params": {
    "Few early morning classes": 2,
    "Optimization of class days": 0,
    "Fewer assignments": 0,
    "Optimization of credit hours": 0,
    "Fewer remote classes": 0,
    "Fewer courses of interest": 0,
    "Fewer exams": 0
  }
}
```