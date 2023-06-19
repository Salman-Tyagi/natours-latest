import catchAsync from '../utils/catchAsync.js';
import Tour from '../models/tourModel.js';
import Booking from '../models/bookingModel.js';

export const getOverview = catchAsync(async (req, res, next) => {
  // Get data from the database
  const tours = await Tour.find();
  // Generate the template

  // Render the tempalate
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
    user: req.user,
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate(
    'reviews'
  );

  res.status(200).render('tour', {
    tour,
    user: req.user,
  });
});

export const getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
    user: req.user,
  });
};

export const getMyAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My account',
    user: req.user,
  });
};

export const getMyTours = catchAsync(async (req, res) => {
  // Get all the bookings from the database of logged in user
  const bookings = await Booking.find({ user: req.user.id });
  const toursId = bookings.map(booking => booking.tour);

  const tours = await Tour.find({ _id: { $in: toursId } });

  res.status(200).render('overview', {
    title: 'My tours',
    tours,
    user: req.user,
  });
});
