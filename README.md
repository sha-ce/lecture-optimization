# course registration

## backend
### 環境構築
```bash
cd __backend
conda create -n <name> python pip
conda activate <name>
pip install 'fastapi[all]' uvicorn
```
### サーバーをたてるコマンド
```bash
uvicorn main:app --reload
```

## frontend