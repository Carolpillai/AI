# StudyVoice

A voice-first AI study tutor for Indian students.

## Features
- Upload PDF context (in-memory, lost on restart)
- Voice or text chat with citations
- Flashcard and Quiz generation
- Uses Groq for blazing fast free inference

## Deployment Steps

1. **Get Groq Key**: Go to console.groq.com and generate an API key.
2. **Deploy Backend (Render)**:
   - Connect your GitHub repo to Render (Web Service).
   - Base directory: `backend`
   - Use `render.yaml` for config, OR set:
     - Build command: `pip install -r requirements.txt`
     - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Set env var `GROQ_API_KEY`.
   - Copy the backend URL (e.g. `https://studyvoice-backend.onrender.com`).
3. **Deploy Frontend (Vercel)**:
   - Connect your repo to Vercel.
   - Root directory: `frontend`
   - Set env var `VITE_API_URL` to your backend URL.
   - Deploy, then copy your frontend URL.
4. **Final Config**:
   - Go back to Render, add `FRONTEND_ORIGIN` env var with your Vercel URL.

## Pre-Demo Checklist
1. **Wake up the backend**: Open the backend `/health` URL 2 minutes before the demo to avoid Render cold starts!
2. Allow microphone permissions when requested by the browser.

## Tech Stack Dependencies Justification
- `fastapi`, `uvicorn`: Web server.
- `python-multipart`: For file uploads.
- `pymupdf`: PDF text extraction without heavy OCR dependencies.
- `rank_bm25`: Lightweight local search retrieval.
- `openai`: Client for Groq API.
- `pydantic`, `pydantic-settings`: Structured JSON schema generation and config.
- React, Vite, TailwindCSS for minimal fast frontend.
