import React from 'react';
import { 
  MessageSquare, 
  BookOpen, 
  Plus, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  Zap, 
  X,
  Layers,
  Upload,
  Globe
} from 'lucide-react';
import type { StudyTab, SupportedLanguage, DocumentSection } from '../types';

interface SidebarProps {
  activeTab: StudyTab;
  setActiveTab: (tab: StudyTab) => void;
  filename: string;
  pageCount: number;
  sections?: DocumentSection[];
  selectedSectionId?: string;
  onSelectSection: (sectionId: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
  onNewSession: () => void;
  onTriggerUpload: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  filename,
  pageCount,
  sections = [],
  selectedSectionId,
  onSelectSection,
  language,
  setLanguage,
  onTriggerUpload,
  isOpenMobile,
  onCloseMobile
}) => {
  const languages: SupportedLanguage[] = ['Auto', 'English', 'Hindi', 'Hinglish', 'Marathi'];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#f7f6f3] border-r border-[#e8e7e3] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-4 border-b border-[#e8e7e3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="font-semibold text-stone-900 text-sm tracking-tight block">StudyVoice</span>
              <span className="text-[10px] text-stone-500 font-medium tracking-wide uppercase">AI Study Partner</span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Document Button */}
        <div className="p-3">
          <button
            onClick={onTriggerUpload}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white shadow-xs text-xs font-semibold transition-all group cursor-pointer"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Upload New Document</span>
          </button>
        </div>

        {/* Active Document Card */}
        <div className="px-3 pb-3">
          <div className="p-3 bg-white/80 border border-[#e8e7e3] rounded-xl shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 mt-0.5 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                {filename ? (
                  <>
                    <h3 className="text-xs font-semibold text-stone-900 truncate" title={filename}>
                      {filename}
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {pageCount} {pageCount === 1 ? 'page' : 'pages'} • Indexed
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xs font-semibold text-stone-700">
                      No Document Uploaded
                    </h3>
                    <button
                      onClick={onTriggerUpload}
                      className="text-[11px] text-amber-700 hover:underline font-medium mt-0.5 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Click to upload PDF/DOCX
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Section selector if multiple sections exist */}
            {sections && sections.length > 1 && (
              <div className="mt-2.5 pt-2.5 border-t border-stone-100">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>Document Section</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedSectionId || ''}
                    onChange={(e) => onSelectSection(e.target.value)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-amber-500 pr-6 truncate cursor-pointer"
                  >
                    <option value="">Full Document (All Pages)</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-stone-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation Modes */}
        <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 px-2 py-1">
            Study Modes
          </div>

          <button
            onClick={() => {
              setActiveTab('chat');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-amber-100/70 text-amber-900 font-semibold shadow-xs'
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${activeTab === 'chat' ? 'text-amber-700' : 'text-stone-400'}`} />
            <span className="flex-1 text-left">AI Chat & Voice</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('flashcards');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'flashcards'
                ? 'bg-amber-100/70 text-amber-900 font-semibold shadow-xs'
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'flashcards' ? 'text-amber-700' : 'text-stone-400'}`} />
            <span className="flex-1 text-left">Flashcards Deck</span>
          </button>
        </div>

        {/* Response Language / Tongue Selector Card (In Sidebar) */}
        <div className="px-3 py-2 border-t border-[#e8e7e3]">
          <div className="p-3 bg-white/80 border border-[#e8e7e3] rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-stone-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                <span>Response Language</span>
              </label>
              <span className="text-[10px] text-stone-500 font-bold uppercase bg-stone-100 px-1.5 py-0.5 rounded">
                {language}
              </span>
            </div>

            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-none focus:border-amber-500 cursor-pointer pr-6 truncate"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === 'Auto'
                      ? 'Auto (Same as Document)'
                      : lang === 'Hindi'
                      ? 'Hindi (हिंदी)'
                      : lang === 'Marathi'
                      ? 'Marathi (मराठी)'
                      : lang === 'Hinglish'
                      ? 'Hinglish (हिंग्लिश)'
                      : lang}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Minimal Footer Tag */}
        <div className="p-3 border-t border-[#e8e7e3] bg-stone-50/50 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Gemini 2.5 Flash
          </span>
          <span className="flex items-center gap-0.5 text-amber-700 font-medium">
            <Zap className="w-3 h-3" />
            Active
          </span>
        </div>
      </aside>
    </>
  );
};
