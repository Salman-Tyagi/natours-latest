import express from 'express';
import * as viewController from '../controllers/viewController.js';
import * as authController from '../controllers/authController.js';
import * as bookingController from '../controllers/bookingController.js';

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingSession,
  authController.isLoggedIn,
  viewController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', viewController.getLoginForm);
router.get('/my-tours', authController.protect, viewController.getMyTours);

router.get(
  '/myAccount',
  authController.haveUser,
  authController.isLoggedIn,
  viewController.getMyAccount
);

export default router;
