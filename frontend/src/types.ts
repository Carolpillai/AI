export interface DocumentSection {
  id: string;
  title: string;
}

export interface UploadResponse {
  session_id: string;
  filename: string;
  page_count: number;
  sections?: DocumentSection[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Flashcard {
  front: string;
  back: string;
  options?: string[];
  correct_index?: number;
  page?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  page?: number;
}

export type StudyTab = 'chat' | 'flashcards';

export type SupportedLanguage = 'Auto' | 'English' | 'Hindi' | 'Hinglish' | 'Marathi';
