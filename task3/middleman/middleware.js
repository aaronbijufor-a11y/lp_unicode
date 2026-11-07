const jwt = require("jsonwebtoken");
const User = require("../models/users");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); //checks or validates the signature nd if correct then decode the id from its payload
    req.userId = decoded.id;
    next(); //next() doesn't specifically mean run the next fn. It means "continue to the next handler."
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

//new code
const authorizeRoles = (...allowedRoles) => {
  //... is a rest parameter, it collects arguments into an array, cuz the args depend on how the fn is called, simce variable length of parameters and not fixed, we use rest parameter which collects these paramateres into one array
  return async (req, res, next) => {
    //... ts helps in reusabilty dawg
    try {
      const user = await User.findById(req.userId).select("role"); //actually hits the db to see if user details r correct, if not then throw error
      if (!user) {
        //findById is a built-in Mongoose Model method cuz Mongoose knows that _id is the document's unique identifier. could also use .find or .findOne, except.find wil give an array of matching documents
        return res.status(401).json({ message: "User no longer exists" }); //user not found in db, idk who u r bro
      }
      if (!allowedRoles.includes(user.role)) {
        return res
          .status(403) //ik who u r, but u r forbidden to do ts
          .json({ message: "You do not have permission to do this" });
      }
      req.userRole = user.role; //even if user said its role, still we personally checked and put the role in db to the req body
      next();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
};
//new code
module.exports = { protect, authorizeRoles };

//middleware is the middle person btwn client and server.
// It is used to verify the token and check if the user is authorized to access the requested resource.
// If the token is valid, it allows the request to proceed to the next middleware or route handler.
// If not, it responds with an error message indicating that the user is not authorized.
