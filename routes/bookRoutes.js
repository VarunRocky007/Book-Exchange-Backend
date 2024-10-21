const express = require("express");
const booksController = require("../controllers/booksController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.authentication);
router.post("/add", booksController.addBook);
router.get("/self-listing", booksController.getMyBookListing);
router.get("/others-listing", booksController.getOtherBookListing);
router.get("/:id", booksController.getBook);
router.delete("/:id", booksController.deleteBookListing);
router.get("/", booksController.getAllBookListing);
router.patch("/:id", booksController.updateBook);

module.exports = router;
