import json
from openai import AsyncOpenAI
from config import settings
from typing import TypeVar, Type, Optional, Tuple
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

def get_gemini_client_and_model(gemini_key: Optional[str] = None) -> Tuple[AsyncOpenAI, str]:
    key = (gemini_key or settings.gemini_api_key or "").strip()
    if not key:
        raise ValueError("Gemini API Key missing. Please enter your Gemini API key in the app header or in backend/.env")
    
    client = AsyncOpenAI(
        api_key=key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )
    model = settings.gemini_llm_model or "gemini-2.5-flash"
    return client, model


def get_language_instructions(language: str) -> str:
    lang = (language or "Auto").strip().lower()
    if lang == "hindi":
        return (
            "CRITICAL OBLIGATION - LANGUAGE MUST BE HINDI (हिंदी):\n"
            "- You MUST write your ENTIRE answer in pure HINDI using Devanagari script (हिंदी लिपि).\n"
            "- Do NOT write English sentences. Every sentence, bullet point, and word must be in Hindi.\n"
            "- Example Hindi: 'इस दस्तावेज़ में मुख्य बातें निम्नलिखित हैं:'\n"
            "- Only keep pure technical terms in English if necessary."
        )
    elif lang == "marathi":
        return (
            "CRITICAL OBLIGATION - LANGUAGE MUST BE MARATHI (मराठी):\n"
            "- You MUST write your ENTIRE answer in pure MARATHI using Devanagari script (मराठी लिपि).\n"
            "- Do NOT write English sentences. Every sentence, bullet point, and word must be in Marathi.\n"
            "- Example Marathi: 'या दस्तऐवजात मुख्य मुद्दे खालीलप्रमाणे आहेत:'\n"
            "- Only keep pure technical terms in English if necessary."
        )
    elif lang == "hinglish":
        return (
            "CRITICAL OBLIGATION - LANGUAGE MUST BE HINGLISH (हिंग्लिश / Romanized Hindi):\n"
            "- You MUST write your ENTIRE answer in natural Hinglish (Hindi spoken words written in Roman English script mixed with technical terms).\n"
            "- Example Hinglish: 'Is document mein sabse main concepts ye hain... Step by step samajhte hain:'\n"
            "- Do NOT use Devanagari script for Hinglish. Write natural, conversational Romanized Hindi!"
        )
    elif lang == "english":
        return "CRITICAL OBLIGATION: Write your response strictly in English."
    else:
        return f"LANGUAGE DIRECTIVE: Reply in the student's requested language ({language})."


async def generate_json(
    system_prompt: str, 
    user_prompt: str, 
    schema_cls: Type[T],
    gemini_key: Optional[str] = None
) -> T:
    client, model = get_gemini_client_and_model(gemini_key)
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content or "{}"
        return schema_cls.model_validate_json(content)
    except Exception as e:
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt + f"\n\nPrevious attempt failed: {str(e)}\nReturn valid JSON."},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content or "{}"
            return schema_cls.model_validate_json(content)
        except Exception as e2:
            raise ValueError(f"Failed to generate JSON with Gemini ({model}): {str(e2)}")


async def stream_chat(
    query: str, 
    section_text: str = "", 
    outline: str = "", 
    language: str = "Auto",
    gemini_key: Optional[str] = None
):
    client, model = get_gemini_client_and_model(gemini_key)
    lang_directive = get_language_instructions(language)
    
    if section_text.strip():
        system_prompt = f"""You are a warm, human-like AI study tutor analyzing the uploaded document.

{lang_directive}

Your explanation style:
- Speak naturally like a friendly, knowledgeable mentor or classmate explaining concepts in simple terms.
- Use clear bullet points, bold key terms, and helpful real-world analogies.
- Cite page numbers naturally when referencing specific sections.

Document Outline:
{outline}

Currently loaded document text:
<document>
{section_text[:15000]}
</document>

IMPORTANT REMINDER:
{lang_directive}
"""
    else:
        system_prompt = f"""You are a warm, human-like academic AI study tutor.

{lang_directive}

- Speak naturally like a helpful, friendly mentor explaining concepts clearly to a student.
- If the student says 'hi', 'hello', or asks how to begin, respond warmly: "Hi! Please upload your study documents (PDF or DOCX) using the upload button on the left. I will help you with your studies, answer questions from your syllabus, and generate custom flashcards & quizzes for you!"
- Answer questions clearly using concise bullet points, bold highlights, and simple examples.

IMPORTANT REMINDER:
{lang_directive}
"""

    formatted_user_prompt = f"[{lang_directive}]\n\nStudent Question: {query}"

    stream = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": formatted_user_prompt}
        ],
        stream=True
    )
    
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
