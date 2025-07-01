# Task #005: responses.ts 다국어 지원 (i18n) 구현

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 📋 **Medium - 사용자 경험 개선**  
**예상 시간**: 2-3시간  
**상태**: 📋 **예정**  

## 🎯 **목표: AI 응답 메시지의 다국어 지원 구현**

### **핵심 목적**
- **다국어 지원**: AI → 사용자 메시지의 한국어/영어 다국어 지원
- **i18n 시스템 구축**: 국제화 기반 메시지 템플릿 관리
- **단순화된 접근**: JSON 복잡 시스템 대신 표준 i18n 라이브러리 활용
- **사용자 경험 개선**: 현지화된 메시지로 접근성 향상
- **🔄 Cline/Caret 모드 지원**: 모드별 다른 메시지 톤 적용

### **🎯 responses.ts 현황 분석**

#### **현재 구조 (44개 메시지 함수)**
```typescript
// src/core/prompts/responses.ts
export const formatResponse = {
  // 사용자 피드백 메시지
  duplicateFileReadNotice: () => `[[NOTE] 이 파일은 이미 최근에 읽었습니다...]`,
  contextTruncationNotice: () => `[NOTE] 이전 대화 기록이 일부 제거되었습니다...]`,
  
  // 도구 관련 메시지
  toolDenied: () => `사용자가 이 작업을 거부했습니다.`,
  toolError: (error: string) => `도구 실행이 실패했습니다: ${error}`,
  noToolsUsed: () => `도구를 사용하지 않았습니다! 도구를 사용해서 다시 시도하세요`,
  
  // 작업 관리 메시지
  taskResumption: (task: string, timeAgo: string, cwd: string) => 
    `작업이 ${timeAgo}에 중단되었습니다. 프로젝트 상태가 변경되었을 수 있습니다...`,
  
  // ... 44개 메시지 함수 총합
}
```

#### **변환 대상 메시지 카테고리**
```typescript
📋 메시지 분류:
├── 🔧 도구 관련 (15개)
│   ├── toolDenied, toolError, noToolsUsed
│   ├── fileReadNotice, contextTruncation
│   └── toolUsageValidation
├── 📝 작업 관리 (12개)
│   ├── taskResumption, taskCompletion
│   ├── workflowGuidance, progressUpdate
│   └── modeTransition
├── ❌ 오류 처리 (8개)
│   ├── errorRecovery, fallbackMode
│   ├── validationFailure, systemError
│   └── connectionIssue
├── 💬 상호작용 (6개)
│   ├── userInteraction, feedbackRequest
│   ├── clarificationNeeded, confirmationRequest
│   └── guidanceProvision
└── 🎯 시스템 상태 (3개)
    ├── systemStatus, performanceMetrics
    └── capabilityNotification
```

## 📋 **i18n 구현 계획**

### **Phase 1: i18n 시스템 설정 (30분)**

#### **1.1 i18next 라이브러리 설정**
```typescript
// caret-src/utils/i18n.ts
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

// 언어 리소스 임포트
import enResponses from '../locales/en/responses.json'
import koResponses from '../locales/ko/responses.json'

export const initI18n = async (language: 'en' | 'ko' = 'ko') => {
  await i18next
    .use(initReactI18next)
    .init({
      lng: language,
      fallbackLng: 'en',
      resources: {
        en: { responses: enResponses },
        ko: { responses: koResponses }
      },
      interpolation: {
        escapeValue: false
      }
    })
}

// 간편 사용 함수
export const t = (key: string, options?: any) => {
  return i18next.t(`responses.${key}`, options)
}
```

#### **1.2 언어팩 디렉터리 구조**
```typescript
📁 caret-src/locales/
├── en/
│   └── responses.json - 영어 메시지
├── ko/
│   └── responses.json - 한국어 메시지
└── index.ts - 언어팩 관리
```

### **Phase 2: 언어팩 생성 (1시간)**

#### **2.1 한국어 언어팩 (ko/responses.json)**
```json
{
  "tool": {
    "denied": "사용자가 이 작업을 거부했습니다.",
    "error": "도구 실행이 실패했습니다: {{error}}",
    "no_tools_used": "도구를 사용하지 않았습니다! 도구를 사용해서 다시 시도하세요",
    "file_read_notice": "[[NOTE] 이 파일은 이미 최근에 읽었습니다: {{filename}}]",
    "context_truncation": "[NOTE] 이전 대화 기록이 일부 제거되었습니다 ({{removedCount}}개 메시지)]"
  },
  "task": {
    "resumption": "작업이 {{timeAgo}}에 중단되었습니다. 프로젝트 상태가 변경되었을 수 있습니다 ({{cwd}})",
    "completion": "작업이 성공적으로 완료되었습니다. {{summary}}",
    "workflow_guidance": "다음 단계를 진행하세요: {{nextStep}}",
    "progress_update": "진행률: {{progress}}% ({{completed}}/{{total}})"
  },
  "error": {
    "recovery": "오류가 발생했지만 복구 중입니다. {{details}}",
    "fallback_mode": "기본 모드로 전환됩니다. {{reason}}",
    "validation_failure": "유효성 검사 실패: {{issue}}",
    "system_error": "시스템 오류: {{error}}"
  },
  "interaction": {
    "user_feedback": "사용자 피드백이 필요합니다: {{question}}",
    "clarification_needed": "명확한 설명이 필요합니다: {{context}}",
    "confirmation_request": "계속 진행하시겠습니까? {{action}}",
    "guidance_provision": "도움말: {{guidance}}"
  },
  "mode": {
    "cline": {
      "prefix": "[CLINE]",
      "tone": "formal",
      "style": "direct"
    },
    "caret": {
      "prefix": "[CARET]",
      "tone": "friendly",
      "style": "collaborative"
    }
  }
}
```

#### **2.2 영어 언어팩 (en/responses.json)**
```json
{
  "tool": {
    "denied": "The user denied this operation.",
    "error": "Tool execution failed with error: {{error}}",
    "no_tools_used": "No tools were used! Please try again using tools",
    "file_read_notice": "[[NOTE] This file was already read recently: {{filename}}]",
    "context_truncation": "[NOTE] Previous conversation history was truncated ({{removedCount}} messages removed)]"
  },
  "task": {
    "resumption": "Task was interrupted {{timeAgo}}. Project state may have changed ({{cwd}})",
    "completion": "Task completed successfully. {{summary}}",
    "workflow_guidance": "Please proceed with: {{nextStep}}",
    "progress_update": "Progress: {{progress}}% ({{completed}}/{{total}})"
  },
  "error": {
    "recovery": "Error occurred but recovering. {{details}}",
    "fallback_mode": "Switching to fallback mode. {{reason}}",
    "validation_failure": "Validation failed: {{issue}}",
    "system_error": "System error: {{error}}"
  },
  "interaction": {
    "user_feedback": "User feedback needed: {{question}}",
    "clarification_needed": "Clarification needed: {{context}}",
    "confirmation_request": "Do you want to continue? {{action}}",
    "guidance_provision": "Guidance: {{guidance}}"
  },
  "mode": {
    "cline": {
      "prefix": "[CLINE]",
      "tone": "formal",
      "style": "direct"
    },
    "caret": {
      "prefix": "[CARET]",
      "tone": "friendly", 
      "style": "collaborative"
    }
  }
}
```

### **Phase 3: CaretResponses 클래스 구현 (1시간)**

#### **3.1 다국어 응답 클래스**
```typescript
// caret-src/core/prompts/CaretResponses.ts
import { t, initI18n } from '../../utils/i18n'

export class CaretResponses {
  private currentMode: 'cline' | 'caret'
  private currentLanguage: 'en' | 'ko'

  constructor(mode: 'cline' | 'caret' = 'caret', language: 'en' | 'ko' = 'ko') {
    this.currentMode = mode
    this.currentLanguage = language
    this.initializeI18n()
  }

  private async initializeI18n() {
    await initI18n(this.currentLanguage)
  }

  private applyModeFormatting(message: string): string {
    const modeConfig = t(`mode.${this.currentMode}`, { returnObjects: true }) as any
    
    if (modeConfig.prefix) {
      message = `${modeConfig.prefix} ${message}`
    }

    // 모드별 톤 적용
    if (this.currentMode === 'caret' && modeConfig.tone === 'friendly') {
      // Caret 모드: 친근한 톤 적용
      message = message.replace(/\. /g, '~ ')
    }

    return message
  }

  // 도구 관련 메시지
  toolDenied(): string {
    const message = t('tool.denied')
    return this.applyModeFormatting(message)
  }

  toolError(error: string): string {
    const message = t('tool.error', { error })
    return this.applyModeFormatting(message)
  }

  noToolsUsed(): string {
    const message = t('tool.no_tools_used')
    return this.applyModeFormatting(message)
  }

  duplicateFileReadNotice(filename: string): string {
    const message = t('tool.file_read_notice', { filename })
    return this.applyModeFormatting(message)
  }

  contextTruncationNotice(removedCount: number): string {
    const message = t('tool.context_truncation', { removedCount })
    return this.applyModeFormatting(message)
  }

  // 작업 관리 메시지
  taskResumption(task: string, timeAgo: string, cwd: string): string {
    const message = t('task.resumption', { task, timeAgo, cwd })
    return this.applyModeFormatting(message)
  }

  taskCompletion(summary: string): string {
    const message = t('task.completion', { summary })
    return this.applyModeFormatting(message)
  }

  workflowGuidance(nextStep: string): string {
    const message = t('task.workflow_guidance', { nextStep })
    return this.applyModeFormatting(message)
  }

  progressUpdate(progress: number, completed: number, total: number): string {
    const message = t('task.progress_update', { progress, completed, total })
    return this.applyModeFormatting(message)
  }

  // 오류 처리 메시지
  errorRecovery(details: string): string {
    const message = t('error.recovery', { details })
    return this.applyModeFormatting(message)
  }

  fallbackMode(reason: string): string {
    const message = t('error.fallback_mode', { reason })
    return this.applyModeFormatting(message)
  }

  validationFailure(issue: string): string {
    const message = t('error.validation_failure', { issue })
    return this.applyModeFormatting(message)
  }

  systemError(error: string): string {
    const message = t('error.system_error', { error })
    return this.applyModeFormatting(message)
  }

  // 상호작용 메시지
  userFeedback(question: string): string {
    const message = t('interaction.user_feedback', { question })
    return this.applyModeFormatting(message)
  }

  clarificationNeeded(context: string): string {
    const message = t('interaction.clarification_needed', { context })
    return this.applyModeFormatting(message)
  }

  confirmationRequest(action: string): string {
    const message = t('interaction.confirmation_request', { action })
    return this.applyModeFormatting(message)
  }

  guidanceProvision(guidance: string): string {
    const message = t('interaction.guidance_provision', { guidance })
    return this.applyModeFormatting(message)
  }

  // 언어 변경
  async changeLanguage(language: 'en' | 'ko'): Promise<void> {
    this.currentLanguage = language
    await this.initializeI18n()
  }

  // 모드 변경
  changeMode(mode: 'cline' | 'caret'): void {
    this.currentMode = mode
  }
}
```

### **Phase 4: 점진적 래퍼 적용 (30분)**

#### **4.1 기존 responses.ts 수정**
```typescript
// src/core/prompts/responses.ts - 점진적 i18n 적용
import { CaretResponses } from '../../../caret-src/core/prompts/CaretResponses'

// CARET MODIFICATION: 다국어 지원 시스템 통합
let caretResponses: CaretResponses | null = null

// 기존 함수들을 래퍼로 변환
export const formatResponse = {
  toolDenied: (): string => {
    const original = `사용자가 이 작업을 거부했습니다.`
    
    try {
      if (!caretResponses) {
        const mode = (global as any).caretMode || 'cline'
        const language = (global as any).caretLanguage || 'ko'
        caretResponses = new CaretResponses(mode, language)
      }
      
      return caretResponses.toolDenied()
    } catch (error) {
      console.warn('[CARET] i18n response failed, using original:', error)
      return original
    }
  },

  toolError: (error: string): string => {
    const original = `도구 실행이 실패했습니다: ${error}`
    
    try {
      if (!caretResponses) {
        const mode = (global as any).caretMode || 'cline'
        const language = (global as any).caretLanguage || 'ko'
        caretResponses = new CaretResponses(mode, language)
      }
      
      return caretResponses.toolError(error)
    } catch (error) {
      console.warn('[CARET] i18n response failed, using original:', error)
      return original
    }
  },

  noToolsUsed: (): string => {
    const original = `도구를 사용하지 않았습니다! 도구를 사용해서 다시 시도하세요`
    
    try {
      if (!caretResponses) {
        const mode = (global as any).caretMode || 'cline'
        const language = (global as any).caretLanguage || 'ko'
        caretResponses = new CaretResponses(mode, language)
      }
      
      return caretResponses.noToolsUsed()
    } catch (error) {
      console.warn('[CARET] i18n response failed, using original:', error)
      return original
    }
  },

  duplicateFileReadNotice: (filename: string): string => {
    const original = `[[NOTE] 이 파일은 이미 최근에 읽었습니다: ${filename}]`
    
    try {
      if (!caretResponses) {
        const mode = (global as any).caretMode || 'cline'
        const language = (global as any).caretLanguage || 'ko'
        caretResponses = new CaretResponses(mode, language)
      }
      
      return caretResponses.duplicateFileReadNotice(filename)
    } catch (error) {
      console.warn('[CARET] i18n response failed, using original:', error)
      return original
    }
  },

  // ... 나머지 44개 함수들도 동일한 패턴으로 래퍼 적용
}
```

### **Phase 5: 언어 설정 UI 통합 (30분)**

#### **5.1 언어 설정 관리**
```typescript
// caret-src/core/config/LanguageConfig.ts
export class LanguageConfig {
  private static instance: LanguageConfig
  private currentLanguage: 'en' | 'ko' = 'ko'
  private currentMode: 'cline' | 'caret' = 'caret'

  static getInstance(): LanguageConfig {
    if (!LanguageConfig.instance) {
      LanguageConfig.instance = new LanguageConfig()
    }
    return LanguageConfig.instance
  }

  setLanguage(language: 'en' | 'ko'): void {
    this.currentLanguage = language
    ;(global as any).caretLanguage = language
  }

  setMode(mode: 'cline' | 'caret'): void {
    this.currentMode = mode
    ;(global as any).caretMode = mode
  }

  getLanguage(): 'en' | 'ko' {
    return this.currentLanguage
  }

  getMode(): 'cline' | 'caret' {
    return this.currentMode
  }
}
```

#### **5.2 WebView 언어 설정 (간단한 구현)**
```typescript
// webview-ui/src/caret/components/LanguageSelector.tsx
import React from 'react'
import { vscode } from '../utils/vscode'

export const LanguageSelector: React.FC = () => {
  const [language, setLanguage] = React.useState<'en' | 'ko'>('ko')
  const [mode, setMode] = React.useState<'cline' | 'caret'>('caret')

  const handleLanguageChange = (newLanguage: 'en' | 'ko') => {
    setLanguage(newLanguage)
    vscode.postMessage({
      type: 'changeLanguage',
      payload: { language: newLanguage }
    })
  }

  const handleModeChange = (newMode: 'cline' | 'caret') => {
    setMode(newMode)
    vscode.postMessage({
      type: 'changeMode',
      payload: { mode: newMode }
    })
  }

  return (
    <div className="language-selector">
      <div className="language-options">
        <button 
          onClick={() => handleLanguageChange('ko')}
          className={language === 'ko' ? 'active' : ''}
        >
          한국어
        </button>
        <button 
          onClick={() => handleLanguageChange('en')}
          className={language === 'en' ? 'active' : ''}
        >
          English
        </button>
      </div>
      
      <div className="mode-options">
        <button 
          onClick={() => handleModeChange('caret')}
          className={mode === 'caret' ? 'active' : ''}
        >
          Caret Mode
        </button>
        <button 
          onClick={() => handleModeChange('cline')}
          className={mode === 'cline' ? 'active' : ''}
        >
          Cline Mode
        </button>
      </div>
    </div>
  )
}
```

## 🎯 **Cline/Caret 모드별 차이점**

### **메시지 톤 차이**
```typescript
// Cline 모드 - 정형적, 직접적
"[CLINE] 사용자가 이 작업을 거부했습니다."
"[CLINE] 도구 실행이 실패했습니다: 파일을 찾을 수 없음"

// Caret 모드 - 친근한, 협력적
"[CARET] 사용자가 이 작업을 거부했어요~"
"[CARET] 도구 실행이 실패했어요: 파일을 찾을 수 없음"
```

### **상호작용 스타일 차이**
```typescript
// Cline 모드
"Do you want to continue? Delete file: important.txt"

// Caret 모드  
"계속 진행하시겠어요? 파일을 삭제하려고 해요: important.txt"
```

## 📊 **검증 및 품질 보장**

### **✅ 성공 기준**
- [ ] **44개 메시지 함수 i18n 적용**: 모든 응답 메시지 다국어 지원
- [ ] **한국어/영어 언어팩 완성**: 완전한 번역 및 현지화
- [ ] **Cline/Caret 모드별 톤 적용**: 모드별 다른 메시지 스타일
- [ ] **점진적 호환성**: 기존 코드 100% 동작 보장 (fallback)
- [ ] **언어 설정 UI**: 사용자가 쉽게 언어 변경 가능
- [ ] **성능 최적화**: 언어팩 캐싱으로 빠른 응답

## 🚀 **다음 단계 연결**

### **003-10 준비사항**
✅ **완료될 결과물**:
- 완전한 다국어 지원 시스템
- Cline/Caret 모드별 메시지 톤 차별화
- 사용자 친화적인 언어 설정 UI
- 44개 메시지의 완전한 i18n 적용

📋 **003-10에서 할 일**:
- Cline vs Caret 성능 비교 시스템 구축
- 토큰 사용량, 응답 품질, 사용자 만족도 비교
- 최적화 방향 결정을 위한 데이터 수집

### **최종 목표**
- **완전한 다국어 지원**: 한국어/영어 사용자 모두를 위한 현지화
- **모드별 차별화**: Cline/Caret 각각에 최적화된 메시지 경험
- **사용자 중심 설계**: 쉬운 언어 변경 및 모드 전환
- **확장 가능한 구조**: 추가 언어 지원 용이

**🎯 핵심 목적: 사용자 경험 개선을 통한 Caret의 접근성 및 사용성 향상!** ✨ 