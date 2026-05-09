import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Bindings } from 'pino';

import createError from 'http-errors';
import type { HttpError } from 'http-errors';
import * as logger from '#src/index.js';
import { fakeStream } from '#test/utils.js';

export type HttpErrorResponseFn = () => createError.HttpError;

export type HttpResponseableError = {
  asHttpErrorResponse: HttpErrorResponseFn;
};

class InternalServerError extends Error implements HttpResponseableError {
  public readonly asHttpErrorResponse: HttpErrorResponseFn;

  constructor(message?: string) {
    super(message ?? 'Internal Server Error');
    Object.setPrototypeOf(this, new.target.prototype);

    this.asHttpErrorResponse = (): HttpError =>
      new createError.InternalServerError();
  }
}

describe('pino', () => {
  describe('when no config environment variables exist', () => {
    it('logs an info-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.info({}, 'test');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'info');
    });

    it('logs a warn-level message (implicit)', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.warn({}, 'test');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'warn');
    });

    it('logs a warn-level message (explcit)', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level: 'warn' }, stream);

      log.warn({}, 'test');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'warn');
    });

    it('logs an error-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level: 'error' }, stream);

      log.error({ err: 'test' as unknown as Error }, 'error');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'error');
    });

    it('logs a debug-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level: 'debug' }, stream);

      log.debug({}, 'test');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'debug');
    });
  });

  describe('when the expected environment variables are set', () => {
    beforeEach(() => {
      process.env['AWS_LAMBDA_FUNCTION_NAME'] = 'fakeLambdaFunctionName';
      process.env['AWS_LAMBDA_LOG_STREAM_NAME'] = 'fakeLogStreamName';
      process.env['_X_AMZN_TRACE_ID'] = 'fakeTraceId';
      process.env['_X_AMZN_REQUEST_ID'] = 'fakeRequestId';
    });

    afterEach(() => {
      delete process.env['AWS_LAMBDA_FUNCTION_NAME'];
      delete process.env['AWS_LAMBDA_LOG_STREAM_NAME'];
      delete process.env['_X_AMZN_TRACE_ID'];
      delete process.env['_X_AMZN_REQUEST_ID'];
    });

    it('logs an info-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.info({}, 'test');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'info');
      assert.strictEqual(out.lambdaName, 'fakeLambdaFunctionName');
      assert.strictEqual(out.logStream, 'fakeLogStreamName');
      assert.strictEqual(out.requestId, 'fakeRequestId');
      assert.strictEqual(out.xRayTraceId, 'fakeTraceId');
    });
  });

  describe('when the payload of the log message is complex', () => {
    it('handles logging an error correctly', () => {
      const seedMsg = 'test';
      const expectedMsg = seedMsg;
      const expectedLevel = 'error';
      const expectedType = 'InternalServerError';

      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.error({ err: new InternalServerError('FailBus') }, seedMsg);

      const actual = getMessage();
      const { level, msg, stack, type } = actual;

      assert.strictEqual(msg, expectedMsg);
      assert.strictEqual(level, expectedLevel);
      assert.strictEqual(type, expectedType);
      assert.ok(stack.startsWith('Error: FailBus\n'));
    });

    it('handles logging an error correctly', () => {
      const seedMsg = 'test';
      const expectedMsg = seedMsg;
      const expectedLevel = 'error';
      const expectedType = 'Error';

      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.error({ err: new Error('FailBus') }, seedMsg);

      const actual = getMessage();
      const { level, msg, stack, type } = actual;

      assert.strictEqual(msg, expectedMsg);
      assert.strictEqual(level, expectedLevel);
      assert.strictEqual(type, expectedType);
      assert.ok(stack.startsWith('Error: FailBus\n'));
    });

    it('can also throw additional non-error info in the payload (in addition to the error)', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.error({ err: new Error('FailBus'), someMsg: 'yo dawg' }, 'test');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'error');
      assert.strictEqual(out.type, 'Error');
      assert.ok(out.stack.startsWith('Error: FailBus\n'));
    });

    it('handles logging an object correctly', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.info(
        { anArray: [1, 2, 3, { one: 1, two: 2 }], aNumber: 3, soComplex: true },
        'test'
      );

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'info');
      assert.strictEqual(out.soComplex, true);
      assert.strictEqual(out.aNumber, 3);
      assert.deepStrictEqual(out.anArray, [1, 2, 3, { one: 1, two: 2 }]);
    });
  });

  describe('when you need something redacted', () => {
    it('redacts the specified value', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ redact: ['password'] }, stream);

      log.info({ password: 'hide me', user: 'someUser' }, 'test');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'info');
      assert.strictEqual(out.user, 'someUser');
      assert.strictEqual(out.password, '[Redacted]');
    });
  });

  describe('when you need to override the mixin', () => {
    it('logs what your mixin returns', () => {
      const { getMessage, stream } = fakeStream();
      const mixin = (): Record<string, unknown> => ({
        yoDawg: 'I love functions',
        ...logger.mixin(),
      });

      const log = logger.create({ mixin }, stream);

      log.info({}, 'test');

      const out = getMessage();

      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.level, 'info');
      assert.strictEqual(out.yoDawg, 'I love functions');
    });
  });

  describe('when you need to override the formatters', () => {
    it('logs what your formatter defines', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(
        {
          formatters: {
            bindings: (bindings: Bindings): Record<string, unknown> => ({
              hostname: bindings.hostname,
              pid: bindings.pid,
            }),
            level: (
              level: string,
              number: number
            ): Record<string, unknown> => ({ level: number }),
          },
        },
        stream
      );

      log.info({ user: 'someUser' }, 'test');

      const out = getMessage();

      assert.ok(out.hostname !== undefined);
      assert.strictEqual(out.level, 30);
      assert.ok(out.pid !== undefined);
      assert.strictEqual(out.msg, 'test');
      assert.strictEqual(out.user, 'someUser');
    });
  });

  describe('logger.create', () => {
    it('should always give a fresh logger', () => {
      const fake1 = fakeStream();
      const log1 = logger.create({}, fake1.stream);

      log1.info({ user: 'someUser' }, 'some message');

      const fake2 = fakeStream();
      const log2 = logger.create({}, fake2.stream);
      log2.info({ user: 'otherUser' }, 'other message');

      assert.strictEqual(fake1.getMessage().msg, 'some message');
      assert.strictEqual(fake2.getMessage().msg, 'other message');
    });
  });

  describe('serializer', () => {
    it('should serialize correctly', () => {
      const log = logger.create();

      assert.strictEqual(log.util.serialize(new Error('fail')).message, 'fail');
    });
  });
});
