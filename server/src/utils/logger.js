import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino/file',
    options: { destination: 1 }
  } : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.text',
      'req.body.token',
    ],
    censor: '[REDACTED]'
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        headers: { 'user-agent': req.headers?.['user-agent'] },
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});

export default logger;
