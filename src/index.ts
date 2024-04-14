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
        {
          /*
           * the error comes through logs like this, so hoping by commenting
             this out that the readability improves
{
    "0": "E",
    "1": "n",
    "2": "d",
    "3": "p",
    "4": "o",
    "5": "i",
    "6": "n",
    "7": "t",
    "8": " ",
    "9": "r",
    "10": "e",
    "11": "q",
    "12": "u",
    "13": "e",
    "14": "s",
    "15": "t",
    "16": " ",
    "17": "t",
    "18": "i",
    "19": "m",
    "20": "e",
    "21": "d",
    "22": " ",
    "23": "o",
    "24": "u",
    "25": "t",
    "level": "error",
    "time": "2024-04-14T06:39:20.326Z",
    "lambdaName": "ApiService-HrPayrollApiServiceCanaryXhrCanary1632D-Mrm1t2qso8Ur",
    "logGroup": "/aws/lambda/ApiService-HrPayrollApiServiceCanaryXhrCanary1632D-Mrm1t2qso8Ur",
    "logStream": "2024/04/14/[$LATEST]1379d548446f45739f201e156b48dd6e",
    "xRayTraceId": "Root=1-661b79f2-2e6d5166016439b661594434;Parent=dc483121f58aee89;Sampled=1;Lineage=5f238176:0",
    "err": "Endpoint request timed out",
    "statusText": "Gateway Timeout",
    "msg": "error"
}
           */
          // ...object,

          ...pino.stdSerializers.err(object.err),
        },
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
