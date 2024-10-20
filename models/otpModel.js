const mongoose = require("mongoose");
const byCrypt = require("bcryptjs");

const otpSchema = new mongoose.Schema({
    otp:  String,
    userEmail: String,
    otpVerifiedToken: String,
},{timestamps: true});

otpSchema.index({updatedAt: 1},{expireAfterSeconds: 300});

otpSchema.methods.checkOtp = async function (
    givenOtp,
    presentOtp
  ) {
    return await byCrypt.compare(givenOtp, presentOtp);
  };

otpSchema.methods.checkVerifyToken = async function (
  givenVerifyToken,
  presentVerifyToken
) {
  return await byCrypt.compare(givenVerifyToken, presentVerifyToken);
};
const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;