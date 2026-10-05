import type { SupportedLanguage } from '../types';

/**
 * Strips markdown formatting for clean, natural speech synthesis
 */
export function cleanMarkdownForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italics
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url) -> ''
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Remove bullet points / list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, '')
    // Replace citations like [1], (p. 12)
    .replace(/\[\d+\]|\(p\.\s*\d+(?:-\d+)?\)/gi, '')
    // Replace multiple newlines or spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the best available voice for the target language or text script
 */
export function getBestVoice(language: SupportedLanguage, isDevanagari: boolean): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const qualityKeywords = ['natural', 'neural', 'google', 'online', 'female', 'swara', 'neerja', 'aria'];

  let preferredLangs: string[] = ['en-IN', 'en-US', 'en-GB'];
  if (isDevanagari) {
    preferredLangs = language === 'Marathi' ? ['mr-IN', 'mr', 'hi-IN', 'hi'] : ['hi-IN', 'hi', 'mr-IN', 'mr'];
  } else if (language === 'Hindi' || language === 'Hinglish') {
    preferredLangs = ['hi-IN', 'hi', 'en-IN', 'en-US'];
  } else if (language === 'Marathi') {
    preferredLangs = ['mr-IN', 'mr', 'hi-IN', 'en-IN'];
  }

  // 1. Try matching preferred languages with quality keywords
  for (const lang of preferredLangs) {
    const match = voices.find(v => 
      v.lang.toLowerCase().replace('_', '-').startsWith(lang.toLowerCase()) &&
      qualityKeywords.some(kw => v.name.toLowerCase().includes(kw))
    );
    if (match) return match;
  }

  // 2. Try matching preferred languages with any available voice
  for (const lang of preferredLangs) {
    const match = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(lang.toLowerCase()));
    if (match) return match;
  }

  // 3. Fallback to default system voice
  return voices.find(v => v.lang.startsWith('en')) || voices.find(v => v.default) || voices[0] || null;
}

let activeSpeechToken: number = 0;

export function speakText(
  text: string,
  language: SupportedLanguage,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  const syn = window.speechSynthesis;
  syn.cancel();

  // Create unique token for active speech session
  const currentToken = ++activeSpeechToken;

  const cleanText = cleanMarkdownForSpeech(text);
  if (!cleanText) {
    onEnd?.();
    return;
  }

  // Split into natural sentences to bypass Chrome long-text cutoff bugs
  const sentences = cleanText
    .match(/[^.!?\n]+[.!?\n]+/g) || [cleanText];

  let currentIndex = 0;

  const speakNextSentence = () => {
    // If a new speak request started, discard previous queue
    if (currentToken !== activeSpeechToken) {
      return;
    }

    if (currentIndex >= sentences.length) {
      onEnd?.();
      return;
    }

    const sentenceText = sentences[currentIndex].trim();
    if (!sentenceText) {
      currentIndex++;
      speakNextSentence();
      return;
    }

    const isDevanagari = /[\u0900-\u097F]/.test(sentenceText);
    const utterance = new SpeechSynthesisUtterance(sentenceText);

    const voice = getBestVoice(language, isDevanagari);
    if (voice) {
      utterance.voice = voice;
    } else {
      utterance.lang = isDevanagari ? 'hi-IN' : 'en-US';
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (currentIndex === 0) {
      onStart?.();
    }

    utterance.onend = () => {
      if (currentToken === activeSpeechToken) {
        currentIndex++;
        speakNextSentence();
      }
    };

    utterance.onerror = (e) => {
      console.warn('Utterance error:', e);
      if (currentToken === activeSpeechToken) {
        currentIndex++;
        speakNextSentence();
      }
    };

    if (syn.paused) {
      syn.resume();
    }
    syn.speak(utterance);
  };

  const availableVoices = syn.getVoices();
  if (availableVoices.length === 0) {
    syn.onvoiceschanged = () => {
      if (currentToken === activeSpeechToken) {
        speakNextSentence();
      }
    };
  } else {
    speakNextSentence();
  }
}

export function stopSpeaking(): void {
  activeSpeechToken++;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
