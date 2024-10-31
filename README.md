## 環境の立ち上げ
1. [Groq](https://console.groq.com/keys)からGroq API Keyを取得．
ただし，Groq APIの無料枠は現在，1分間に30リクエスト，1日に1.4万リクエストまでとなっていることに注意．
2. .env.templateの名前を.envに変更し，中身を以下のように変更．
```bash
GROQ_API=<取得したAPI Key>
```
Docker環境が使える環境で以下のコマンドを実行．
```bash
docker-compose up --build
```
その後，frontendはhttp://localhost:3000 ，backendは http://localhost:8080に立ち上がる．

## Backend
バックエンドのAPIドキュメントは
http://localhost:8080/docs に立ち上げられる．このURLにアクセスするとusernameとパスワードが求められるため，以下のusernameとパスワードを入力．
- username: lectapp
- password: @pp
### LLMのテスト
llmのAPIのリクエストボディは以下のような形式で入力．
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

リクエストを与えると必要であればLLMが自動でパラメータを調整して，以下のようなレスポンスを返す．
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

## frontend
- コース選択機能
    - 学科
    - 学年
    - クオーター
    - 専門進化プログラム
    - 社会駆動プログラム
- 条件選択
    - 課題の重さ
    - 同期or非同期
    - 期末テストの有無
    などまだ確定していない
- キーワード選択

などの項目を送信すると講義候補が返ってくるイメージ。<br>
`table.html`で簡単なテーブルを描画する。

## ToDo
- [x] LLMによるエージェントのAPI実装(Backend)
- [x] 既習単位の排除アルゴリズム(Backend)
- [x] 制約条件の時の単位数の正規化を戻そう!!
- [x] 授業が二時間ある時に2コマ目の授業が取れてない
- [ ] バックエンド側でファイル出力するのをやめる
- [ ] ユーザーが取りたくない授業がはっきりある場合はその授業をLLMにより判断し，その授業のxを絶対に0にするような制約条件を追加．
- [ ] 既習単位の単位数を出力する関数の実装(Backend)
- [ ] クオーターの制約実装(Backend)
- [ ] 集中講義のレコメンド機能の考案