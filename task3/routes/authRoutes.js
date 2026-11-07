const express = require("express");
const { register, login, getProfile, refresh } = require("../control/authcontroller");
const { protect } = require("../middleman/middleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/profile", protect, getProfile);
//If a POST request comes to this path, route it to this function
module.exports = router;

//node helps js run the file on a server, express sits on top of node and helps us make a server and handle requests and responses,
// express is basically a framework for node
