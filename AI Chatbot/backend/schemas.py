from pydantic import BaseModel, Field
from typing import List, Optional, Any

class ChatRequest(BaseModel):
    session_id: str
    query: str
    language: str = "Auto"
    section_id: Optional[str] = None

class FlashcardRequest(BaseModel):
    session_id: str
    topic: str = ""
    count: int = 10
    language: str = "Auto"
    section_id: Optional[str] = None

class Flashcard(BaseModel):
    front: str
    back: str
    options: Optional[List[str]] = None
    correct_index: Optional[int] = None
    page: Optional[int] = None

class FlashcardResponse(BaseModel):
    cards: List[Flashcard]

class IntentResponse(BaseModel):
    action: str  # 'chat', 'flashcards'
    topic: str = ""
    count: int = 5
