const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); //usually it conects to the default dns server of the network,
//but sometimes it fails to connect to that server, so we set it to google and cloudflare dns servers which are more reliable
require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const logger = require("./config/logger");
const connectDB = require("./db_connector/db");
const authRoutes = require("./routes/authRoutes");
const app = express();
app.use(express.json());
const auctionRoutes = require("./routes/auctionRoutes");

app.use("/api/auctions", auctionRoutes);

app.use(morgan("dev"));

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.send("API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
connectDB();
