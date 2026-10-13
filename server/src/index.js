import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import env from './config/env.js';
import logger from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import demoRouter from './routes/demo.js';
import privacyRouter from './routes/privacy.js';
import scansRouter from './routes/scans.js';
import urlRouter from './routes/url.js';
import radarRouter from './routes/radar.js';
import dashboardRouter from './routes/dashboard.js';
import drillsRouter from './routes/drills.js';
import playbookRouter from './routes/playbook.js';
import adminRouter from './routes/admin.js';

const app = express();

// Trust proxy for Render
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = env.CLIENT_URL.split(',').map(u => u.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Request logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

// Body parsing with size limit
app.use(express.json({ limit: '50kb' }));

// Global rate limit
app.use(globalLimiter);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/demo', demoRouter);
app.use('/api/privacy', privacyRouter);
app.use('/api/scans', scansRouter);
app.use('/api/url', urlRouter);
app.use('/api/radar', radarRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/drills', drillsRouter);
app.use('/api/playbook', playbookRouter);
app.use('/api/admin', adminRouter);

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV, aiAvailable: !!env.GEMINI_API_KEY }, 'KavachAI server started');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

export default app;
