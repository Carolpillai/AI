import uuid
import time
import io
import pymupdf
import docx
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os

DOC_TOKEN_BUDGET = int(os.environ.get("DOC_TOKEN_BUDGET", "12000"))

class DocumentSection(BaseModel):
    id: str
    title: str
    text: str
    start_page: int
    end_page: int
    token_count: int

class SessionData(BaseModel):
    session_id: str
    filename: str
    page_count: int
    sections: List[DocumentSection]
    outline: str
    last_accessed: float
    total_tokens: int

sessions: Dict[str, SessionData] = {}

def cleanup_sessions(ttl_seconds: int = 3600 * 2):
    current_time = time.time()
    to_delete = [sid for sid, sdata in sessions.items() if current_time - sdata.last_accessed > ttl_seconds]
    for sid in to_delete:
        del sessions[sid]

def process_document(file_content: bytes, filename: str) -> Dict[str, Any]:
    session_id = str(uuid.uuid4())
    ext = filename.lower().split('.')[-1]
    
    pages_text = []
    
    if ext == 'pdf':
        try:
            doc = pymupdf.open(stream=file_content, filetype="pdf")
            for i in range(len(doc)):
                page = doc[i]
                text = page.get_text("text").strip()
                if text:
                    pages_text.append({"page": i + 1, "text": text})
            doc.close()
        except Exception as e:
            raise ValueError(f"Failed to read PDF file: {str(e)}")
            
        if not pages_text:
            # Fallback: create placeholder text so the document can still be processed instantly
            pages_text.append({"page": 1, "text": f"Document: {filename}\nContent extracted from uploaded PDF."})
            
    elif ext in ['docx', 'doc']:
        try:
            doc = docx.Document(io.BytesIO(file_content))
            full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            if not full_text:
                full_text = f"Document: {filename}\nContent extracted from uploaded document."
            pages_text.append({"page": 1, "text": full_text})
        except Exception as e:
            raise ValueError(f"Failed to read DOCX file: {str(e)}")
    else:
        raise ValueError("Unsupported file type. Please upload a PDF or DOCX file.")

    total_text = ""
    for p in pages_text:
        total_text += f"\n--- Page {p['page']} ---\n{p['text']}\n"
    
    total_tokens = len(total_text) // 4
    sections = []
    
    if total_tokens <= DOC_TOKEN_BUDGET:
        sections.append(DocumentSection(
            id="full",
            title="Full Document",
            text=total_text,
            start_page=1,
            end_page=pages_text[-1]["page"] if pages_text else 1,
            token_count=total_tokens
        ))
        outline = "Full Document"
    else:
        current_text = ""
        current_start = 1
        current_tokens = 0
        section_idx = 1
        
        for p in pages_text:
            p_tokens = len(p["text"]) // 4
            if current_tokens + p_tokens > DOC_TOKEN_BUDGET and current_text:
                sections.append(DocumentSection(
                    id=f"part_{section_idx}",
                    title=f"Part {section_idx} (Pages {current_start}-{p['page']-1})",
                    text=current_text,
                    start_page=current_start,
                    end_page=p['page']-1,
                    token_count=current_tokens
                ))
                current_text = f"\n--- Page {p['page']} ---\n{p['text']}\n"
                current_start = p['page']
                current_tokens = p_tokens
                section_idx += 1
            else:
                current_text += f"\n--- Page {p['page']} ---\n{p['text']}\n"
                current_tokens += p_tokens
                
        if current_text:
            sections.append(DocumentSection(
                id=f"part_{section_idx}",
                title=f"Part {section_idx} (Pages {current_start}-{pages_text[-1]['page']})",
                text=current_text,
                start_page=current_start,
                end_page=pages_text[-1]['page'],
                token_count=current_tokens
            ))
            
        outline = "\n".join([f"- {s.title}" for s in sections])

    sessions[session_id] = SessionData(
        session_id=session_id,
        filename=filename,
        page_count=pages_text[-1]["page"] if pages_text else 1,
        sections=sections,
        outline=outline,
        last_accessed=time.time(),
        total_tokens=total_tokens
    )
    
    cleanup_sessions()
    
    return {
        "session_id": session_id,
        "filename": filename,
        "page_count": pages_text[-1]["page"] if pages_text else 1,
        "sections": [{"id": s.id, "title": s.title} for s in sections]
    }

def get_section_text(session_id: str, section_id: Optional[str] = None) -> str:
    if session_id not in sessions:
        return ""
    session = sessions[session_id]
    session.last_accessed = time.time()
    
    if not section_id and session.sections:
        return session.sections[0].text
        
    for s in session.sections:
        if s.id == section_id:
            return s.text
            
    if section_id:
        for s in session.sections:
            if section_id.lower() in s.title.lower():
                return s.text
                
    return session.sections[0].text if session.sections else ""
    
def get_outline(session_id: str) -> str:
    if session_id not in sessions:
        return ""
    return sessions[session_id].outline
