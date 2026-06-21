from fastapi import APIRouter
from pydantic import BaseModel
from Backend.llm.llm_client import LLMClient

__test__ = False

router = APIRouter(prefix="/api/llm", tags=["LLM Test"])

class PromptRequest(BaseModel):
    prompt: str

@router.post("/test")
def test_llm(request: PromptRequest):
    """Send a prompt to the LLM and return its reply"""
    client = LLMClient()
    result = client.quick_test(request.prompt)
    return {"response": result}
