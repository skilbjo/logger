import pino from 'pino';
import type { LoggerOptions, SerializedError } from 'pino';

export type Logger = {
  debug: LogFn;
  error: ErrorLogFn;
  info: LogFn;
  util: {
    serialize: (arg0: Error) => SerializedError; // eslint-disable-line no-unused-vars
  };
  warn: LogFn;
};

export type LogLevels = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';
type ErrorLogFn = (
  arg0: { err: Error } & Partial<Record<string, unknown>>, // eslint-disable-line no-unused-vars
  arg1: string // eslint-disable-line no-unused-vars
) => void;

type LogFn = (arg0: Record<string, unknown>, arg1: string) => void; // eslint-disable-line no-unused-vars

export const mixin = (): Record<string, unknown> => ({
  lambdaName: process.env['AWS_LAMBDA_FUNCTION_NAME'],
  logGroup: process.env['AWS_LAMBDA_LOG_GROUP_NAME'],
  logStream: process.env['AWS_LAMBDA_LOG_STREAM_NAME'],
  requestId: process.env['_X_AMZN_REQUEST_ID'],
  xRayTraceId: process.env['_X_AMZN_TRACE_ID'],
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
        lambdaName: process.env['AWS_LAMBDA_FUNCTION_NAME'],
        logGroup: process.env['AWS_LAMBDA_LOG_GROUP_NAME'],
        logStream: process.env['AWS_LAMBDA_LOG_STREAM_NAME'],
        requestId: process.env['_X_AMZN_REQUEST_ID'],
        xRayTraceId: process.env['_X_AMZN_TRACE_ID'],
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

// `create()` touches `process.stdout` immediately (the default destination
// when no stream is passed) — calling it at module scope, as the package-level
// singletons below do, means merely importing this module throws in any
// bundle built for a non-Node target (e.g. a browser IIFE via esbuild, which
// unlike webpack doesn't polyfill `process`). Deferring construction to first
// use means importing the module has no side effects, and consumers that
// never actually log (e.g. a component's error-path logger) never pay the
// Node-only cost at all.
export const lazy = (options?: LoggerOptions): Logger => {
  let instance: Logger | undefined;
  const get = (): Logger => (instance ??= create(options));

  return {
    debug: (...args) => get().debug(...args),
    error: (...args) => get().error(...args),
    info: (...args) => get().info(...args),
    util: {
      serialize: (error: Error): SerializedError => get().util.serialize(error),
    },
    warn: (...args) => get().warn(...args),
  };
};
