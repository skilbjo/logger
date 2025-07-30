import * as pino from '@src/pino';
import * as reversePino from '@src/reverse-pino';

export * from '@src/pino';
export * as reversePino from '@src/reverse-pino';
export { create as reverseCreate, type ReverseLogger } from '@src/reverse-pino';

export const debugLog = pino.create({ level: 'debug' });
export const infoLog = pino.create({ level: 'info' });
export const warnLog = pino.create({ level: 'warn' });

export const reverseLog = reversePino.create({ level: 'info' });

const log = infoLog;

export default log;
