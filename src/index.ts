import pino from 'pino';

export type LogLevels = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';

export const defaultFormatters = {
  bindings(): Record<string, unknown> {
    return {};
  },

  level(level: string): Record<string, unknown> {
    return { level };
  },
};

export const defaultMixin = (): Record<string, unknown> => {
  const { env } = process;

  return {
    lambdaName: env.AWS_LAMBDA_FUNCTION_NAME,
    logGroup: env.AWS_LAMBDA_LOG_GROUP_NAME,
    logStream: env.AWS_LAMBDA_LOG_STREAM_NAME,
    requestId: env._X_AMZN_REQUEST_ID,
    xRayTraceId: env._X_AMZN_TRACE_ID,
  };
};

type LogFn = (object: Record<string, unknown>, message: string) => void;
type ErrorLogFn = (
  object: { err: Error } & Partial<{ [key: string]: unknown }>,
  message: string
) => void;

export type Logger = {
  debug: LogFn;
  error: ErrorLogFn;
  info: LogFn;
  util: {
    serialize: (error: Error) => pino.SerializedError;
  };
  warn: LogFn;
};

export const defaultTimestamp = pino.stdTimeFunctions.isoTime;

export const create = (
  options?: pino.LoggerOptions,
  stream?: NodeJS.WriteStream
): Logger => {
  const pinoLogger = pino(
    {
      formatters: defaultFormatters,
      mixin: defaultMixin,
      timestamp: defaultTimestamp,
      ...options,
    },
    stream || process.stdout
  );

  return {
    debug: pinoLogger.debug.bind(pinoLogger),
    error: (
      object: { err: Error } & Partial<{ [key: string]: unknown }>, // make sure the type & function signature matches ErrorLogFn type above
      message: string
    ): void => {
      pinoLogger.error(
        { ...object, ...pino.stdSerializers.err(object.err) },
        message
      );
    },
    info: pinoLogger.info.bind(pinoLogger),
    util: {
      serialize: (error: Error): pino.SerializedError =>
        pino.stdSerializers.err(error),
    },
    warn: pinoLogger.warn.bind(pinoLogger),
  };
};
