type BaseMessage = { [key: string]: string };

// fakeStream is a fake stream that allows for validating the contents of log
// messages.
export const fakeStream = (): {
  getMessage: () => BaseMessage;
  stream: NodeJS.WriteStream;
} => {
  let lastMessage: string | undefined;

  return {
    getMessage: (): BaseMessage => {
      if (!lastMessage) return { msg: 'nothing logged' };

      return prepareTestValue(lastMessage);
    },

    stream: {
      write: (val: string): void => {
        lastMessage = val;
      },
    } as NodeJS.WriteStream,
  };
};

// prepareTestValue tears off the date (since the date changes all the time it
// makes testing a pain.
const prepareTestValue = (message: string | undefined): BaseMessage => {
  if (!message)
    throw new Error('Message is undefined (no logs have been collected)');

  const messageAsJson = JSON.parse(message);
  if (messageAsJson.time === undefined)
    throw new Error('There must be a date in all log messages');

  delete messageAsJson.time;

  return messageAsJson;
};
