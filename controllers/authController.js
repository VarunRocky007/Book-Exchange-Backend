const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const { createHash } = require("crypto");
const jwt = require("jsonwebtoken");
const GenericError = require("../utils/genericError");
const sendEmail = require("../utils/email");
const otpEmailTemplate = require("../utils/otpEmailTemplate");
const Otp = require("../models/otpModel");
const Session = require("../models/sessionModel");
const { v4: uuidv4 } = require("uuid");
const byCrypt = require("bcryptjs");

exports.authentication = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(new GenericError("Unauthorized access!", 401));
  }
  const encodedToken = createHash("sha256").update(token).digest("hex");
  const session = await Session.findOne({ sessionToken: encodedToken });
  if (!session) {
    return next(new GenericError("Invalid token!", 401));
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) {
    session.delete();
    return next(new GenericError("Invalid token!", 401));
  }
  if (user.checkPasswordChangeTime(decoded.iat)) {
    session.delete();
    return next(new GenericError("Invalid Session!", 401));
  }
  req.user = user;
  req.token = token;
  next();
});

exports.validateToken = catchAsync(async (req, res, next) => {
  const token = req.body.token;
  if (!token) {
    return next(new GenericError("Invalid Request Body!", 401));
  }
  const encodedToken = createHash("sha256").update(token).digest("hex");
  const session = await Session.findOne({ sessionToken: encodedToken });
  if (!session) {
    return {
      status: "fail",
      data: {
        isValid: false,
      },
      message: "Invalid token!",
    };
  }
  return {
    status: "success",
    data: {
      isValid: true,
    },
    message: "Token is valid",
  };
});

exports.signup = catchAsync(async (req, res) => {
  await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  res.status(201).json({
    status: "success",
    message: "Account created successfully!",
  });
});

exports.logout = catchAsync(async (req, res) => {
  const encodedToken = createHash("sha256").update(req.token).digest("hex");
  const session = await Session.findOne({ sessionToken: encodedToken });
  session.delete();
  res.status(200).json({
    status: "success",
    message: "Logged out successfully!",
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new GenericError("Email or Password cannot be empty", 400));
  }

  const user = await User.findOne({
    email: email,
  }).select("+password");
  const isCorrectPassword = await user.checkPassword(password, user.password);
  if (!user || !isCorrectPassword) {
    return next(new GenericError("Incorrect email or password", 401));
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_INVALID_AFTER,
  });

  await Session.create({
    sessionToken: token,
    userId: user._id,
  });

  res.status(200).json({
    status: "success",
    token: token,
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new GenericError("Could not find an account with this email!", 404)
    );
  }

  const otpModel = await user.createResetPasswordOtp();
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user.email,
    subject: "Password Reset Request for Book Exchange Platform",
    html: otpEmailTemplate(otpModel.otp),
  });

  res.status(200).json({
    status: "success",
    data: {
      otpId: otpModel.otpId,
    },
  });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  const otpId = req.body.otpId;
  const otp = req.body.otp;
  if (!otp || !otpId) {
    return next(new GenericError("Invalid request body", 400));
  }
  const otpModel = await Otp.findById(otpId);
  if (!otpModel) {
    return next(
      new GenericError(
        "Unable to verify otp, Either the request is invalid or otp has been expired",
        400
      )
    );
  }
  const isOtpValid = await otpModel.checkOtp(otp, otpModel.otp);
  if (!isOtpValid) {
    return next(new GenericError("Otp is invalid", 400));
  }
  const verifiedToken = uuidv4();
  otpModel.otpVerifiedToken = await byCrypt.hash(verifiedToken, 12);
  await otpModel.save();
  res.status(200).json({
    status: "success",
    data: {
      verifyToken: verifiedToken,
    },
    message: "Otp verified Successfully!",
  });
});

exports.resetPasswordUsingOtp = catchAsync(async (req, res, next) => {
  const otpId = req.body.otpId;
  const verifyToken = req.body.verifyToken;
  const newPassword = req.body.password;
  const newConfirmPassword = req.body.confirmPassword;
  if (!verifyToken || !otpId || !newPassword || !newConfirmPassword) {
    return next(new GenericError("Invalid request body", 400));
  }
  const otpModel = await Otp.findById(otpId);
  if (!otpModel) {
    return next(
      new GenericError(
        "Unable to verify otp, Either the request is invalid or otp has been expired",
        400
      )
    );
  }
  const isOtpVerified = await otpModel.checkVerifyToken(
    verifyToken,
    otpModel.otpVerifiedToken
  );
  if (!isOtpVerified) {
    return next(new GenericError("Otp is not verified", 400));
  }
  const user = await User.findOne({
    email: otpModel.userEmail,
  });
  user.password = newPassword;
  user.confirmPassword = newConfirmPassword;
  await user.save();
  await otpModel.delete();
  res.status(200).json({
    status: "success",
    data: {},
    message: "Password changed Successfully!",
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  const newConfirmPassword = req.body.newConfirmPassword;
  if (!currentPassword || !newConfirmPassword || !newPassword) {
    return next(new GenericError("Invalid request body", 400));
  }
  const currentUser = await User.findById(req.user._id).select("+password");
  const isCorrectPassword = await currentUser.checkPassword(
    currentPassword,
    currentUser.password
  );

  if (!isCorrectPassword) {
    return next(new GenericError("The current password is incorrect", 400));
  }
  currentUser.password = newPassword;
  currentUser.confirmPassword = newConfirmPassword;

  await currentUser.save();

  res.status(200).json({
    status: "success",
    data: {},
    message: "Password changed Successfully!",
  });
});
