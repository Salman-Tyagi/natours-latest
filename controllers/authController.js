import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Email from '../utils/email.js';

export const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    // secure: true,
    httpOnly: true,
    secure: req.secure,
  };

  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  newUser.active = undefined;
  newUser.role = undefined;
  newUser.password = undefined;

  const url = `${req.protocol}://${req.get('host')}/myAccount`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

export const login = catchAsync(async (req, res, next) => {
  // Check email and password are exists
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check user and password are valid
  const user = await User.findOne({ email, active: { $ne: false } }).select(
    '+password -__v'
  );

  if (
    !user ||
    !(await user.correctPassword(req.body.password, user.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // user.role = undefined;
  user.active = undefined;
  user.password = undefined;

  // If everything ok, send the token to client
  createSendToken(user, 200, req, res);
});

export const protect = catchAsync(async (req, res, next) => {
  // Get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError('You are not logged in! Please login to get access.', 401)
    );

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check user still exists after verify token
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('No user exists for this token', 404));
  }

  // Check user changed the password after verifying the token
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }

  // Grant access to the user
  req.user = currentUser;
  return next();
});

export const isLoggedIn = async (req, res, next) => {
  // Get token and check if it's there

  if (req.cookies.jwt) {
    try {
      // Verify token
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      // Check user still exists after verify token
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // Check user changed the password after verifying the token
      if (currentUser.passwordChangedAfter(decoded.iat)) {
        res.cookie('jwt', '');
        res.redirect('/login');
      }

      // Grant access to the user
      req.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  return next();
};

export const haveUser = (req, res, next) => {
  // 1. If if jwt is exist
  // 2. If invalidate jwt --> remove cookie and redirect to login
  // 3. Move it to next middleware
  if (!req.cookies.jwt) return res.redirect('/login');
  next();
};

export const logout = async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are forbidden to do this action!', 403));
    }

    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on the posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError('Incorrect email address! Please check your email', 404)
    );

  // Generate a random token using inbuilt node crypto module
  const token = user.createpasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send the token to the client with resetUrl by nodemailer
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${token}`;

  try {
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent successfully',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Error in sending email', 500);
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  // Check user exists and token not expired, then set the password
  if (!user) {
    return next(new AppError('Your password reset link has expired', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  // Update the passwordChangedAt property method

  // Log in the user, send JWT
  createSendToken(user, 201, req, res);
});
