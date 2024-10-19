const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const GenericError = require("../utils/genericError");
const sendEmail = require("../utils/email");
const otpEmailTemplate = require("../utils/otpEmailTemplate");
const Otp = require("../models/otpModel");

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_INVALID_AFTER,
  });

  res.status(201).json({
    status: "success",
    token: token,
    data: {
      user: newUser,
    },
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

  res.status(200).json({
    status: "success",
    token: token,
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({email:req.body.email});
  if(!user) {
    return next(new GenericError("Could not find an account with this email!",404));
  }

  const otpModel = await user.createResetPasswordOtp();
  await user.save({validateBeforeSave: false});

  await sendEmail({
    email : user.email,
    subject: "Password Reset Request for Book Exchange Platform",
    html: otpEmailTemplate(otpModel.otp)
  });

  res.status(200).json({
    status: "success",
    data: {
      otpId : otpModel.otpId
    }
  });
});

exports.updatePasswordUsingOtp = catchAsync(async (req, res, next) => {
  const otpId = req.body.otpId;
  const otp = req.body.otp;
  const newPassword = req.body.password;
  const newConfirmPassword = req.body.confirmPassword;
  if(!otp || !otpId || !newPassword || !newConfirmPassword) {
    return next(new GenericError("Invalid request body", 400));
  }
  const otpModel = await Otp.findById(otpId);
  if(!otpModel) {
    return next(new GenericError("Unable to verify otp, Either the request is invalid or otp has been expired",400));
  }
  const isOtpValid = otpModel.checkOtp(otp,otpModel.otp);
  if(!isOtpValid) {
    return next(new GenericError("Otp is invalid",400));
  }
  const user = await User.findOne({
    email: otpModel.userEmail
  });
  user.password = newPassword;
  user.confirmPassword = newConfirmPassword;
  await user.save();
  await otpModel.delete();
  res.status(200).json({
    status: "success",
    data: {},
    message : "Password changed Successfully!"
  });
});

