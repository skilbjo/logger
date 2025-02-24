import type { Bindings } from 'pino';

import createError from 'http-errors';
import type { HttpError } from 'http-errors';
import * as logger from '@src/index';
import { fakeStream } from '@test/utils';

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
    beforeEach(() => jest.resetModules());

    it('logs an info-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.info({}, 'test');

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('info');
    });

    it('logs an warn-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.warn({}, 'test');

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('warn');
    });

    it('logs an debug-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level: 'debug' }, stream);

      log.debug({}, 'test');

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('debug');
    });
  });

  describe('when the expected environment variables are set', () => {
    beforeEach(() => {
      jest.resetModules();

      process.env = Object.assign(process.env, {
        AWS_LAMBDA_FUNCTION_NAME: 'fakeLambdaFunctionName',
      });
      process.env = Object.assign(process.env, {
        AWS_LAMBDA_LOG_STREAM_NAME: 'fakeLogStreamName',
      });
      process.env = Object.assign(process.env, {
        _X_AMZN_TRACE_ID: 'fakeTraceId',
      });
      process.env = Object.assign(process.env, {
        _X_AMZN_REQUEST_ID: 'fakeRequestId',
      });
    });

    afterEach(() => {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      delete process.env.AWS_LAMBDA_LOG_STREAM_NAME;
      delete process.env._X_AMZN_TRACE_ID;
      delete process.env._X_AMZN_REQUEST_ID;
    });

    it('logs an info-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.info({}, 'test');

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('info');
      expect(out.lambdaName).toEqual('fakeLambdaFunctionName');
      expect(out.logStream).toEqual('fakeLogStreamName');
      expect(out.requestId).toEqual('fakeRequestId');
      expect(out.xRayTraceId).toEqual('fakeTraceId');
    });
  });

  describe('when the payload of the log message is complex', () => {
    beforeEach(() => jest.resetModules());

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

      expect(msg).toEqual(expectedMsg);
      expect(level).toEqual(expectedLevel);
      expect(type).toEqual(expectedType);
      expect(stack.startsWith('Error: FailBus\n')).toBeTruthy();
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

      expect(msg).toEqual(expectedMsg);
      expect(level).toEqual(expectedLevel);
      expect(type).toEqual(expectedType);
      expect(stack.startsWith('Error: FailBus\n')).toBeTruthy();
    });

    it('can also throw additional non-error info in the payload (in addition to the error)', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.error({ err: new Error('FailBus'), someMsg: 'yo dawg' }, 'test');

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('error');
      expect(out.type).toEqual('Error');
      expect(out.stack.startsWith('Error: FailBus\n')).toBeTruthy();
    });

    it('handles logging an object correctly', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create(undefined, stream);

      log.info(
        { anArray: [1, 2, 3, { one: 1, two: 2 }], aNumber: 3, soComplex: true },
        'test'
      );

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('info');
      expect(out.soComplex).toEqual(true);
      expect(out.aNumber).toEqual(3);
      expect(out.anArray).toEqual([1, 2, 3, { one: 1, two: 2 }]);
    });
  });

  describe('when you need something redacted', () => {
    beforeEach(() => jest.resetModules());

    it('redacts the specified value', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ redact: ['password'] }, stream);

      log.info({ password: 'hide me', user: 'someUser' }, 'test');

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('info');
      expect(out.user).toEqual('someUser');
      expect(out.password).toEqual('[Redacted]');
    });
  });

  describe('when you need to override the mixin', () => {
    beforeEach(() => jest.resetModules());

    it('logs what your mixin returns', () => {
      const { getMessage, stream } = fakeStream();
      const mixin = (): Record<string, unknown> => ({
        yoDawg: 'I love functions',
        ...logger.mixin(),
      });

      const log = logger.create({ mixin }, stream);

      log.info({}, 'test');

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('info');
      expect(out.yoDawg).toEqual('I love functions');
    });
  });

  describe('when you need to override the formatters', () => {
    beforeEach(() => jest.resetModules());

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

      expect(out.hostname).toBeDefined();
      expect(out.level).toEqual(30);
      expect(out.pid).toBeDefined();
      expect(out.msg).toEqual('test');
      expect(out.user).toEqual('someUser');
    });
  });

  describe(logger.create, () => {
    beforeEach(() => jest.resetModules());

    it('should always give a fresh logger', () => {
      const fake1 = fakeStream();
      const log1 = logger.create({}, fake1.stream);

      log1.info({ user: 'someUser' }, 'some message');

      const fake2 = fakeStream();
      const log2 = logger.create({}, fake2.stream);
      log2.info({ user: 'otherUser' }, 'other message');

      expect(fake1.getMessage().msg).toBe('some message');
      expect(fake2.getMessage().msg).toBe('other message');
    });
  });

  describe('serializer', () => {
    it('should serialize correctly', () => {
      const log = logger.create();

      expect(log.util.serialize(new Error('fail')).message).toBe('fail');
    });
  });
});
