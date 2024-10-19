const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const GenericError = require("../utils/genericError");

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
