const mongoose = require("mongoose");
const validator = require("validator");
const byCrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");
const Otp = require("./otpModel");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "This is a required field"],
  },
  email: {
    type: String,
    required: [true, "This is a required field"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "This is a required field"],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "This is a required field"],
    validate: {
      validator: function (confirmPassword) {
        return confirmPassword === this.password;
      },
      message: "Passwords are not the same!",
    },
    select: false,
  },
  passwordResetOtpId: {
    type: String,
    select: false,
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await byCrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now();
  next();
});

userSchema.methods.checkPassword = async function (
  presentPassword,
  userPassword
) {
  return await byCrypt.compare(presentPassword, userPassword);
};

userSchema.methods.createResetPasswordOtp = async function () {
  const resetOtp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  if (this.passwordResetOtpId != null) {
    await Otp.findByIdAndDelete(this.passwordResetOtpId);
  }

  const newOtpModel = await Otp.create({
    otp: await byCrypt.hash(resetOtp, 10),
    userEmail: this.email,
  });
  this.passwordResetOtpId = newOtpModel._id;
  return {
    otp: resetOtp,
    otpId: this.passwordResetOtpId,
  };
};

userSchema.methods.checkPasswordChangeTime = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changeTimeStamp;
  }
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
