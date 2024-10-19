const mongoose = require("mongoose");
const validator = require("validator");
const byCrypt = require("bcryptjs");

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
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await byCrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.checkPassword = async function (
  presentPassword,
  userPassword
) {
  return await byCrypt.compare(presentPassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
