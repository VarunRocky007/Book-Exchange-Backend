const User = require("../models/userModel.js");
const catchAsync = require("../utils/catchAsync.js");

exports.userDetails = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    status: "success",
    data: {
      user: user,
    },
  });
});
