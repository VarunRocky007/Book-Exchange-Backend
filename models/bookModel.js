const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "This is a required field"],
  },
  author: {
    type: String,
    required: [true, "This is a required field"],
  },
  genre: {
    type: String,
    required: [true, "This is a required field"],
  },
  condition: {
    type: String,
    required: [true, "This is a required field"],
  },
  availabilityStatus: {
    type: String,
    required: [true, "This is a required field"],
  },
  location: {
    type: String,
  },
  description: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "This is a required field"],
  },
});

bookSchema.pre(/^find/, function (next) {
  this.populate({
    path: "owner",
    select: "name email",
  });
  next();
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
