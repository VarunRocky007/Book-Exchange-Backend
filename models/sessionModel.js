const mongoose = require("mongoose");
const { createHash } = require("crypto");

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "This is a required field"],
  },
  sessionToken: {
    type: String,
    required: [true, "This is a required field"],
  },
});

sessionSchema.pre("save", async function (next) {
  this.sessionToken = createHash("sha256")
    .update(this.sessionToken)
    .digest("hex");
  next();
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
