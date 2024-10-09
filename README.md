## backend
### 環境構築
```bash
cd back
conda create -n <name> python pip
conda activate <name>
pip install 'fastapi[all]' uvicorn
```
### サーバーをたてるコマンド
```bash
uvicorn main:app --reload
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