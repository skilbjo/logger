import createError from 'http-errors';
import { reversePino as reverseLogger } from '@src/index';
import { fakeStream } from '@test/utils';

export type HttpErrorResponseFn = () => createError.HttpError;

export type HttpResponseableError = {
  asHttpErrorResponse: HttpErrorResponseFn;
};

describe('pino', () => {
  describe('when no config environment variables exist', () => {
    beforeEach(() => jest.resetModules());

    it('logs an info-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = reverseLogger.create(undefined, stream);

      log.info('test - with object', {});
      let out = getMessage();

      expect(out.msg).toEqual('test - with object');
      expect(out.level).toEqual('info');

      log.info('test - without object');
      out = getMessage();

      expect(out.msg).toEqual('test - without object');
      expect(out.level).toEqual('info');
    });

    it('logs a warn-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = reverseLogger.create(undefined, stream);

      log.warn('test', {});

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('warn');
    });

    it('logs an error-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = reverseLogger.create({ level: 'error' }, stream);

      log.error('test', {});

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('error');
    });

    it('logs a debug-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = reverseLogger.create({ level: 'debug' }, stream);

      log.debug('test', {});

      const out = getMessage();

      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('debug');
    });
  });

  describe(reverseLogger.create, () => {
    beforeEach(() => jest.resetModules());

    it('should always give a fresh logger', () => {
      const fake1 = fakeStream();
      const log1 = reverseLogger.create({}, fake1.stream);

      log1.info('some message', { user: 'someUser' });

      const fake2 = fakeStream();
      const log2 = reverseLogger.create({}, fake2.stream);
      log2.info('other message', { user: 'otherUser' });

      expect(fake1.getMessage().msg).toBe('some message');
      expect(fake2.getMessage().msg).toBe('other message');
    });
  });
});
