const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.patch("/reset-password", authController.resetPasswordUsingOtp);

router.use(authController.authentication);

router.patch("/update-password",authController.updatePassword);


module.exports = router;
