import * as logger from '@src/winston';
import type { LogLevels } from '@src/winston';
import { fakeStream } from '@test/utils';

const level: LogLevels = 'debug';

describe.skip('winston', () => {
  beforeEach(() => jest.resetModules());

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
      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('info');
    });

    it('logs an warn-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level }, stream);
      log.warn('test', {});
      const out = getMessage();
      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('warn');
    });

    it('logs an debug-level message', () => {
      const { getMessage, stream } = fakeStream();
      const log = logger.create({ level: 'debug' }, stream);
      log.debug('test', {});
      const out = getMessage();
      expect(out.msg).toEqual('test');
      expect(out.level).toEqual('debug');
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

      expect(fake1.getMessage().msg).toBe('some message');
      expect(fake2.getMessage().msg).toBe('other message');
    });
  });
});
