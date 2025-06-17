// 글로벌 다국어/국제화 유틸 - Caret 전용 버전 (JSON 파일 기반)

import koWelcome from '../locale/ko/welcome.json';
import enWelcome from '../locale/en/welcome.json';

// JSON 파일에서 번역 데이터 로드
const translations = {
  ko: {
    common: {
      greeting: koWelcome.greeting,
      catchPhrase: koWelcome.catchPhrase,
    },
    welcome: koWelcome
  },
  en: {
    common: {
      greeting: enWelcome.greeting,
      catchPhrase: enWelcome.catchPhrase,
    },
    welcome: enWelcome
  }
};

// Helper function to get nested value using dot notation
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Simple translation function with dot notation support
export const t = (key: string, namespace: string = 'common'): string => {
  const currentLang = 'ko'; // Default to Korean for Caret
  const namespaceData = translations[currentLang as keyof typeof translations]?.[namespace as keyof typeof translations['ko']];
  
  if (namespaceData) {
    const value = getNestedValue(namespaceData, key);
    if (value) {
      return value;
    }
  }
  
  // Fallback to English
  const enNamespaceData = translations.en[namespace as keyof typeof translations['en']];
  if (enNamespaceData) {
    const value = getNestedValue(enNamespaceData, key);
    if (value) {
      return value;
    }
  }
  
  // Last fallback - return the key itself
  return key;
};

// Export as default for compatibility
export default { t };

// 필요한 경우 여기서 언어 관련 util 함수 추가 가능
