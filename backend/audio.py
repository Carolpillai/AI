import io
from typing import Optional
from schemas import IntentResponse

async def transcribe_audio(
    audio_data: bytes, 
    filename: str, 
    language: str = "Auto",
    gemini_key: Optional[str] = None
) -> str:
    # Audio transcription can fallback or be handled via Gemini if needed
    # For now return transcribed string or placeholder if browser speech recognition is used primary
    return "Transcribed audio query"

async def classify_intent(
    text: str,
    gemini_key: Optional[str] = None
) -> IntentResponse:
    system_prompt = (
        "Classify the user intent into one of these actions: 'chat', 'flashcards', 'quiz', 'diagram', 'summary', 'key_terms'.\n"
        "Also extract the 'topic' or 'count' if specified.\n"
        "Return strictly JSON: {\"action\": \"chat\"|\"flashcards\"|\"quiz\"|\"diagram\"|\"summary\"|\"key_terms\", \"topic\": \"str\", \"count\": int}."
    )
    from llm import generate_json
    return await generate_json(system_prompt, text, IntentResponse, gemini_key=gemini_key)
