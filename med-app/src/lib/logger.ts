import { env } from "@/lib/env";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: Error | unknown;
}

class Logger {
    private log(level: LogLevel, message: string, context?: Record<string, any>, error?: unknown) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
        };

        if (error) {
            if (error instanceof Error) {
                entry.error = {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                };
            } else {
                entry.error = error;
            }
        }

        // In local dev, we might want pretty printing, but JSON is safer for structured logging tools
        if (env.NODE_ENV === "development") {
            const color = level === "error" ? "\x1b[31m" : level === "warn" ? "\x1b[33m" : "\x1b[36m";
            console.log(`${color}[${level.toUpperCase()}] ${message}\x1b[0m`, context || "", error || "");
        } else {
            console.log(JSON.stringify(entry));
        }
    }

    info(message: string, context?: Record<string, any>) {
        this.log("info", message, context);
    }

    warn(message: string, context?: Record<string, any>) {
        this.log("warn", message, context);
    }

    error(message: string, error?: unknown, context?: Record<string, any>) {
        this.log("error", message, context, error);
    }

    debug(message: string, context?: Record<string, any>) {
        if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1") {
            this.log("debug", message, context);
        }
    }
}

export const logger = new Logger();
