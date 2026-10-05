export interface ApiSettings {
  geminiApiKey: string;
}

const STORAGE_KEY = 'studyvoice_gemini_key';

export const getStoredApiSettings = (): ApiSettings => {
  try {
    const key = localStorage.getItem(STORAGE_KEY) || '';
    return { geminiApiKey: key };
  } catch {
    return { geminiApiKey: '' };
  }
};

export const saveApiSettings = (settings: ApiSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, settings.geminiApiKey.trim());
  } catch (e) {
    console.error('Failed to save Gemini key', e);
  }
};

export const getApiHeaders = (): Record<string, string> => {
  const settings = getStoredApiSettings();
  const headers: Record<string, string> = {};
  if (settings.geminiApiKey.trim()) {
    headers['X-Gemini-Key'] = settings.geminiApiKey.trim();
  }
  return headers;
};
