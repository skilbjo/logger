import pino from 'pino';
import type { LoggerOptions, SerializedError } from 'pino';

export type Logger = {
  debug: LogFn;
  error: ErrorLogFn;
  info: LogFn;
  util: {
    serialize: (error: Error) => SerializedError;
  };
  warn: LogFn;
};

export type LogLevels = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';
type ErrorLogFn = (
  object: { err: Error } & Partial<Record<string, unknown>>,
  message: string
) => void;

type LogFn = (object: Record<string, unknown>, message: string) => void;

export const mixin = (): Record<string, unknown> => ({
  lambdaName: process.env.AWS_LAMBDA_FUNCTION_NAME,
  logGroup: process.env.AWS_LAMBDA_LOG_GROUP_NAME,
  logStream: process.env.AWS_LAMBDA_LOG_STREAM_NAME,
  requestId: process.env._X_AMZN_REQUEST_ID,
  xRayTraceId: process.env._X_AMZN_TRACE_ID,
});

export const create = (
  options?: LoggerOptions,
  stream?: NodeJS.WriteStream
): Logger => {
  const pinoLogger = pino(
    {
      formatters: {
        bindings: (): Record<string, unknown> => ({}),

        level: (level: string): Record<string, unknown> => ({ level }),
      },
      mixin: () => ({
        lambdaName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        logGroup: process.env.AWS_LAMBDA_LOG_GROUP_NAME,
        logStream: process.env.AWS_LAMBDA_LOG_STREAM_NAME,
        requestId: process.env._X_AMZN_REQUEST_ID,
        xRayTraceId: process.env._X_AMZN_TRACE_ID,
      }),
      timestamp: pino.stdTimeFunctions.isoTime,
      ...options,
    },
    stream || process.stdout
  );

  return {
    debug: pinoLogger.debug.bind(pinoLogger),
    error: (object: { err: Error }, message: string): void =>
      pinoLogger.error(pino.stdSerializers.err(object.err), message),
    info: pinoLogger.info.bind(pinoLogger),
    util: {
      serialize: (error: Error): SerializedError =>
        pino.stdSerializers.err(error),
    },
    warn: pinoLogger.warn.bind(pinoLogger),
  };
};
