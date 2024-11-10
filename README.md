## 環境の立ち上げ
1. [Groq](https://console.groq.com/keys)からGroq API Keyを取得．
ただし，Groq APIの無料枠は現在，1分間に30リクエスト，1日に1.4万リクエストまでとなっていることに注意．

2. [Google API](https://aistudio.google.com/apikey)からgoogleのAPIキーを作成．

3. `.env.template`の名前を`.env`に変更し，中身を以下のように変更．
```bash
GROQ_API=<取得したAPI GroqKey>
GOOGLE_API_KEY=<取得したGoogle API Key>
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
[demo動画](./frontend/demo.mp4)
- 条件など諸項目選択ページ[`index.html`](./frontend/index.html)
  - コース選択
  - 条件選択
    - 対面or遠隔で項目が反転していた部分をバックに合わせて修正済み。
  - キーワード選択
  - 成績通知書アップロード

- 時間割を表示するページ[`table.html`](./frontend/front/pages/table.html)
  - your info：選択した分野やコース、クオータをクリックで表示する。
  - dialogue：クリックするとLLMとチャットできる。localStrageと連動してalphaの値が更新される。
  - 時間割：+ボタンもしくはセル内の講義をクリックでポップアップウィンドウがアクティブになり科目のステージングが可能になる。

## 追加したい機能
- [ ] table.html->index.htmlへの遷移ボタン
- [ ] パラメータ更新した後もチャット履歴がリセットされないようにしたい．
- [ ] 現在取得している授業の単位数と提案されている授業時間割の単位数を表示．
- [x] LLMへの授業情報のRAG機能．
## ToDo
### frontend
- [x] 講義のステージング時、同じ名前の講義を連動させる(Frontend)
- [ ] 登録の際に凍結・固定するような機能(Frontend)
- [ ] 絶対に取りたくない講義も選択できるような機能．
### Backend
- [x] LLMによるエージェントのAPI実装(Backend)
- [x] 既習単位の排除アルゴリズム(Backend)
- [x] 制約条件の時の単位数の正規化を戻そう!!
- [x] 授業が二時間ある時に2コマ目の授業が取れてない
- [x] バックエンド側でファイル出力するのをやめる
- [ ] LLMの単位数
- [ ] ユーザーが取りたくない授業がはっきりある場合はその授業をLLMにより判断し，その授業のxを絶対に0にするような制約条件を追加．
- [ ] 既習単位の単位数を出力する関数の実装(Backend)
- [x] クオーターの制約実装(Backend)
- [ ] 集中講義のレコメンド機能の考案

## Note
もし，dockerが更新されないときは
```
docker builder prune
```
を実行する．