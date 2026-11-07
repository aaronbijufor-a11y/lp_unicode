const express = require("express");
const {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
} = require("../control/auctionController");
const { protect, authorizeRoles } = require("../middleman/middleware");
//protect: Checks whether the user is authenticated.
//authorizeRoles: Checks whether the authenticated user has permission to access the route.
const { handleImageUpload } = require("../middleman/uploadMiddleware");
const router = express.Router();

router.get("/", protect, getAuctions);
router.get("/:id", protect, getAuctionById);

router.post("/", protect, authorizeRoles("seller", "admin"), handleImageUpload, createAuction);
router.put("/:id", protect, authorizeRoles("seller", "admin"), handleImageUpload, updateAuction);
router.delete(
  "/:id",
  protect,
  authorizeRoles("seller", "admin"),
  deleteAuction,
);

module.exports = router;
