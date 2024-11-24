from fastapi import APIRouter, HTTPException
from models import ChatInput

from classnavi.utils.llm import chat_pipeline

router = APIRouter(prefix="/llm", tags=["llm"])

@router.post("/chat/")
async def chat_with_llm(input_data: ChatInput):
    try:
        print(f"input_data: {input_data}")
        # chat_pipeline関数を呼び出し
        response, new_params = chat_pipeline(input_data.questions, input_data.preferences, input_data.user_info)
        return {"response": response, "new_params": new_params}
    except Exception as e:
        # 何らかのエラーが発生した場合、HTTP 500でエラーメッセージを返す
        raise HTTPException(status_code=500, detail=str(e))