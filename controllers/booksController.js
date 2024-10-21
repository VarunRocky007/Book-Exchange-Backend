const catchAsync = require("../utils/catchAsync");
const Book = require("../models/bookModel");
const GenericError = require("../utils/genericError");

exports.addBook = catchAsync(async (req, res, next) => {
  const title = req.body.title;
  const author = req.body.author;
  const genre = req.body.genre;
  const availabilityStatus = req.body.availabilityStatus;
  const condition = req.body.condition;

  if (!title || !author || !genre || !availabilityStatus || !condition) {
    return next(new GenericError("Invalid request body!", 400));
  }

  const authenticatedUser = req.user;

  const newBook = await Book.create({
    title: title,
    author: author,
    genre: genre,
    availabilityStatus: availabilityStatus,
    condition: condition,
    owner: authenticatedUser,
  });

  const response = {
    id: newBook._id,
    title: newBook.title,
    author: newBook.author,
    genre: newBook.genre,
    availabilityStatus: newBook.availabilityStatus,
    condition: newBook.condition,
  };

  res.status(201).json({
    status: "success",
    data: {
      book: response,
    },
  });
});

exports.getBook = catchAsync(async (req, res, next) => {
  const bookId = req.params.id;

  const book = await Book.findById(bookId);

  if (!book) {
    return next(new GenericError("Book not found!", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      book: book,
    },
  });
});

exports.getOtherBookListing = catchAsync(async (req, res, next) => {
  const books = await Book.find({
    owner: { $ne: req.user._id },
  });

  res.status(200).json({
    status: "success",
    data: {
      books: books,
    },
  });
});

exports.getAllBookListing = catchAsync(async (req, res, next) => {
  const books = await Book.find();

  res.status(200).json({
    status: "success",
    data: {
      books: books,
    },
  });
});

exports.getMyBookListing = catchAsync(async (req, res, next) => {
  const books = await Book.find({
    owner: req.user._id,
  });

  res.status(200).json({
    status: "success",
    data: {
      books: books,
    },
  });
});

exports.deleteBookListing = catchAsync(async (req, res, next) => {
  const bookId = req.params.id;
  const book = await Book.findById(bookId);

  if (!book) {
    return next(new GenericError("Book not found!", 404));
  }

  if (book.owner._id.toString() !== req.user._id.toString()) {
    return next(
      new GenericError("You are not authorized to delete this book!", 401)
    );
  }

  book.delete();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateBook = catchAsync(async (req, res, next) => {
  const bookId = req.params.id;

  const book = await Book.findById(bookId);

  if (!book) {
    return next(new GenericError("Book not found!", 404));
  }

  if (book.owner._id.toString() !== req.user._id.toString()) {
    return next(
      new GenericError("You are not authorized to update this book!", 401)
    );
  }

  const title = req.body.title;
  const author = req.body.author;
  const genre = req.body.genre;
  const availabilityStatus = req.body.availabilityStatus;
  const condition = req.body.condition;

  if (!title || !author || !genre || !availabilityStatus || !condition) {
    return next(new GenericError("Invalid request body!", 400));
  }

  await book.updateOne({
    title: title,
    author: author,
    genre: genre,
    availabilityStatus: availabilityStatus,
    condition: condition,
  });

  const updatedBook = await Book.findById(bookId);

  res.status(200).json({
    status: "success",
    data: {
      book: updatedBook,
    },
  });
});
