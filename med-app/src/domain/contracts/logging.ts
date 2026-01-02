export interface ILogger {
    info(message: string, tag?: string, data?: any): void;
    warn(message: string, tag?: string, data?: any): void;
    error(message: string, tag?: string, data?: any): void;
}
