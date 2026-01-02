import { ILogger } from "@/domain/contracts/logging";
import { logger } from "@/lib/utils/logger";

export class ConsoleLogger implements ILogger {
    info(message: string, tag?: string, data?: any): void {
        logger.info(message, tag, data);
    }

    warn(message: string, tag?: string, data?: any): void {
        logger.warn(message, tag, data);
    }

    error(message: string, tag?: string, data?: any): void {
        logger.error(message, tag, data);
    }
}
