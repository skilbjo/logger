import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as logger from '#src/index.js';
import type { LogLevels } from '#src/index.js';
import { infoLog as log } from '#src/index.js';

describe('logger', () => {
  it('should be a function', () => {
    const logLevel: LogLevels = 'debug';
    const level: LogLevels = logLevel;

    const expected = ['debug', 'error', 'info', 'util', 'warn'];

    const log = logger.create({ level });
    const actual = Object.keys(log);

    assert.strictEqual(typeof log, 'object');
    assert.deepStrictEqual(actual, expected);
  });

  it('can log', () => {
    const logFn = () => log.info({ user: 'someUser' }, 'can log stuff');

    const actual = logFn();

    assert.strictEqual(typeof log, 'object');
    assert.doesNotThrow(logFn);
    assert.strictEqual(actual, undefined);
  });

  it('exports debugLog', () => {
    assert.strictEqual(typeof logger.debugLog, 'object');
    assert.strictEqual(typeof logger.debugLog.debug, 'function');
  });
});
