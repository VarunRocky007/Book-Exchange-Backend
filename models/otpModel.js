const mongoose = require("mongoose");
const byCrypt = require("bcryptjs");

const otpSchema = new mongoose.Schema({
    otp:  String,
    userEmail: String,
},{timestamps: true});

otpSchema.index({updatedAt: 1},{expireAfterSeconds: 300});

otpSchema.methods.checkOtp = async function (
    givenOtp,
    presentOtp
  ) {
    return await byCrypt.compare(givenOtp, presentOtp);
  };

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;