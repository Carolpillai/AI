import React from 'react';
import { Menu, VolumeX, Sparkles, FileText, Layers } from 'lucide-react';
import type { StudyTab } from '../types';

interface HeaderProps {
  activeTab: StudyTab;
  filename: string;
  sectionTitle?: string;
  onToggleSidebar: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  filename,
  sectionTitle,
  onToggleSidebar,
  isSpeaking,
  onStopSpeaking
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat':
        return 'Study Discussion';
      case 'flashcards':
        return 'Flashcards Deck';
    }
  };

  return (
    <header className="h-14 border-b border-[#e8e7e3] bg-[#fbfbfa]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors md:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-stone-900 text-sm sm:text-base">
            {getTabTitle()}
          </h2>

          {filename && (
            <>
              <span className="hidden sm:inline-block text-stone-300">•</span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 bg-stone-100/80 px-2.5 py-1 rounded-full border border-stone-200/60 truncate max-w-xs">
                <FileText className="w-3 h-3 text-stone-400 shrink-0" />
                <span className="truncate">{filename}</span>
                {sectionTitle && sectionTitle !== 'Full Document' && (
                  <>
                    <span className="text-stone-300">/</span>
                    <span className="text-amber-700 font-medium truncate flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      {sectionTitle}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Global Stop Speaking pill if audio is currently playing */}
        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-medium animate-pulse hover:bg-amber-200 transition-colors"
          >
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-amber-600 rounded-full animate-wave-1" />
              <span className="w-1 h-4 bg-amber-600 rounded-full animate-wave-2" />
              <span className="w-1 h-2 bg-amber-600 rounded-full animate-wave-3" />
            </div>
            <span>Speaking • Stop</span>
            <VolumeX className="w-3 h-3 ml-0.5 text-amber-700" />
          </button>
        )}

        <div className="hidden lg:flex items-center gap-1 text-[11px] text-stone-500 font-medium bg-stone-100 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>Voice-First AI</span>
        </div>
      </div>
    </header>
  );
};
