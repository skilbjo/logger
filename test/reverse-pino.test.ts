import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reversePino as reverseLogger } from '@src/index';
import { fakeStream } from '@test/utils';

void describe('pino', () => {
  void describe('when no config environment variables exist', () => {
    void it('logs an info-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = reverseLogger.create(undefined, stream);

      log.info('test - with object', {});
      let out = getMessage();

      assert.strictEqual(out.msg, 'test - with object');
      assert.strictEqual(out.level, 'info');

      log.info('test - without object');
      out = getMessage();

      assert.strictEqual(out.msg, 'test - without object');
      assert.strictEqual(out.level, 'info');
    });

    void it('logs a warn-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = reverseLogger.create(undefined, stream);

      log.warn('test', {});

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'warn');
    });

    void it('logs an error-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = reverseLogger.create({ level: 'error' }, stream);

      log.error('test', {});

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'error');
    });

    void it('logs a debug-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = reverseLogger.create({ level: 'debug' }, stream);

      log.debug('test', {});

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'debug');
    });
  });

  void describe('reverseLogger.create', () => {
    void it('should always give a fresh logger', () => {
      const fake1 = fakeStream();
      const log1 = reverseLogger.create({}, fake1.stream);

      log1.info('some message', { user: 'someUser' });

      const fake2 = fakeStream();
      const log2 = reverseLogger.create({}, fake2.stream);
      log2.info('other message', { user: 'otherUser' });

      assert.strictEqual(fake1.getMessage().msg, 'some message');
      assert.strictEqual(fake2.getMessage().msg, 'other message');
    });
  });
});
