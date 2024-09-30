import * as logger from '@src/index';
import type { LogLevels } from '@src/index';
import { infoLog as log } from '@src/index';

describe('logger', () => {
  it('should be a function', () => {
    const logLevel: LogLevels = 'debug';
    const level: LogLevels = logLevel;

    const expected = ['debug', 'error', 'info', 'util', 'warn'];

    const log = logger.create({ level });
    const actual = Object.keys(log);

    expect(typeof log).toBe('object');
    expect(actual).toStrictEqual(expected);
  });

  it('can log', () => {
    const logFn = () => log.info({ user: 'someUser' }, 'can log stuff');

    const actual = logFn();

    expect(typeof log).toBe('object');
    expect(logFn).not.toThrowError();
    expect(actual).toBeUndefined();
  });
});
