import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import limit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';

import viewRouter from './routes/viewRoutes.js';
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import globalErrorHandler from './controllers/globalErrorHandler.js';
import AppError from './utils/appError.js';
import * as authController from './controllers/authController.js';
import * as bookingController from './controllers/bookingController.js';

dotenv.config({ path: 'config.env' });

const app = express();

// Global middlewares
// app.use(helmet());

app.set('view engine', 'ejs');
app.set('views', path.resolve('views'));

app.post(
  '/webhookCheckout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body-parser, reading data from the req.body object
app.use(express.json({ limit: '10kb' }));

app.use(cors());

app.options('*', cors());

app.use(mongoSanitize());

app.use(
  hpp({
    whitelist: [
      'price',
      'averageRating,',
      'maxGroupSize',
      'duration',
      'difficulty',
    ],
  })
);

const limiter = limit({
  max: 1000,
  windowMs: 24 * 60 * 60 * 1000,
});

app.use(limiter);

// Serve static files
app.use(express.static(path.join('public')));
app.use(cookieParser());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(compression());

// Testing middlewares
app.use((req, res, next) => {
  req.requestedAt = new Date();
  // console.log(req.cookies);
  next();
});

// Routes middleware functions
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Undefined middleware function
app.all('*', authController.isLoggedIn, (req, res, next) => {
  return next(
    new AppError(`Can't find ${req.originalUrl} on this server!`, 404)
  );
});

// Global error handler middleware
app.use(globalErrorHandler);

export default app;
