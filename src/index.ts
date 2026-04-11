import * as pino from '#src/pino.js';

export * as reversePino from '#src/reverse-pino.js';
export {
  create as reverseCreate,
  type ReverseLogger,
} from '#src/reverse-pino.js';

export const infoLog = pino.create({ level: 'info' });
export const debugLog = pino.create({ level: 'debug' });
export const warnLog = pino.create({ level: 'warn' });

export const create = pino.create;
export const mixin = pino.mixin;

export type Logger = pino.Logger;
export type LogLevels = pino.LogLevels;
