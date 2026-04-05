import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as logger from '@src/index';
import type { LogLevels } from '@src/index';
import { infoLog as log } from '@src/index';

void describe('logger', () => {
  void it('should be a function', () => {
    const logLevel: LogLevels = 'debug';
    const level: LogLevels = logLevel;

    const expected = ['debug', 'error', 'info', 'util', 'warn'];

    const log = logger.create({ level });
    const actual = Object.keys(log);

    assert.strictEqual(typeof log, 'object');
    assert.deepStrictEqual(actual, expected);
  });

  void it('can log', () => {
    const logFn = () => log.info({ user: 'someUser' }, 'can log stuff');

    const actual = logFn();

    assert.strictEqual(typeof log, 'object');
    assert.doesNotThrow(logFn);
    assert.strictEqual(actual, undefined);
  });
});
