# Caret 유틸리티 함수 가이드

## 1. 상태 관리 유틸리티

### 1.1 Global State
```typescript
// 저장
async function updateGlobalState(context: vscode.ExtensionContext, key: string, value: any): Promise<void> {
  await context.globalState.update(key, value);
}

// 로드
async function getGlobalState<T>(context: vscode.ExtensionContext, key: string): Promise<T | undefined> {
  return context.globalState.get(key);
}
```

### 1.2 Workspace State
```typescript
// 저장
async function updateWorkspaceState(context: vscode.ExtensionContext, key: string, value: any): Promise<void> {
  await context.workspaceState.update(key, value);
}

// 로드
async function getWorkspaceState<T>(context: vscode.ExtensionContext, key: string): Promise<T | undefined> {
  return context.workspaceState.get(key);
}
```

### 1.3 Secret 관리
```typescript
// 저장
async function storeSecret(context: vscode.ExtensionContext, key: string, value: string): Promise<void> {
  await context.secrets.store(key, value);
}

// 로드
async function getSecret(context: vscode.ExtensionContext, key: string): Promise<string | undefined> {
  return context.secrets.get(key);
}
```

## 2. 파일 시스템 유틸리티

### 2.1 파일 경로
```typescript
// 확장 저장소 경로
function getExtensionStoragePath(context: vscode.ExtensionContext): string {
  return context.globalStoragePath;
}

// 워크스페이스 경로
function getWorkspacePath(): string {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
}
```

### 2.2 파일 조작
```typescript
// 파일 읽기
async function readFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf-8');
}

// 파일 쓰기
async function writeFile(path: string, content: string): Promise<void> {
  await fs.writeFile(path, content, 'utf-8');
}

// 디렉토리 생성
async function ensureDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}
```

## 3. 메시지 유틸리티

### 3.1 Webview 메시지
```typescript
// 메시지 전송
function postMessage(webview: vscode.Webview, message: any): void {
  webview.postMessage(message);
}

// 메시지 핸들러
function handleMessage(message: any): void {
  switch (message.type) {
    case 'saveData':
      // 데이터 저장 처리
      break;
    case 'loadData':
      // 데이터 로드 처리
      break;
  }
}
```

### 3.2 알림 메시지
```typescript
// 정보 메시지
function showInfo(message: string): void {
  vscode.window.showInformationMessage(message);
}

// 경고 메시지
function showWarning(message: string): void {
  vscode.window.showWarningMessage(message);
}

// 에러 메시지
function showError(message: string): void {
  vscode.window.showErrorMessage(message);
}
```

## 4. 로깅 유틸리티

### 4.1 기본 로깅
```typescript
// 로그 출력
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
}
```

### 4.2 파일 로깅
```typescript
// 로그 파일 저장
async function writeLog(message: string, level: string): Promise<void> {
  const logPath = path.join(getExtensionStoragePath(), 'logs');
  await ensureDirectory(logPath);
  
  const logFile = path.join(logPath, `${new Date().toISOString().split('T')[0]}.log`);
  await fs.appendFile(logFile, `[${new Date().toISOString()}] ${level}: ${message}\n`);
}
```

## 5. 검증 유틸리티

### 5.1 데이터 검증
```typescript
// 필수 필드 검증
function validateRequiredFields(data: any, fields: string[]): boolean {
  return fields.every(field => data[field] !== undefined && data[field] !== null);
}

// 타입 검증
function validateType(value: any, type: string): boolean {
  return typeof value === type;
}
```

### 5.2 설정 검증
```typescript
// API 키 검증
function validateApiKey(key: string): boolean {
  return key.length > 0 && /^[A-Za-z0-9-_]+$/.test(key);
}

// 모드 설정 검증
function validateModeConfig(config: any): boolean {
  return (
    validateRequiredFields(config, ['id', 'name', 'description']) &&
    validateType(config.id, 'string') &&
    validateType(config.name, 'string')
  );
}
```

## 6. 업데이트 기록
- 2024-03-21: 초기 문서 작성
- 2024-03-21: 유틸리티 함수 정리
- 2024-03-21: 예제 코드 추가
- 2024-03-21: 검증 유틸리티 추가
