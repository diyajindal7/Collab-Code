const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    avatar: {
      type: String,
      default: ""
    },
    createdRooms: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "Room"
}],

joinedRooms: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "Room"
}],
  },
  
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);