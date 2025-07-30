import pino from 'pino';
import type { LoggerOptions } from 'pino';

export type LogLevels = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';

export type ReverseLogger = {
  debug: ReverseLogFn;
  error: ReverseLogFn;
  info: ReverseLogFn;
  warn: ReverseLogFn;
};
type ReverseLogFn = (message: string, object?: Record<string, unknown>) => void;

export const create = (
  options?: LoggerOptions,
  stream?: NodeJS.WriteStream
): ReverseLogger => {
  const pinoLogger = pino(
    {
      formatters: {
        bindings: (): Record<string, unknown> => ({}),

        level: (level: string): Record<string, unknown> => ({ level }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...options,
    },
    stream || process.stdout
  );

  return {
    debug: pinoLogger.debug.bind(pinoLogger),
    error: pinoLogger.error.bind(pinoLogger),
    info: pinoLogger.info.bind(pinoLogger),
    warn: pinoLogger.warn.bind(pinoLogger),
  };
};
