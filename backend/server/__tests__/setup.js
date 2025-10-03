import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Mock the auth middleware for testing
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
};

export const createTestApp = () => {
  const app = express();

  // Basic middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);

  // Mock auth middleware
  app.use(mockAuthMiddleware);

  return app;
};