const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["electronics", "fashion", "art", "historical artifacts", "sculptures", "grains", "flats", "vehicles", "shops", "kitchenware", "books", "other"],
        message: "Invalid category",
      },
    },
    startingPrice: {
      type: Number,
      required: [true, "Starting price is required"],
      min: [1, "Starting price must be at least 1"],
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
      validate: {
        validator: function (value) {   // fn that checks whether a condition is satisfied.
          return value > this.startTime;    //value represents the value being validated (here, endTime) this.startTime accesses the start time of the current auction document.
        },
        message: "End time must be after start time",
      },    //inorder to to use this operator we need to use normal fn instead of arrow fn, 
      //cuz normal fn will help u refer to the current document unlike arrow fn which will refer to the global object and not the current document
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId, //field stores mongoose ObjectId, which is a unique identifier for documents in MongoDB, and it is used to reference the seller of the auction item.
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

auctionSchema.virtual("status").get(function () {
  const now = new Date();
  if (now < this.startTime) return "UPCOMING";
  if (now >= this.endTime) return "ENDED";
  return "ACTIVE";
});

module.exports = mongoose.model("Auction", auctionSchema);