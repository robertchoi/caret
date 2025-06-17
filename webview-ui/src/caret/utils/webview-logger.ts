import { vscode } from "../../utils/vscode";

/**
 * Represents a log entry.
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

/**
 * Defines the log levels.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Logger for the webview.
 * Sends log messages to the extension host and also logs to the browser console.
 */
class WebviewLogger {
  private component: string;
  private isDev: boolean;

  constructor(component: string) {
    this.component = component;
    this.isDev = import.meta.env.MODE !== 'production';
  }

  private log(level: LogLevel, message: string, data?: any): void {
    // Only log debug messages in development mode
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

    // Log to browser console
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

    // Send log to extension host
    vscode.postMessage({
      type: 'log',
      entry
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

export default WebviewLogger;

// Named export for convenience
export const caretWebviewLogger = new WebviewLogger('Caret'); 