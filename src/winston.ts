import type { LeveledLogMethod } from 'winston';
import winston from 'winston';

export { Logger } from 'winston';

export type LogLevels = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';

export const create = (
  { level }: { level: LogLevels } = { level: 'debug' },
  stream?: NodeJS.WriteStream // eslint-disable-line @typescript-eslint/no-unused-vars
  // ) => {
): {
  debug: LeveledLogMethod;
  error: LeveledLogMethod;
  info: LeveledLogMethod;
  warn: LeveledLogMethod;
} => {
  const winstonLogger = winston.createLogger({
    format: winston.format.combine(
      winston.format.metadata(),
      winston.format.timestamp(),
      winston.format.json(),

      winston.format.colorize(),
      winston.format.prettyPrint(),
      winston.format.splat(),
      winston.format.simple()
    ),
    level,
    // transports: stream || [new winston.transports.Console({})],
    transports: [new winston.transports.Console({})],
  });

  return {
    debug: winstonLogger.debug.bind(winstonLogger),
    error: winstonLogger.error.bind(winstonLogger),
    info: winstonLogger.info.bind(winstonLogger),
    warn: winstonLogger.warn.bind(winstonLogger),
  };
};
