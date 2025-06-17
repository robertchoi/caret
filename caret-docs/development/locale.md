# 다국어 지원 가이드

## 1. 개요

이 문서는 Caret의 다국어 지원 시스템을 설명합니다. 한국어와 영어를 기본으로 하며, 필요한 경우 다른 언어를 추가할 수 있습니다.

## 2. 구조

### 2.1 파일 구조
```
caret-webview-ui/
  ├── src/
  │   ├── locale/
  │   │   ├── ko/
  │   │   │   ├── common.json
  │   │   │   ├── settings.json
  │   │   │   └── errors.json
  │   │   └── en/
  │   │       ├── common.json
  │   │       ├── settings.json
  │   │       └── errors.json
  │   └── utils/
  │       └── i18n.ts
```

### 2.2 번역 파일 구조
```json
{
  "common": {
    "save": "저장",
    "cancel": "취소",
    "error": "오류"
  },
  "settings": {
    "title": "설정",
    "language": "언어"
  }
}
```

## 3. 사용 방법

### 3.1 i18n 유틸리티
```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 리소스 로드
const resources = {
  ko: {
    common: require('./ko/common.json'),
    settings: require('./ko/settings.json'),
    errors: require('./ko/errors.json')
  },
  en: {
    common: require('./en/common.json'),
    settings: require('./en/settings.json'),
    errors: require('./en/errors.json')
  }
};

// i18n 초기화
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### 3.2 컴포넌트에서 사용
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('settings.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

## 4. 언어 전환

### 4.1 언어 설정
```typescript
// 언어 변경 함수
const changeLanguage = (lng: string): void => {
  i18n.changeLanguage(lng);
  // 설정 저장
  vscode.postMessage({
    type: 'updateConfig',
    config: { language: lng }
  });
};
```

### 4.2 언어 선택 UI
```typescript
const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
    >
      <option value="ko">한국어</option>
      <option value="en">English</option>
    </select>
  );
};
```

## 5. 번역 관리

### 5.1 번역 추가
1. 해당 언어의 JSON 파일에 번역 추가
2. 키는 영문으로 작성
3. 계층 구조 유지

### 5.2 번역 검증
```typescript
// 필수 번역 키 검증
function validateTranslations(translations: any, requiredKeys: string[]): boolean {
  return requiredKeys.every(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], translations);
    return value !== undefined;
  });
}
```

## 6. 모범 사례

### 6.1 번역 키 관리
- 의미 있는 키 이름 사용
- 계층 구조 활용
- 중복 방지

### 6.2 동적 콘텐츠
```typescript
// 변수 사용
t('welcome', { name: 'User' })

// 복수형
t('items', { count: 2 })
```

### 6.3 포맷팅
```typescript
// 날짜 포맷팅
t('date', { date: new Date() })

// 숫자 포맷팅
t('price', { price: 1000 })
```

## 7. 업데이트 기록
- 2024-03-21: 초기 문서 작성
- 2024-03-21: 번역 파일 구조 추가
- 2024-03-21: 사용 예제 추가
- 2024-03-21: 모범 사례 추가
