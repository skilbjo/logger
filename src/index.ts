import * as pino from '@src/pino';

export * from '@src/pino';

export const debugLog = pino.create({ level: 'debug' });
export const infoLog = pino.create({ level: 'info' });
export const warnLog = pino.create({ level: 'warn' });

const log = infoLog;

export default log;
