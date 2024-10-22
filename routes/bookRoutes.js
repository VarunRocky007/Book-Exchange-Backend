const express = require("express");
const booksController = require("../controllers/booksController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.authentication);
router.get("/search", booksController.searchBook);
router.post("/add", booksController.addBook);
router.get("/me", booksController.getMyBookListing);
router.get("/other", booksController.getOtherBookListing);
router.get("/:id", booksController.getBook);
router.delete("/:id", booksController.deleteBookListing);
router.get("/", booksController.getAllBookListing);
router.patch("/:id", booksController.updateBook);

module.exports = router;
