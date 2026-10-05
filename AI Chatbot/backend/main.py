from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional

from config import settings
from doc_store import process_document, get_section_text, get_outline
from schemas import ChatRequest, FlashcardRequest, FlashcardResponse, IntentResponse
from llm import stream_chat, generate_json, get_language_instructions
from audio import classify_intent

app = FastAPI(title="StudyVoice API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": bool(settings.gemini_api_key)
    }

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not (file.filename.lower().endswith(".pdf") or file.filename.lower().endswith(".docx")):
        raise HTTPException(status_code=400, detail="Only .pdf and .docx files are supported.")
        
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")
        
    try:
        result = process_document(content, file.filename)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/api/chat")
async def chat(
    request: ChatRequest,
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")
):
    section_text = ""
    outline = ""
    if request.session_id:
        section_text = get_section_text(request.session_id, request.section_id)
        outline = get_outline(request.session_id)
        
    try:
        return StreamingResponse(
            stream_chat(
                query=request.query, 
                section_text=section_text, 
                outline=outline, 
                language=request.language,
                gemini_key=x_gemini_key
            ),
            media_type="text/event-stream"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/flashcards", response_model=FlashcardResponse)
async def generate_flashcards(
    request: FlashcardRequest,
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")
):
    section_text = ""
    if request.session_id:
        section_text = get_section_text(request.session_id, request.section_id)
        
    lang_directive = get_language_instructions(request.language)
    system_prompt = (
        "Generate educational flashcards with 4 multiple-choice options for each card.\n"
        f"{lang_directive}\n\n"
        f"Return exactly {request.count} flashcards in strict JSON format: \n"
        "{\"cards\": [{\"front\": \"Question/Concept\", \"back\": \"Clear answer explanation\", "
        "\"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"], \"correct_index\": int (0 to 3), \"page\": int]}"
    )
    if section_text:
        user_prompt = f"[{lang_directive}]\nTopic focus: {request.topic}\n\nDocument section:\n{section_text}"
    else:
        topic_name = request.topic.strip() or "Core Academic Concepts"
        user_prompt = f"[{lang_directive}]\nGenerate flashcards for topic: {topic_name}"
    
    try:
        return await generate_json(
            system_prompt, 
            user_prompt, 
            FlashcardResponse,
            gemini_key=x_gemini_key
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")

@app.post("/api/transcribe")
async def transcribe(
    file: UploadFile = File(...), 
    language: str = "Auto",
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")
):
    try:
        intent = await classify_intent("User query", gemini_key=x_gemini_key)
    except Exception:
        intent = IntentResponse(action="chat", topic="")
        
    return {
        "text": "",
        "intent": intent.model_dump()
    }
