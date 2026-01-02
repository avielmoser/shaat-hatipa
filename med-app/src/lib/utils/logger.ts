// lib/logger.ts

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  tag?: string;
  data?: any;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  const tagStr = entry.tag ? `[${entry.tag}]` : "";
  const dataStr = entry.data ? JSON.stringify(entry.data) : "";
  return `${entry.timestamp} ${entry.level.toUpperCase()} ${tagStr} ${entry.message} ${dataStr}`;
}

export const logger = {
  info: (message: string, tag?: string, data?: any) => {
    const entry: LogEntry = {
      level: "info",
      message,
      tag,
      data,
      timestamp: new Date().toISOString(),
    };
    console.log(formatLog(entry));
  },
  warn: (message: string, tag?: string, data?: any) => {
    const entry: LogEntry = {
      level: "warn",
      message,
      tag,
      data,
      timestamp: new Date().toISOString(),
    };
    console.warn(formatLog(entry));
  },
  error: (message: string, tag?: string, data?: any) => {
    const entry: LogEntry = {
      level: "error",
      message,
      tag,
      data,
      timestamp: new Date().toISOString(),
    };
    console.error(formatLog(entry));
    // TODO: Send to Sentry here
  },
};
