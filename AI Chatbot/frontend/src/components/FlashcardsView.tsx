import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  RotateCcw, 
  Sparkles, 
  LayoutGrid, 
  Layers,
  FileText,
  Volume2,
  CheckCircle2,
  XCircle,
  Trophy,
  Award
} from 'lucide-react';
import type { Flashcard } from '../types';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onGenerate: (topic: string, count: number) => void;
  isLoading: boolean;
  onSpeak: (text: string) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  flashcards,
  onGenerate,
  isLoading,
  onSpeak
}) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [masteredIndices, setMasteredIndices] = useState<Set<number>>(new Set());
  const [reviewIndices, setReviewIndices] = useState<Set<number>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showSummary, setShowSummary] = useState(false);

  const optionLetters = ['A', 'B', 'C', 'D'];

  const getCardDetails = useCallback((card: Flashcard) => {
    if (card.options && card.options.length >= 4) {
      return {
        options: card.options,
        correctIndex: card.correct_index ?? 0
      };
    }
    // Fallback options if card was generated without explicit options
    const correctOptionText = card.back.length > 80 ? card.back.slice(0, 77) + '...' : card.back;
    return {
      options: [
        correctOptionText,
        'Statecraft, economic policy, and military strategy in ancient India',
        'Philosophical treatises on ethics and spiritual liberation',
        'Astronomical and mathematical calculations of classical scholars'
      ],
      correctIndex: 0
    };
  }, []);

  const calculateMarks = useCallback(() => {
    let marks = 0;
    flashcards.forEach((card, idx) => {
      const selected = userAnswers[idx];
      if (selected !== undefined) {
        const { correctIndex } = getCardDetails(card);
        if (selected === correctIndex) {
          marks++;
        }
      }
    });
    return marks;
  }, [flashcards, userAnswers, getCardDetails]);

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    } else {
      setShowSummary(true);
    }
  }, [currentIndex, flashcards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 150);
    }
  }, [currentIndex]);

  const handleSelectOption = (optIdx: number) => {
    if (userAnswers[currentIndex] !== undefined) return;
    
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIdx
    }));

    const currentCard = flashcards[currentIndex];
    if (currentCard) {
      const { correctIndex } = getCardDetails(currentCard);
      if (optIdx === correctIndex) {
        setMasteredIndices((prev) => new Set(prev).add(currentIndex));
        setReviewIndices((prev) => {
          const next = new Set(prev);
          next.delete(currentIndex);
          return next;
        });
      } else {
        setReviewIndices((prev) => new Set(prev).add(currentIndex));
        setMasteredIndices((prev) => {
          const next = new Set(prev);
          next.delete(currentIndex);
          return next;
        });
      }
    }

    // Automatically advance to the next card after a brief 900ms delay for feedback
    setTimeout(() => {
      handleNext();
    }, 900);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'carousel' || flashcards.length === 0 || showSummary) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, flashcards.length, showSummary, handleNext, handlePrev]);

  const markMastered = () => {
    setMasteredIndices((prev) => new Set(prev).add(currentIndex));
    setReviewIndices((prev) => {
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    handleNext();
  };

  const markReview = () => {
    setReviewIndices((prev) => new Set(prev).add(currentIndex));
    setMasteredIndices((prev) => {
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    handleNext();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserAnswers({});
    setShowSummary(false);
    setCurrentIndex(0);
    onGenerate(topic, count);
  };

  const restartDeck = () => {
    setUserAnswers({});
    setShowSummary(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = flashcards[currentIndex];
  const currentDetails = currentCard ? getCardDetails(currentCard) : { options: [], correctIndex: 0 };
  const isCurrentAnswered = userAnswers[currentIndex] !== undefined;
  const currentSelectedOpt = userAnswers[currentIndex];
  const isCurrentCorrect = isCurrentAnswered && currentSelectedOpt === currentDetails.correctIndex;

  const totalMarks = calculateMarks();

  const quickTopics = [
    { label: "Whole Document", val: "" },
    { label: "Key Formulas", val: "formulas and equations" },
    { label: "Core Definitions", val: "definitions and terminology" },
    { label: "Exam Concepts", val: "high yield exam questions" }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 bg-[#fbfbfa]">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Generator Card */}
        <div className="bg-white border border-[#e8e7e3] rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>AI Interactive Flashcards & Quiz Deck</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Select options for each card to evaluate knowledge and earn marks.
              </p>
            </div>

            {flashcards.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Live Marks Badge */}
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-900 shadow-2xs">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Marks: {totalMarks} / {flashcards.length}</span>
                </div>

                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setViewMode('carousel'); setShowSummary(false); }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      viewMode === 'carousel'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 inline mr-1" />
                    Study Deck
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />
                    Grid
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Generator Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic focus (e.g., Photosynthesis, Chapter 2, Laws of Motion, or leave blank)..."
                className="flex-1 bg-stone-50 border border-stone-200 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors"
              />

              <div className="flex gap-2">
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-700 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 Cards</option>
                  <option value={10}>10 Cards</option>
                  <option value={15}>15 Cards</option>
                </select>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isLoading
                      ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      : 'bg-[#1a1915] hover:bg-stone-800 text-white shadow-xs'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Generate Cards</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Topic Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-stone-400">Quick ideas:</span>
              {quickTopics.map((qt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTopic(qt.val);
                    setUserAnswers({});
                    setShowSummary(false);
                    setCurrentIndex(0);
                    onGenerate(qt.val, count);
                  }}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-100 hover:bg-amber-100/60 hover:text-amber-900 text-stone-600 transition-colors"
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Empty State */}
        {flashcards.length === 0 && !isLoading && (
          <div className="bg-white border border-[#e8e7e3] rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-stone-800 text-base mb-1">
              No Flashcards Generated Yet
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              Enter a topic above or click "Generate Cards" to create interactive cards with answer options and scoring.
            </p>
            <button
              onClick={() => onGenerate('', 10)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs transition-colors"
            >
              Generate 10 Key Flashcards
            </button>
          </div>
        )}

        {/* Deck Summary / Final Score & Marks Screen */}
        {flashcards.length > 0 && showSummary && (
          <div className="bg-white border border-[#e8e7e3] rounded-2xl p-8 text-center shadow-xs space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-stone-900 mb-1">
                Deck Completed!
              </h3>
              <p className="text-stone-600 text-sm">
                Total Marks Earned: <span className="font-bold text-amber-800 text-lg">{totalMarks} / {flashcards.length} Marks</span> (
                {Math.round((totalMarks / flashcards.length) * 100)}%)
              </p>
            </div>

            {/* Performance interpretation */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 max-w-md mx-auto text-xs text-stone-700 leading-relaxed">
              {totalMarks === flashcards.length ? (
                <span className="text-emerald-700 font-semibold">
                  🌟 Full Marks! Excellent mastery of all concepts in this deck!
                </span>
              ) : totalMarks >= flashcards.length * 0.7 ? (
                <span className="text-stone-800 font-medium">
                  👏 Great job! You scored high marks. Review the cards marked for practice to get 100%.
                </span>
              ) : (
                <span className="text-amber-800 font-medium">
                  📚 Keep practicing! Re-read the explanations and take the deck again for higher marks.
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={restartDeck}
                className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                <span>Retake Deck</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors"
              >
                <span>Review Flashcards</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserAnswers({});
                  setShowSummary(false);
                  setCurrentIndex(0);
                  onGenerate(topic, count);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#1a1915] hover:bg-stone-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Generate New Deck</span>
              </button>
            </div>
          </div>
        )}

        {/* Carousel / Interactive Option Selection & Study Mode */}
        {flashcards.length > 0 && viewMode === 'carousel' && !showSummary && currentCard && (
          <div className="space-y-4">
            {/* Progress Header */}
            <div className="flex items-center justify-between text-xs text-stone-500 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800">
                  Card {currentIndex + 1} of {flashcards.length}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  Marks: {totalMarks} / {flashcards.length}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-emerald-700 font-medium">
                  {masteredIndices.size} Mastered
                </span>
                {reviewIndices.size > 0 && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="text-amber-700 font-medium">
                      {reviewIndices.size} Review
                    </span>
                  </>
                )}
              </div>

              <div className="text-[11px] text-stone-400 hidden sm:block">
                Press <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-200 rounded text-[10px]">Space</kbd> to flip, <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-200 rounded text-[10px]">← / →</kbd> to navigate
              </div>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
              />
            </div>

            {/* 3D Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="perspective-1000 w-full h-[460px] sm:h-[500px] cursor-pointer select-none"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front Face (Question + Selectable Answer Options) */}
                <div className="absolute inset-0 backface-hidden bg-white border border-[#e8e7e3] rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 flex items-center gap-1.5">
                      <HelpCircleIcon className="w-3.5 h-3.5" />
                      Select the Correct Answer
                    </span>

                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5" />
                      Click card to flip
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <p className="text-base sm:text-xl font-bold text-stone-900 leading-snug">
                      {currentCard.front}
                    </p>
                  </div>

                  {/* Selectable Answer Options (A, B, C, D) */}
                  <div className="space-y-2 mb-3" onClick={(e) => e.stopPropagation()}>
                    {currentDetails.options.map((optionText, optIdx) => {
                      const isSelected = currentSelectedOpt === optIdx;
                      const isCorrectChoice = optIdx === currentDetails.correctIndex;

                      let style = "border-stone-200 bg-stone-50/60 hover:bg-amber-50/50 hover:border-amber-300 text-stone-800";

                      if (isCurrentAnswered) {
                        if (isCorrectChoice) {
                          style = "border-emerald-500 bg-emerald-50 text-emerald-950 font-medium shadow-2xs ring-1 ring-emerald-500";
                        } else if (isSelected && !isCorrectChoice) {
                          style = "border-rose-400 bg-rose-50 text-rose-950 font-medium";
                        } else {
                          style = "border-stone-200 bg-stone-50/30 text-stone-400 opacity-50";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between cursor-pointer select-none text-xs sm:text-sm ${style}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                isCurrentAnswered && isCorrectChoice
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrentAnswered && isSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white border border-stone-200 text-stone-700'
                              }`}
                            >
                              {optionLetters[optIdx]}
                            </span>
                            <span className="leading-snug">{optionText}</span>
                          </div>

                          {isCurrentAnswered && isCorrectChoice && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                          )}
                          {isCurrentAnswered && isSelected && !isCorrectChoice && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-100">
                    <span>Card #{currentIndex + 1}</span>

                    {isCurrentAnswered && (
                      <span className={`font-semibold flex items-center gap-1 ${isCurrentCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isCurrentCorrect ? '✓ Correct (+1 Mark)' : '✗ Incorrect (0 Marks)'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeak(currentCard.front);
                      }}
                      className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                      title="Listen to question"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Back Face (Answer / Detailed Explanation) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#fdfcf9] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                      Detailed Explanation & Key Concept
                    </span>

                    {currentCard.page && (
                      <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-200/70 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Page {currentCard.page}
                      </span>
                    )}
                  </div>

                  <div className="px-2 my-auto max-h-56 overflow-y-auto">
                    <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-normal">
                      {currentCard.back}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-amber-100">
                    <span className="text-stone-400">Click to flip back to choices</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeak(currentCard.back);
                      }}
                      className="p-1 rounded-lg hover:bg-stone-200/50 text-stone-600 transition-colors"
                      title="Listen to answer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Study & Navigation Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`p-2.5 rounded-xl border border-stone-200 transition-colors ${
                    currentIndex === 0
                      ? 'text-stone-300 bg-stone-50 cursor-not-allowed'
                      : 'text-stone-700 bg-white hover:bg-stone-50'
                  }`}
                  title="Previous Card"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-800 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <RotateCw className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isFlipped ? 'Show Options' : 'Flip Card'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 bg-[#1a1915] hover:bg-stone-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <span>{currentIndex === flashcards.length - 1 ? 'View Marks Summary' : 'Next Card'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mastered / Need Practice Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={markReview}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-amber-900 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Need Practice</span>
                </button>

                <button
                  type="button"
                  onClick={markMastered}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>I Know This</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid View Mode */}
        {flashcards.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {flashcards.map((c, i) => {
              const details = getCardDetails(c);
              const answeredOpt = userAnswers[i];
              const isCorrect = answeredOpt !== undefined && answeredOpt === details.correctIndex;

              return (
                <div
                  key={i}
                  className="bg-white border border-[#e8e7e3] hover:border-amber-400/80 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Card #{i + 1}
                      </span>
                      {answeredOpt !== undefined && (
                        <span className={`text-[11px] font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isCorrect ? '1 / 1 Mark' : '0 / 1 Mark'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-stone-900 mb-2">{c.front}</h4>
                    <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      {c.back}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onSpeak(`${c.front}. ${c.back}`)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                      title="Read card aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

function HelpCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
