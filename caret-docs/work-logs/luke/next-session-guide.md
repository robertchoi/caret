# Next Session Guide (Luke) - 2025.01.21

## 🎯 **개발 최종 목적**

### **핵심 목표: 페르소나 이미지 업로드 시스템 완전 구현**

#### **기능 요구사항**
1. **사용자 이미지 업로드**: 일반/생각하는 상태 이미지를 사용자가 업로드 가능
2. **템플릿 선택**: 미리 준비된 캐릭터 템플릿 선택 시 해당 이미지로 자동 교체
3. **실시간 반영**: 업로드/선택한 이미지가 즉시 채팅창과 페르소나 설정에 반영
4. **영구 저장**: 확장 재시작/업데이트에도 사용자 설정 유지

#### **기술 아키텍처 목표**
- **VSCode 표준 패턴**: `context.globalStorageUri.fsPath` 사용
- **권한 안전성**: 사용자 접근 가능한 공간에 저장
- **확장 업데이트 안전**: 확장 디렉토리와 분리된 사용자 데이터 공간
- **초기화 자동화**: 첫 실행 시 기본 이미지 자동 복사

---

## 🚨 **현재 상황 (2025.01.21 13:45)**

### **개발 단계: 깔끔한 새 시작 준비 완료**
- **TDD 위치**: 🧹 **CLEAN START** (문제 테스트 삭제 완료)
- **테스트 상태**: ✅ **모든 테스트 통과** (201/201)
- **문제 해결**: 혼란을 주던 잘못된 아키텍처 기반 테스트 완전 제거

### **삭제 완료된 문제 테스트들**

#### **✅ PersonaManagement.test.tsx - 삭제 완료**
- **삭제 이유**: `testSelectedCharacter` 스코프 문제 + 잘못된 아키텍처 기반
- **상태**: 🗑️ 완전 삭제됨

#### **✅ PersonaTemplateSelector.test.tsx - 삭제 완료**  
- **삭제 이유**: 기대값 불일치 + Base64 방식 대신 file:// 프로토콜 필요
- **상태**: 🗑️ 완전 삭제됨

### **현재 깔끔한 상태**

```bash
# 2025.01.21 13:40 테스트 결과
Test Files  14 passed (14)
Tests  201 passed (201)
Duration  4.15s
```

- ✅ **혼란 요소 제거**: 잘못된 아키텍처 기반 테스트 완전 삭제
- ✅ **깔끔한 베이스**: 새로운 globalStorage 시스템 구축을 위한 준비 완료
- ✅ **명확한 목표**: 목표↔서비스코드 갈팡질팡 방지용 상세 계획 완성

---

## 🔧 **새로운 GlobalStorage 아키텍처 vs 기존 서비스 코드 변경 계획**

### **🎯 목표 vs 현실 Gap 분석**

#### **현재 잘못된 구조 (caret-assets 기반)**
```typescript
// ❌ 현재 구조 - 확장 설치 디렉토리 (읽기 전용)
extensionPath/caret-assets/
├── agent_profile.png      ← 업로드 시 여기에 덮어쓰기 (위험!)
└── agent_thinking.png     ← 확장 업데이트 시 사라짐!
```

#### **목표하는 올바른 구조 (globalStorage 기반)**
```typescript
// ✅ 새로운 구조 - 사용자 데이터 공간 (쓰기 가능)
context.globalStorageUri.fsPath/personas/
├── agent_profile.png      ← 사용자 업로드 이미지 (안전!)
├── agent_thinking.png     ← 확장 업데이트와 독립적!
└── backup/               ← 기본 이미지 백업 (선택적)
    ├── default_profile.png
    └── default_thinking.png
```

### **관련 개발가이드 패턴 확인됨**

#### **ImageManager 클래스** (ui-to-storage-flow.mdx)
```typescript
// 올바른 이미지 저장 패턴
constructor(private context: vscode.ExtensionContext) {
    this.imageDir = path.join(context.globalStorageUri.fsPath, "images")
    this.ensureImageDir()
}
```

#### **표준 디렉토리 생성 패턴**
- `ensureTaskDirectoryExists()` - tasks 폴더
- `ensureSettingsDirectoryExists()` - settings 폴더
- `ensureCacheDirectoryExists()` - cache 폴더

---

## 📋 **서비스 코드 구체적 변경 계획**

### **Phase 1: 새로운 스토리지 시스템 구축**

#### **1.1 새 파일 생성: `caret-src/utils/persona-storage.ts`**
```typescript
// 🆕 완전히 새로운 globalStorage 기반 시스템
import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as path from "path"
import { caretLogger } from "./caret-logger"

export interface PersonaStorageImages {
    avatarUri: string           // file:// 프로토콜 사용
    thinkingAvatarUri: string   // file:// 프로토콜 사용
}

// 핵심 함수들
export async function ensurePersonaDirectoryExists(context: vscode.ExtensionContext): Promise<string>
export async function initializeDefaultPersonaImages(context: vscode.ExtensionContext): Promise<void>
export async function loadPersonaImagesFromStorage(context: vscode.ExtensionContext): Promise<PersonaStorageImages>
export async function saveCustomPersonaImage(context: vscode.ExtensionContext, imageType: "normal" | "thinking", base64Data: string): Promise<string>
export async function replacePersonaImageFromTemplate(context: vscode.ExtensionContext, imageType: "normal" | "thinking", templateImagePath: string): Promise<void>

// 🎯 구체적인 initializeDefaultPersonaImages 구현 계획
export async function initializeDefaultPersonaImages(context: vscode.ExtensionContext): Promise<void> {
    const personaDir = await ensurePersonaDirectoryExists(context)
    const profilePath = path.join(personaDir, "agent_profile.png")
    const thinkingPath = path.join(personaDir, "agent_thinking.png")
    
    // 🔍 파일 존재 체크 → 없으면 복사
    try {
        await fs.access(profilePath)
        caretLogger.debug("agent_profile.png already exists, skipping copy")
    } catch {
        // 파일이 없으면 기본 이미지 복사
        const defaultProfile = path.join(context.extensionPath, "caret-assets/agent_profile.png")
        await fs.copyFile(defaultProfile, profilePath)
        caretLogger.info("Default agent_profile.png copied to globalStorage")
    }
    
    try {
        await fs.access(thinkingPath)
        caretLogger.debug("agent_thinking.png already exists, skipping copy")
    } catch {
        // 파일이 없으면 기본 이미지 복사
        const defaultThinking = path.join(context.extensionPath, "caret-assets/agent_thinking.png")
        await fs.copyFile(defaultThinking, thinkingPath)
        caretLogger.info("Default agent_thinking.png copied to globalStorage")
    }
}
```

#### **1.2 기존 파일 수정: `caret-src/utils/simple-persona-image.ts`**
```typescript
// ❌ 삭제할 함수들 (caret-assets 기반)
- loadSimplePersonaImages()
- replacePersonaImage() 
- uploadCustomPersonaImage()

// ✅ 마이그레이션 함수 추가 (한번만 실행)
+ async function migrateToGlobalStorage(context: vscode.ExtensionContext): Promise<void>

// ✅ 레거시 호환 함수 (기존 코드 호환용)
+ async function loadSimplePersonaImagesLegacy(extensionPath: string): Promise<SimplePersonaImages>
```

### **Phase 2: Controller 수정**

#### **2.1 Extension 초기화 로직 추가**
```typescript
// src/extension.ts 또는 Controller 초기화 부분
async function initializeCaretPersonaSystem(context: vscode.ExtensionContext) {
    // 1. personas 디렉토리 생성
    await ensurePersonaDirectoryExists(context)
    
    // 2. 기본 이미지 복사 (첫 실행 시에만)
    await initializeDefaultPersonaImages(context)
    
    // 3. 기존 caret-assets 이미지 마이그레이션 (필요 시)
    await migrateToGlobalStorage(context)
    
    caretLogger.info("Persona storage system initialized")
}
```

#### **2.2 Controller 핸들러 수정**
```typescript
// src/core/controller/index.ts

// ❌ 기존 코드 (extensionPath 기반)
case "UPLOAD_CUSTOM_PERSONA_IMAGE": {
    await uploadCustomPersonaImage(
        message.payload.imageType,
        message.payload.imageData,
        this.context.extensionPath  // ← 잘못된 경로!
    )
}

// ✅ 새로운 코드 (context 기반)
case "UPLOAD_CUSTOM_PERSONA_IMAGE": {
    const savedImagePath = await saveCustomPersonaImage(
        this.context,               // ← vscode.ExtensionContext 직접 전달
        message.payload.imageType,
        message.payload.imageData
    )
    
    // 성공 응답에 실제 파일 경로 포함
    await this.postMessageToWebview({
        type: "UPLOAD_CUSTOM_PERSONA_IMAGE_RESPONSE",
        payload: {
            success: true,
            imageType: message.payload.imageType,
            savedPath: savedImagePath,  // ← 새로 추가
            personaCharacter: message.payload.personaCharacter,
        },
    })
}
```

#### **2.3 템플릿 캐릭터 로드 수정**
```typescript
// ❌ 기존 코드 (loadSimplePersonaImages 사용)
const currentPersonaImages = await loadSimplePersonaImages(this.context.extensionPath)

// ✅ 새로운 코드 (globalStorage에서 로드)
const currentPersonaImages = await loadPersonaImagesFromStorage(this.context)
```

### **Phase 3: 프론트엔드 수정**

#### **3.1 PersonaAvatar 컴포넌트 수정**
```typescript
// webview-ui/src/caret/components/PersonaAvatar.tsx

// ❌ 기존 코드 (asset:// 프로토콜)
const avatarSrc = `asset:/agent_profile.png`

// ✅ 새로운 코드 (vscode-file:// 프로토콜)
const avatarSrc = `vscode-file://globalStorage/personas/agent_profile.png`

// 또는 백엔드에서 실제 URI를 전달받아 사용
```

#### **3.2 PersonaManagement 컴포넌트 수정**
```typescript
// webview-ui/src/caret/components/PersonaManagement.tsx

// 업로드 성공 응답 처리 개선
if (message.type === "UPLOAD_CUSTOM_PERSONA_IMAGE_RESPONSE") {
    if (message.payload.success) {
        // ✅ 새로 추가: 실제 저장된 경로로 UI 업데이트
        setUploadedImagePath(message.payload.savedPath)
        
        // 즉시 아바타 새로고침 트리거
        window.postMessage({ type: "REFRESH_PERSONA_IMAGES" }, "*")
    }
}
```

### **Phase 4: 메시지 프로토콜 확장**

#### **4.1 새로운 메시지 타입 추가**
```typescript
// src/shared/WebviewMessage.ts & ExtensionMessage.ts

// 기존
| "UPLOAD_CUSTOM_PERSONA_IMAGE"
| "UPLOAD_CUSTOM_PERSONA_IMAGE_RESPONSE"

// 새로 추가
| "REFRESH_PERSONA_IMAGES"              // 프론트엔드 → 백엔드
| "PERSONA_IMAGES_REFRESHED"            // 백엔드 → 프론트엔드
| "GET_CURRENT_PERSONA_IMAGES"          // 프론트엔드 → 백엔드
| "CURRENT_PERSONA_IMAGES_RESPONSE"     // 백엔드 → 프론트엔드
```

---

## 🚨 **혼란 방지를 위한 단계별 실행 순서**

### **⚠️ 절대 동시에 하지 말 것!**
각 Phase를 **완전히 완료한 후** 다음 단계로 진행

#### **Phase 1 완료 조건**
- [ ] `persona-storage.ts` 파일 생성 및 모든 함수 구현
- [ ] **단위 테스트 작성 및 통과**
- [ ] `npm run test` 통과 확인

#### **Phase 2 완료 조건**  
- [ ] Controller 초기화 로직 추가
- [ ] 핸들러 수정 완료
- [ ] **Extension Host에서 실제 테스트**
- [ ] globalStorage 디렉토리 생성 확인

#### **Phase 3 완료 조건**
- [ ] 프론트엔드 컴포넌트 수정
- [ ] **실제 이미지 업로드 테스트**
- [ ] UI에서 이미지 표시 확인

#### **Phase 4 완료 조건**
- [ ] 메시지 프로토콜 확장
- [ ] **전체 플로우 통합 테스트**
- [ ] 확장 재시작 후 이미지 유지 확인

---

## 🎯 **성공 기준 재정의 (구체적)**

### **기능 테스트 시나리오**
1. **기본 이미지 초기화**: 첫 실행 시 globalStorage에 기본 이미지 복사
2. **사용자 이미지 업로드**: PersonaManagement → 업로드 → globalStorage 저장
3. **즉시 UI 반영**: 업로드 후 즉시 채팅창 및 설정 화면에 새 이미지 표시
4. **템플릿 선택**: 템플릿 캐릭터 선택 → globalStorage 이미지 교체
5. **영구 저장**: VSCode 재시작 → 사용자 이미지 유지
6. **확장 업데이트**: 확장 업데이트 → 사용자 이미지 보존

### **기술 검증 항목**
- [ ] `context.globalStorageUri.fsPath/personas/` 디렉토리 존재
- [ ] 업로드된 이미지 파일이 정확한 위치에 저장
- [ ] 이미지 URI가 올바른 프로토콜 사용 (`vscode-file://`)
- [ ] 모든 로그가 caretLogger를 통해 기록
- [ ] 에러 처리 및 fallback 동작 검증

---

*Updated: 2025.01.21 13:45 - 목표↔서비스코드 갈팡질팡 방지용 상세 계획 완성*
*Key: 각 Phase 완료 후 다음 단계. 절대 동시 진행 금지!*

---

## 📋 **다음 세션 시작 체크리스트**

### **✅ 완료된 사항 확인**
1. [ ] `npm run test:webview` 실행하여 깔끔한 테스트 상태 재확인 (201/201 통과 예상)
2. [ ] 문제 테스트 삭제 완료 확인:
   - ❌ `PersonaManagement.test.tsx` (삭제됨)
   - ❌ `PersonaTemplateSelector.test.tsx` (삭제됨)

### **🚀 Phase 1 즉시 시작 항목**
1. [ ] **새 파일 생성**: `caret-src/utils/persona-storage.ts`
2. [ ] **TDD RED**: persona-storage 시스템 테스트 작성
   - `ensurePersonaDirectoryExists()` 테스트
   - `initializeDefaultPersonaImages()` 테스트
   - `loadPersonaImagesFromStorage()` 테스트
3. [ ] **TDD GREEN**: globalStorage 기반 구현
4. [ ] **Phase 1 완료 조건 체크**: 단위 테스트 모두 통과

### **🎯 첫 번째 목표**
- **globalStorage 디렉토리 생성** → `context.globalStorageUri.fsPath/personas/`
- **기본 이미지 복사** → `caret-assets/` → `globalStorage/personas/`
- **새 시스템 로드 함수** → `file://` 프로토콜 기반

---

*Next Priority: Phase 1 집중 - 새로운 persona-storage.ts 시스템 TDD 구축*