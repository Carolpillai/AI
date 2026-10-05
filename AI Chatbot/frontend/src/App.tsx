import { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { FlashcardsView } from './components/FlashcardsView';
import { SettingsModal } from './components/SettingsModal';
import type { 
  StudyTab, 
  SupportedLanguage, 
  ChatMessage, 
  Flashcard, 
  DocumentSection, 
  UploadResponse 
} from './types';
import { speakText, stopSpeaking } from './utils/speech';
import { getApiHeaders } from './utils/apiSettings';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  // Session & Document State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<StudyTab>('chat');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');

  // Language & Audio Preferences
  const [language, setLanguage] = useState<SupportedLanguage>('Auto');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  // Chat State
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsKey, setFlashcardsKey] = useState<number>(0);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState<boolean>(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Handle successful document upload
  const handleUploadSuccess = (data: UploadResponse) => {
    setSessionId(data.session_id);
    setFilename(data.filename);
    setPageCount(data.page_count);
    setSections(data.sections || []);
    setSelectedSectionId('');
    setActiveTab('chat');
    setChatLog([]);
    setFlashcards([]);
    setStatus('');
  };

  // Start new study session
  const handleNewSession = () => {
    handleStopSpeaking();
    setSessionId(null);
    setFilename('');
    setPageCount(0);
    setSections([]);
    setSelectedSectionId('');
    setChatLog([]);
    setFlashcards([]);
    setStatus('');
  };

  // Speech Handlers
  const handleSpeak = (text: string, messageId?: string) => {
    if (!text.trim()) return;
    setCurrentlySpeakingId(messageId || 'adhoc');
    setIsSpeaking(true);

    speakText(
      text,
      language,
      () => {
        setIsSpeaking(true);
      },
      () => {
        setIsSpeaking(false);
        setCurrentlySpeakingId(null);
      }
    );
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setCurrentlySpeakingId(null);
  };

  // Chat Logic with Streaming
  const executeChat = async (userQ: string, fromVoice: boolean = false) => {
    if (!sessionId) return;
    handleStopSpeaking();

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now() + 1}`;

    const newChatLog: ChatMessage[] = [
      ...chatLog,
      { id: userMessageId, role: 'user', content: userQ, timestamp: Date.now() },
      { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true }
    ];

    setChatLog(newChatLog);
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getApiHeaders()
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: userQ,
          language: language,
          section_id: selectedSectionId || undefined
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No readable stream from server.');

      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        answer += chunk;

        setChatLog((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].id === assistantMessageId) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: answer,
              isStreaming: true
            };
          }
          return updated;
        });
      }

      // Finalize message
      setChatLog((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].id === assistantMessageId) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: answer,
            isStreaming: false
          };
        }
        return updated;
      });

      // Voice read-aloud: auto-speak if student used voice input OR if autoSpeak is enabled
      if (fromVoice || autoSpeak) {
        handleSpeak(answer, assistantMessageId);
      }
    } catch (err: any) {
      setChatLog((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].id === assistantMessageId) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: `**Error:** ${err.message || 'Unable to complete response. Please check your API key in Settings.'}`,
            isStreaming: false
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // Flashcards Generation
  const handleGenerateFlashcards = async (topic: string, count: number = 10) => {
    setActiveTab('flashcards');
    setIsGeneratingFlashcards(true);
    setStatus('Generating custom flashcard deck...');

    try {
      const res = await fetch(`${API_BASE}/api/flashcards`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getApiHeaders()
        },
        body: JSON.stringify({
          session_id: sessionId || '',
          topic: topic,
          count: count,
          language: language,
          section_id: selectedSectionId || undefined
        })
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFlashcards(data.cards || []);
      setFlashcardsKey((prev) => prev + 1);
      setStatus('');
    } catch (err: any) {
      setStatus(`Flashcards error: ${err.message}`);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // Audio Recording (Voice Mode)
  const startRecording = async () => {
    handleStopSpeaking();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());

        // Clear recording timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 150) return; // Discard empty/too-short audio

        setStatus('Transcribing and classifying voice inquiry...');
        const formData = new FormData();
        formData.append('file', audioBlob, 'speech.webm');

        try {
          const res = await fetch(`${API_BASE}/api/transcribe?language=${encodeURIComponent(language)}`, {
            method: 'POST',
            headers: getApiHeaders(),
            body: formData
          });

          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          const spokenText = data.text;
          const intent = data.intent;

          setStatus('');

          if (intent.action === 'flashcards' || intent.action === 'quiz') {
            handleGenerateFlashcards(intent.topic || '', intent.count || 10);
          } else {
            setActiveTab('chat');
            executeChat(spokenText, true);
          }
        } catch (err: any) {
          setStatus(`Voice recognition error: ${err.message}`);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start seconds timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setStatus('Microphone access denied. Please allow microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Discard recorded chunks
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setStatus('Recording discarded.');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(`Uploading & indexing ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data: UploadResponse = await res.json();
      handleUploadSuccess(data);
    } catch (err: any) {
      setStatus(`Upload error: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Find currently selected section title
  const currentSectionTitle = sections.find((s) => s.id === selectedSectionId)?.title;

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#1a1915] flex flex-col antialiased relative">
      {/* Hidden file input for uploading documents from anywhere in the app */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx"
        className="hidden"
      />

      <div className="flex h-screen overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filename={filename}
          pageCount={pageCount}
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
          language={language}
          setLanguage={setLanguage}
          autoSpeak={autoSpeak}
          setAutoSpeak={setAutoSpeak}
          onNewSession={handleNewSession}
          onTriggerUpload={triggerFileUpload}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Workspace Header */}
          <Header
            activeTab={activeTab}
            filename={filename}
            sectionTitle={currentSectionTitle}
            onToggleSidebar={() => setIsSidebarOpenMobile((prev) => !prev)}
            isSpeaking={isSpeaking}
            onStopSpeaking={handleStopSpeaking}
          />

          {/* Active Tab Screen */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {activeTab === 'chat' && (
              <ChatView
                chatLog={chatLog}
                onSendMessage={(query) => executeChat(query, false)}
                isStreaming={isStreaming}
                status={status}
                language={language}
                setLanguage={setLanguage}
                onStartVoice={startRecording}
                onStopVoice={stopRecording}
                isRecording={isRecording}
                recordingSeconds={recordingSeconds}
                onCancelRecording={cancelRecording}
                onSpeakMessage={handleSpeak}
                onStopSpeaking={handleStopSpeaking}
                currentlySpeakingId={currentlySpeakingId}
                filename={filename}
                onGenerateFlashcardsShortcut={() => handleGenerateFlashcards('', 10)}
                onTriggerUpload={triggerFileUpload}
              />
            )}

            {activeTab === 'flashcards' && (
              <FlashcardsView
                key={flashcardsKey}
                flashcards={flashcards}
                onGenerate={handleGenerateFlashcards}
                isLoading={isGeneratingFlashcards}
                onSpeak={(text) => handleSpeak(text)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global API Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
