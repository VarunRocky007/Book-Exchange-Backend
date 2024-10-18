const mongoose = require("mongoose");
const validator = require("validator");

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
  },
  passwordConfirm: {
    type: String,
    required: [true, "This is a required field"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
