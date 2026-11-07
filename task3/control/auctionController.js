const mongoose = require("mongoose");
const Auction = require("../models/ucAuctions");
const { uploadImages, deleteImages } = require("../utils/cloudinaryHelpers");
const logger = require("../config/logger");

const handleError = (error, res) => {
  //hrlper fn to handle errors in a consistent way across all controller functions, so that we don't have to repeat the same error handling code in each function. It takes the error object and the response object as parameters, and sends an appropriate response based on the type of error.
  if (error.name === "ValidationError") {
    //Mongoose validation failed, such as a title shorter than three characters.
    const messages = Object.values(error.errors).map((e) => e.message); //error.errors is an object containing multiple error objects.
    //Objects.values extracts all the VALUES from an object, noy keys and puts them into an array.
    //so if while writing title,dec,starttimr,etc,user makes a mistake, then all the error messages will be collected into an array and sent to the frontend
    //so that it can display them to the user.
    return res.status(400).json({ message: messages.join(", ") });
  }
  if (error.name === "CastError") {
    //Mongoose couldn't convert a supplied value into the required data type.
    return res.status(400).json({ message: `Invalid value for ${error.path}` });
  }
  logger.error({ err: error.message }, "Unexpected server error");
  res.status(500).json({ message: "Server error", error: error.message });
};

const canManage = (auction, req) =>
  req.userRole === "admin" || auction.seller.toString() === req.userId;
//while creating auction, we store the seller's ObjectId in the auction document.
// When we retrieve the auction document, we can compare the seller's ObjectId with the userId from the token to check if the user is the seller of that auction.
// If they match, the user can manage (update or delete) that auction. If the user is an admin, they can manage any auction.
//However, === is preferable because:
//1. It avoids unexpected type coercion.
//2. It makes our intention explicit.
//3. It's the standard practice in modern JavaScript.

const createAuction = async (req, res) => {
  try {
    const { title, description, category, startingPrice, startTime, endTime } =
      req.body;

    const start = new Date(startTime); //The client sends dates through the request body, usually as strings. new Date() converts those strings into JavaScript Date objects.
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end)) {
      //Checks whether either date is invalid.
      return res
        .status(400)
        .json({ message: "Valid startTime and endTime are required" });
    }
    if (start <= new Date()) {
      //Ensures the auction starts in the future.
      return res
        .status(400)
        .json({ message: "Start time must be in the future" });
    } //Auction schema already checked whether endTime is after startTime. so waps krne ki zarurat ni h

    const auction = new Auction({
      title,
      description,
      category,
      startingPrice,
      startTime: start,
      endTime: end,
      seller: req.userId, // from the token, not the body
    });
    await auction.validate(); // validate BEFORE uploading, so bad input never wastes uploads

    auction.images = await uploadImages(req.files);
    await auction.save();
    logger.info(
      { auctionId: auction._id, seller: req.userId },
      "Auction created",
    );
    res.status(201).json({ message: "Auction created", auction });
  } catch (error) {
    handleError(error, res);
  }
};

const getAuctions = async (req, res) => {
  try {
    const { status, category } = req.query; //jo query hai usme se hi extract krke var ko assign
    const filter = {}; //This is an empty JavaScript object for dynamically constructing a MongoDB query based on what the user requests.
    const now = new Date();

    if (status) {
      const s = status.toUpperCase();
      if (s === "UPCOMING")
        filter.startTime = { $gt: now }; //Find auctions whose startTime is greater than the current date and time. Means the value must be greater than now.
      else if (s === "ACTIVE") {
        filter.startTime = { $lte: now };
        filter.endTime = { $gt: now }; //An auction is active only when: Its starting time has already arrived or Its ending time hasn't arrived yet.
      } else if (s === "ENDED") filter.endTime = { $lte: now };
      else
        return res
          .status(400)
          .json({ message: "Status must be UPCOMING, ACTIVE, or ENDED" });
    } //basically we're adding a property to filter object based on the status query parameter. If the user wants to see only upcoming auctions, we add a startTime property to filter with a value of { $gt: now }, which means "greater than now". If the user wants to see only active auctions, we add both a startTime property with a value of { $lte: now } (less than or equal to now) and an endTime property with a value of { $gt: now } (greater than now). If the user wants to see only ended auctions, we add an endTime property with a value of { $lte: now } (less than or equal to now). If the user provides an invalid status value, we return a 400 Bad Request response with an error message.

    if (category) filter.category = category;

    const auctions = await Auction.find(filter) //Actually fetching the auctions from MongoDB
      .populate("seller", "name email")
      //Look at the seller field. Find the corresponding User document using its ObjectId.
      //Retrieve only the name and email fields from that User document.
      //Replace the seller's ObjectId in the returned result with the populated user information.

      .sort({ createdAt: -1 }); //newest auction appears first.

    res.status(200).json({ count: auctions.length, auctions });
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/auctions/:id
const getAuctionById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid auction ID" });
    }
    const auction = await Auction.findById(req.params.id).populate(
      "seller",
      "name email",
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    res.status(200).json({ auction });
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/auctions/:id
const updateAuction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      //It checks whether the supplied value can be used as a MongoDB ObjectId.
      return res.status(400).json({ message: "Invalid auction ID" });
    }
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (!canManage(auction, req)) {
        logger.warn({ auctionId: auction._id, by: req.userId }, "Unauthorized update attempt");
      return res
        .status(403)
        .json({ message: "You can only update your own auctions" });
    }
    if (auction.status === "ENDED") {
      return res
        .status(400)
        .json({ message: "Ended auctions cannot be updated" });
    }

    // Only these fields can change. Never seller, never images here.
    const allowed = [
      "title",
      "description",
      "category",
      "startingPrice",
      "startTime",
      "endTime",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) auction[field] = req.body[field];
    });

    const newFiles = req.files || [];
    if (auction.images.length + newFiles.length > 5) {
      return res
        .status(400)
        .json({ message: "An auction can have at most 5 images" });
    }

    await auction.validate();

    if (newFiles.length) {
      const newImages = await uploadImages(newFiles);
      auction.images.push(...newImages);
    }

    await auction.save();
    logger.info({ auctionId: auction._id, by: req.userId }, "Auction updated");

    res.status(200).json({ message: "Auction updated", auction });
  } catch (error) {
    handleError(error, res);
  }
};

// DELETE /api/auctions/:id
const deleteAuction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid auction ID" });
    }
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (!canManage(auction, req)) {
        logger.warn({ auctionId: auction._id, by: req.userId }, "Unauthorized delete attempt");
      return res
        .status(403)
        .json({ message: "You can only delete your own auctions" });
    }

    await deleteImages(auction.images);

    await auction.deleteOne();
    logger.info({ auctionId: auction._id, by: req.userId }, "Auction deleted");

    res.status(200).json({ message: "Auction deleted" });
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
};
