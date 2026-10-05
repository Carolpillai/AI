import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, 
  Volume2, 
  Copy, 
  Check, 
  ArrowUp, 
  BookOpen,
  Mic,
  MicOff,
  Loader2,
  Upload
} from 'lucide-react';
import type { ChatMessage, SupportedLanguage } from '../types';

interface ChatViewProps {
  chatLog: ChatMessage[];
  onSendMessage: (query: string) => void;
  isStreaming: boolean;
  status: string;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  onCancelRecording: () => void;
  onSpeakMessage: (text: string, id: string) => void;
  onStopSpeaking: () => void;
  currentlySpeakingId: string | null;
  filename: string;
  onGenerateFlashcardsShortcut: () => void;
  onTriggerUpload?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chatLog,
  onSendMessage,
  isStreaming,
  status,
  language,
  onStartVoice,
  onStopVoice,
  isRecording,
  recordingSeconds,
  onCancelRecording,
  onSpeakMessage,
  onStopSpeaking,
  currentlySpeakingId,
  filename,
  onGenerateFlashcardsShortcut,
  onTriggerUpload
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when new messages arrive or stream updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isStreaming) return;
    const q = inputQuery.trim();
    setInputQuery('');
    onSendMessage(q);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptStarters = [
    {
      title: "Explain Core Concepts",
      desc: "Get a clear step-by-step breakdown with analogies",
      query: "Can you explain the main concepts from this document step-by-step with simple analogies?"
    },
    {
      title: "Most Tested Exam Topics",
      desc: "Identify critical high-yield concepts",
      query: "Based on this document, what are the most important concepts likely to appear in an exam?"
    },
    {
      title: "Key Takeaways Summary",
      desc: "Summarize critical insights from the text",
      query: "Can you summarize the most important takeaways from this document clearly?"
    },
    {
      title: "Cheat Sheet & Definitions",
      desc: "Quickly review key formulas and definitions",
      query: "Give me a 5-point cheat sheet of key definitions, laws, or formulas from this document."
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] relative bg-[#fbfbfa]">
      {/* Scrollable Conversation Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pb-28">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Empty State / Welcome Hero */}
          {chatLog.length === 0 && (
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center mb-4 shadow-xs">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 mb-2">
                What would you like to learn today?
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm max-w-md mb-6">
                {filename ? (
                  <>Ask any question about <span className="font-medium text-stone-900">{filename}</span> using text or voice below.</>
                ) : (
                  <>Hi! Please upload your study documents (PDF or DOCX). I will help you with your studies, answer questions from your syllabus, and generate custom flashcards & quizzes for you!</>
                )}
              </p>

              {!filename && (
                <button
                  type="button"
                  onClick={onTriggerUpload}
                  className="mb-8 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Study Document (PDF / DOCX)</span>
                </button>
              )}

              {/* Starter Prompt Cards */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {promptStarters.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(starter.query)}
                    className="p-3.5 rounded-xl bg-white border border-[#e8e7e3] hover:border-amber-400/80 hover:shadow-xs transition-all text-left group"
                  >
                    <div className="text-xs font-semibold text-stone-800 group-hover:text-amber-700 mb-1 flex items-center justify-between">
                      <span>{starter.title}</span>
                      <ArrowUp className="w-3 h-3 text-stone-300 group-hover:text-amber-600 rotate-45 transition-colors" />
                    </div>
                    <div className="text-[11px] text-stone-500 leading-normal">
                      {starter.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Flashcards shortcut */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                <button
                  onClick={onGenerateFlashcardsShortcut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/70 border border-stone-200 text-xs font-medium text-stone-700 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Generate Flashcards Deck</span>
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages Log */}
          {chatLog.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeakingThis = currentlySpeakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/50 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 transition-all ${
                    isUser
                      ? 'bg-amber-700 text-white rounded-tr-xs shadow-2xs'
                      : 'bg-white border border-[#e8e7e3] text-stone-900 rounded-tl-xs shadow-xs'
                  }`}
                >
                  {isUser ? (
                    <div className="text-sm whitespace-pre-wrap leading-relaxed font-normal">
                      {msg.content}
                    </div>
                  ) : (
                    <div>
                      {/* Markdown Body */}
                      <div className="markdown-body text-xs sm:text-sm">
                        {msg.content ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        ) : msg.isStreaming ? (
                          <div className="flex items-center gap-2 text-stone-400 py-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span className="text-xs">Thinking & generating answer...</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Streaming cursor */}
                      {msg.isStreaming && msg.content && (
                        <span className="inline-block w-2 h-4 bg-amber-600 ml-1 translate-y-0.5 animate-pulse" />
                      )}

                      {/* Assistant Actions */}
                      {!msg.isStreaming && msg.content && (
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (isSpeakingThis) {
                                  onStopSpeaking();
                                } else {
                                  onSpeakMessage(msg.content, msg.id);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                                isSpeakingThis
                                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-medium'
                                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
                              }`}
                              title={isSpeakingThis ? 'Stop speaking' : 'Read aloud'}
                            >
                              {isSpeakingThis ? (
                                <>
                                  <div className="flex items-center gap-0.5">
                                    <span className="w-0.5 h-2 bg-amber-600 rounded-full animate-wave-1" />
                                    <span className="w-0.5 h-3 bg-amber-600 rounded-full animate-wave-2" />
                                    <span className="w-0.5 h-1.5 bg-amber-600 rounded-full animate-wave-3" />
                                  </div>
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-stone-400" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 transition-colors"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <span className="text-[10px] text-stone-400">
                            Gemini 2.5 Flash
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Light Pill Input Bar (Matching App Aesthetics) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 flex flex-col items-center">
        {/* Voice recording alert pill if active */}
        {isRecording && (
          <div className="mb-2 px-4 py-2 bg-amber-500/10 border border-amber-300 text-amber-900 rounded-full flex items-center gap-3 text-xs shadow-md animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Listening to your voice ({language})... ({recordingSeconds}s)</span>
            <button
              onClick={onCancelRecording}
              className="text-stone-500 hover:text-stone-900 text-[11px] underline ml-2"
            >
              Cancel
            </button>
            <button
              onClick={onStopVoice}
              className="px-2 py-0.5 bg-amber-700 text-white rounded-md text-[11px] font-semibold"
            >
              Done
            </button>
          </div>
        )}

        {status && !isRecording && (
          <div className="mb-2 text-xs text-amber-900 bg-amber-100/90 px-3.5 py-1.5 rounded-full border border-amber-300 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
            <span>{status}</span>
          </div>
        )}

        {/* Light Aesthetic Pill Input Container */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white/95 border border-[#e8e7e3] shadow-lg hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-full px-3.5 py-2 flex items-center gap-2 backdrop-blur-md transition-all"
        >
          {/* Text Input */}
          <input
            type="text"
            placeholder={`Ask Gemini AI about ${filename || 'your document'}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isStreaming || isRecording}
            className="flex-1 bg-transparent text-stone-800 placeholder-stone-400 text-xs sm:text-sm px-2 focus:outline-none"
          />

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={() => {
              if (isRecording) {
                onStopVoice();
              } else {
                onStartVoice();
              }
            }}
            disabled={isStreaming}
            className={`p-2 rounded-full transition-all shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-stone-500 hover:text-amber-700 hover:bg-amber-50'
            }`}
            title={isRecording ? 'Stop Voice Input' : 'Voice Input'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-600" />}
          </button>

          {/* Submit Send Button */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isStreaming}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-30 text-white flex items-center justify-center shadow-md transition-all shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
