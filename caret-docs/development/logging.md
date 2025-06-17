# 로깅 시스템 가이드

## 1. 개요

이 문서는 Caret의 로깅 시스템을 설명합니다. Extension과 Webview 양쪽에서의 로깅, 로그 레벨, 로그 저장 및 관리 방법을 다룹니다.

## 2. 로깅 구조

### 2.1 로그 레벨
```typescript
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}
```

### 2.2 로그 포맷
```typescript
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}
```

## 3. Extension 로깅

### 3.1 Logger 클래스
```typescript
class Logger {
  constructor(
    private component: string,
    private context: vscode.ExtensionContext
  ) {}

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      data
    };

    // 콘솔 출력
    console.log(JSON.stringify(entry));

    // 파일 저장
    this.saveToFile(entry);
  }

  private async saveToFile(entry: LogEntry): Promise<void> {
    const logPath = path.join(this.context.globalStoragePath, 'logs');
    await fs.mkdir(logPath, { recursive: true });

    const logFile = path.join(logPath, `${new Date().toISOString().split('T')[0]}.log`);
    await fs.appendFile(logFile, JSON.stringify(entry) + '\n');
  }
}
```

### 3.2 사용 예시
```typescript
// Logger 인스턴스 생성
const logger = new Logger('MyComponent', context);

// 로그 출력
logger.info('컴포넌트 초기화');
logger.error('오류 발생', { error: 'details' });
```

## 4. Webview 로깅

Caret 웹뷰에서는 `caret-webview-ui/src/utils/WebviewLogger.ts`에 정의된 `WebviewLogger` 클래스를 표준 로거로 사용합니다. (기존에 존재하던 중복 파일 `logger.ts`는 삭제되었습니다.)

이 로거는 다음과 같은 주요 기능을 제공합니다:
- 로그 메시지를 브라우저의 개발자 콘솔과 VSCode 확장 기능(Extension Host) 양쪽으로 전송합니다.
- `LogLevel` 열거형 (DEBUG, INFO, WARN, ERROR)을 사용하여 로그 레벨을 관리합니다.
- 개발 모드(`import.meta.env.MODE !== 'production'`)에서는 `DEBUG` 레벨의 로그만 특별히 처리하여, 프로덕션 빌드에서는 해당 로그가 제외되도록 합니다.

**참고:** `import.meta.env.MODE`와 같은 Vite 환경 변수를 TypeScript에서 올바르게 사용하려면, `caret-webview-ui/src/vite-env.d.ts` 파일에 다음 내용이 포함되어 있어야 합니다:
```typescript
/// <reference types="vite/client" />
```

### 4.1 WebviewLogger 클래스
```typescript
import { vscode } from "./vscode"; // vscode 유틸리티는 메시지 전송을 담당합니다.

// LogLevel과 LogEntry 인터페이스는 프로젝트 전반적으로 사용될 수 있으므로,
// 필요에 따라 별도 파일에서 import 하거나, 문서 상단에 정의된 것을 참조합니다.
// (이 문서에서는 상단 2.1 및 2.2 섹션에 LogLevel과 LogEntry가 정의되어 있습니다.)

class WebviewLogger {
  private component: string;
  private isDev: boolean;

  constructor(component: string) {
    this.component = component;
    // Vite 환경에서 현재 모드를 확인하여 개발 모드 여부를 설정합니다.
    this.isDev = import.meta.env.MODE !== 'production';
  }

  private log(level: LogLevel, message: string, data?: any): void {
    // 개발 모드가 아니면 DEBUG 레벨 로그는 처리하지 않습니다.
    if (level === LogLevel.DEBUG && !this.isDev) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      data
    };

    // 브라우저 콘솔에 로그 출력
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[${this.component}] ${message}`, data || '');
        break;
      case LogLevel.INFO:
        console.info(`[${this.component}] ${message}`, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`[${this.component}] ${message}`, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`[${this.component}] ${message}`, data || '');
        break;
      default:
        console.log(`[${this.component}] ${message}`, data || '');
    }

    // Extension Host로 로그 전송
    vscode.postMessage({
      type: 'log', // 메시지 타입을 'log'로 지정
      entry // 실제 로그 데이터
    });
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }
}

// 사용시에는 아래와 같이 default export 된 것을 import 합니다.
// import WebviewLogger from './utils/WebviewLogger';
```

### 4.2 사용 예시
```typescript
import WebviewLogger, { LogLevel } from './utils/WebviewLogger'; // LogLevel도 필요시 import

// WebviewLogger 인스턴스 생성 (예: React 컴포넌트 내부)
const logger = new WebviewLogger('MyWebviewComponent');

// 로그 출력
logger.info('컴포넌트가 마운트되었습니다.');
logger.debug('이것은 개발 중에만 보이는 디버그 메시지입니다.', { someData: 123 });
logger.warn('API 응답이 예상과 다릅니다.', { response: { status: 200, body: 'unexpected' } });
logger.error('API 호출 중 심각한 오류 발생!', new Error('Network Failure'));
```

## 5. 로그 관리

### 5.1 로그 파일 관리
```typescript
class LogManager {
  constructor(private context: vscode.ExtensionContext) {}

  // 로그 파일 목록 조회
  async getLogFiles(): Promise<string[]> {
    const logPath = path.join(this.context.globalStoragePath, 'logs');
    return fs.readdir(logPath);
  }

  // 로그 파일 읽기
  async readLogFile(filename: string): Promise<string> {
    const logPath = path.join(this.context.globalStoragePath, 'logs', filename);
    return fs.readFile(logPath, 'utf-8');
  }

  // 오래된 로그 파일 삭제
  async cleanupOldLogs(daysToKeep: number): Promise<void> {
    const logPath = path.join(this.context.globalStoragePath, 'logs');
    const files = await fs.readdir(logPath);
    
    const now = new Date();
    for (const file of files) {
      const filePath = path.join(logPath, file);
      const stats = await fs.stat(filePath);
      const daysOld = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysOld > daysToKeep) {
        await fs.unlink(filePath);
      }
    }
  }
}
```

### 5.2 로그 뷰어
```typescript
class LogViewer {
  constructor(private context: vscode.ExtensionContext) {}

  // 로그 뷰어 패널 생성
  createLogViewer(): void {
    const panel = vscode.window.createWebviewPanel(
      'logViewer',
      '로그 뷰어',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.getWebviewContent();
  }

  // 로그 필터링
  filterLogs(logs: LogEntry[], level?: LogLevel, component?: string): LogEntry[] {
    return logs.filter(log => {
      if (level && log.level !== level) return false;
      if (component && log.component !== component) return false;
      return true;
    });
  }
}
```

## 6. 모범 사례

### 6.1 로깅 원칙
- 적절한 로그 레벨 사용
- 의미 있는 메시지 작성
- 민감 정보 제외
- 구조화된 데이터 포함

### 6.2 성능 고려사항
- 대용량 데이터 로깅 주의
- 로그 파일 크기 관리
- 주기적인 로그 정리

### 6.3 보안 고려사항
- 민감 정보 마스킹
- 로그 파일 접근 제한
- 로그 데이터 암호화

## 7. 업데이트 기록
- 2024-03-21: 초기 문서 작성
- 2024-03-21: 로깅 클래스 구현 추가
- 2024-03-21: 로그 관리 기능 추가
- 2024-03-21: 모범 사례 추가
- (오늘 날짜): WebviewLogger 상세 구현 내용 업데이트 (개발 모드 DEBUG 처리, LogLevel enum 사용, vite-env.d.ts 언급, logger.ts 제거 명시)
