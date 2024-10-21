const express = require("express");
const userRouter = require("./routes/userRoutes");
const bookRouter = require("./routes/bookRoutes");
const GenericError = require("./utils/genericError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

app.use(express.json());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/books", bookRouter);

app.all("*", (req, res, next) => {
  next(new GenericError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
