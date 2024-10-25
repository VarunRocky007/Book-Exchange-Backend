const catchAsync = require("../utils/catchAsync");
const Book = require("../models/bookModel");
const GenericError = require("../utils/genericError");

exports.addBook = catchAsync(async (req, res, next) => {
  const title = req.body.title;
  const author = req.body.author;
  const genre = req.body.genre;
  const availabilityStatus = req.body.availabilityStatus;
  const condition = req.body.condition;
  const location = req.body.location;
  const description = req.body.description;

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
    location: location,
    description: description,
  });

  const response = {
    id: newBook._id,
    title: newBook.title,
    author: newBook.author,
    genre: newBook.genre,
    availabilityStatus: newBook.availabilityStatus,
    condition: newBook.condition,
    location: newBook.location,
    description: newBook.description,
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
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;
  const totalBooksCount = await Book.find({
    owner: { $ne: req.user._id },
  }).countDocuments();
  const books = await Book.find({
    owner: { $ne: req.user._id },
  })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: "success",
    data: {
      books: books,
    },
    meta: {
      pagination: {
        page: page,
        totalPages: Math.ceil(totalBooksCount / limit),
        limit: limit,
      },
    },
  });
});

exports.getAllBookListing = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;
  const totalBooksCount = await Book.find().countDocuments();
  const books = await Book.find().skip(skip).limit(limit);

  res.status(200).json({
    status: "success",
    data: {
      books: books,
    },
    meta: {
      pagination: {
        page: page,
        totalPages: Math.ceil(totalBooksCount / limit),
        limit: limit,
      },
    },
  });
});

exports.getMyBookListing = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;
  const totalBooksCount = await Book.find({
    owner: req.user._id,
  }).countDocuments();
  const books = await Book.find({
    owner: req.user._id,
  })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: "success",
    data: {
      books: books,
    },
    meta: {
      pagination: {
        page: page,
        totalPages: Math.ceil(totalBooksCount / limit),
        limit: limit,
      },
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

exports.searchBook = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;
  const query = req.query.q;
  if (query) {
    const totalBooksCount = await Book.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { genre: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { author: { $regex: query, $options: "i" } },
      ],
    }).countDocuments();
    const books = await Book.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { genre: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { author: { $regex: query, $options: "i" } },
      ],
    })
      .skip(skip)
      .limit(limit);
    res.status(200).json({
      status: "success",
      data: {
        books: books,
      },
      meta: {
        pagination: {
          page: page,
          totalPages: Math.ceil(totalBooksCount / limit),
          limit: limit,
        },
      },
    });
  }
  const genre = req.query.genre;
  const location = req.query.location;
  const title = req.query.title;
  const author = req.query.author;
  const list = [];
  if (genre) {
    list.push({ genre: { $regex: genre, $options: "i" } });
  }
  if (location) {
    list.push({ location: { $regex: location, $options: "i" } });
  }
  if (title) {
    list.push({ title: { $regex: title, $options: "i" } });
  }
  if (author) {
    list.push({ author: { $regex: author, $options: "i" } });
  }
  if (!list.length) {
    return next(new GenericError("Invalid query parameters!", 400));
  }
  const totalBooksCount = await Book.find({
    $or: list,
  }).countDocuments();
  const books = await Book.find({
    $or: list,
  })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: "success",
    data: {
      books: books,
    },
    meta: {
      pagination: {
        page: page,
        totalPages: Math.ceil(totalBooksCount / limit),
        limit: limit,
      },
    },
  });
});
