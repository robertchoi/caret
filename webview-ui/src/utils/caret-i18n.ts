// 글로벌 다국어/국제화 유틸 - Caret Overlay 버전 (react-i18next 제거)

// Simple static translations for Caret
const translations = {
  ko: {
    common: {
      greeting: "안녕하세요! Caret에 오신 것을 환영합니다! ",
      catchPhrase: "AI와 함께하는 스마트한 코딩 경험을 시작해보세요",
    },
    welcome: {
      'coreFeatures.header': '핵심 기능',
      'coreFeatures.description': 'Caret은 개발자를 위한 강력한 AI 코딩 어시스턴트입니다.',
      'educationOffer.header': '교육 프로그램',
      'educationOffer.body': 'AI 코딩에 대해 더 배우고 싶으신가요? 저희 교육 프로그램을 확인해보세요!',
    }
  },
  en: {
    common: {
      greeting: "Welcome to Caret! ",
      catchPhrase: "Start your smart coding experience with AI",
    },
    welcome: {
      'coreFeatures.header': 'Core Features',
      'coreFeatures.description': 'Caret is a powerful AI coding assistant for developers.',
      'educationOffer.header': 'Education Program',
      'educationOffer.body': 'Want to learn more about AI coding? Check out our education program!',
    }
  }
};

// Simple translation function
export const t = (key: string, namespace: string = 'common'): string => {
  const currentLang = 'ko'; // Default to Korean for Caret
  const namespaceData = translations[currentLang as keyof typeof translations]?.[namespace as keyof typeof translations['ko']];
  
  if (namespaceData && key in namespaceData) {
    return namespaceData[key as keyof typeof namespaceData] as string;
  }
  
  // Fallback to English
  const enNamespaceData = translations.en[namespace as keyof typeof translations['en']];
  if (enNamespaceData && key in enNamespaceData) {
    return enNamespaceData[key as keyof typeof enNamespaceData] as string;
  }
  
  // Last fallback - return the key itself
  return key;
};

// Export as default for compatibility
export default { t };

// 필요한 경우 여기서 언어 관련 util 함수 추가 가능
