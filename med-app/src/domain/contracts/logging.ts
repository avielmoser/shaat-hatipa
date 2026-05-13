export interface ILogger {
    info(message: string, tag?: string, data?: unknown): void;
    warn(message: string, tag?: string, data?: unknown): void;
    error(message: string, tag?: string, data?: unknown): void;
}
