import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as logger from '#src/winston.js';
import type { LogLevels } from '#src/winston.js';
import { fakeStream } from '#test/utils.js';

const level: LogLevels = 'debug';

describe.skip('winston', () => {
  describe('general', () => {
    it('logs', () => {
      const log = logger.create({ level });

      log.debug('test message ');
    });

    it('logs an info-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level }, stream);
      log.info('test', {});
      const out = getMessage();
      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'info');
    });

    it('logs an warn-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level }, stream);
      log.warn('test', {});
      const out = getMessage();
      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'warn');
    });

    it('logs an debug-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level: 'debug' }, stream);
      log.debug('test', {});
      const out = getMessage();
      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'debug');
    });
  });

  describe('logger.create', () => {
    it('should always give a fresh logger', () => {
      const fake1 = fakeStream();
      const log1 = logger.create({ level }, fake1.stream);

      log1.info('some message', { user: 'someUser' });

      const fake2 = fakeStream();
      const log2 = logger.create({ level }, fake2.stream);
      log2.info('other message', { user: 'otherUser' });

      assert.strictEqual(fake1.getMessage().msg, 'some message');
      assert.strictEqual(fake2.getMessage().msg, 'other message');
    });
  });
});
