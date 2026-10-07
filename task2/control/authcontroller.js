const bcrypt = require("bcryptjs"); // passwod hash krne k liye bcrypt lao
const jwt = require("jsonwebtoken");
const User = require("../models/users"); //user mai bana model import kro, cuz it has the schema and model to nenter data into db and also to check if data is in right format or not
const sendEmail = require("../utils/sendEmail");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");

const register = async (req, res) => {
  //register function will be called when user hits the register endpoint, it will take req and res as params, req has the data sent by user in body, res is what we send back to user
  try {
    const { name, email, password } = req.body; // frontend sends json which the express puts in req.body so we destructure here to use it

    if (!name || !email || !password) {
      // req will be rejected if name,email or pasword is missing
      return res.status(400).json({ message: "All fields are required" }); //frontend needs to know what happened to a failed req so it can act accordingly, so we send a json with message and status code 400 which means bad request
    } //status codes help the frontend give an idea what to do next

    if (password.length < 7) {
      return res
        .status(400) //
        .json({ message: "Password must be at least 7 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() }); //async cuz we used await, now program will wait until this finishes,
    if (existingUser) {
      //findOne is a mongoose method which will find the user with the given email in the db, if found then it will return the user object, if not found then it will return null
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); //bcrypt.hash will hash the password, 10 is the salt rounds, higher the number more secure but slower, 10 is a good balance
    //hash is basically adding random trash values to password and 10 is the cost factor as to how many computational rounds while generating hash...

    const user = await User.create({
      //you tell Mongoose user model(which then communicates w mongodb) to create a new user document and enter the data there
      name, //then this whole document is passed onto an object so that you can use the inner objects by .
      email,
      password: hashedPassword, //.create is basically create this document in the database, and give me the resulting document back as a JavaScript/Mongoose object so I can work with it
    });

    sendEmail(
      user.email,
      "Ahoy Captain!",
      `yo ${user.name}, sup? welcome aboard! Your account has been created successfully.`,
    );

    res.status(201).json({
      //reaching here means everything went well and user is created, so we send a json with message and status code 201 which means created
      message: "User registered successfully",
      user: {
        id: user._id, //MongoDB actually STORES the document
        name: user.name, //Mongoose gives you the User model to CREATE/READ/UPDATE/DELETE documents
        email: user.email, //user is the JavaScript object representing the document you just created
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  //login is a varible that stores an async fn which bas req, res as paramteres,
  try {
    //for a request will be passed and a response would be sent.
    const { email, password } = req.body; // so first extract the email nd password from the body of the request
    // into our own local variables email and passowrd.

    if (!email || !password) {
      //if any of em dont exist then we simply show an 400 error or status code cuz invalid data.
      return res
        .status(400)
        .json({ message: "Email and password are required" }); //programs runs ahead only if email nd password r present
    }

    const user = await User.findOne({ email: email.toLowerCase() }); //so now we check whether user w that email exists or not
    //nd for that we first convert email to lowercase and search using findOne cuz if its found then it returns object othrwise null

    if (!user) {
      //so if null we shhow error or give response using status code 401 which means not authenticated as email invalid
      return res.status(401).json({ message: "Invalid email" }); //programs only goes ahead when we find the match of that email
    }
    //so now user variable gets that entire object,
    // now we have entered password nd actual user passwword,
    const isMatch = await bcrypt.compare(password, user.password); //now since we have the password
    if (!isMatch) {
      //we take that entered password nd compare it w the password present in the user we just got,
      return res.status(401).json({ message: "Invalid email or password" });
    }
    //the only catch here is that password stored in db is hashed using bcrypt
    //so it first sees what random salt was actualy used in stored password
    // and then uses the same salt to see whether the entered password matches with this salt or not
    //if problem then again show that same 401 error as not authenticated as password invalid

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    //...but if everything goes alright till here thn we make the tokens and respond back to the user
    // w these tokens and their user data like id, name, email, so that frontend can store it in local storage and use it for further requests to the server

    sendEmail(
      user.email,
      "New login to your account",
      `Hi ${user.name}, we noticed a login to your account at ${new Date().toLocaleString()}. If this wasn't you, please change your password.`,
    );

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
  // here the protect is a variable that stores a function that takes request,response and next function as parameters.
//  So here basically the fn is applicable when the user sends a req,
// after logging in is done. It first hits middleware instead of directly hitting the server,
// basically like protecting the server frm getting directly accessed. Here when the user sends the req,
// it will have that token in it...but the frontend of the user sends it in http Authorization header format....
// so The variable authHeader retreives it. Now if the variable is null or the token doesn't have bearer in the start....
// then it means that we have got invalid data, hence 401 error will be returned....
// but if everything alr, then we extract the token frm this variable as it contains bearer in 0th index
// and the token starts frm 1st index....as soon as we get this token we check if the token is valid or not by checking it's expiry
// nd also if it's valid...and store the object in decoded...
// if the token is invalid or expired then itll throw and error hence we put this fn in try catch block....
// if it works then we put the authenticated user id into the req object...
};


const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    const accessToken = generateAccessToken(user._id);

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { register, login, getProfile, refresh }; //box mai pack krke export krdiya

//400 means invalid data
//409 means conflict (e.g., email already exists)
//500 means internal server error
//401 means not authenticated
//403 means forbidden (e.g., user doesn't have permission to access a resource)
//404 means not found (e.g., resource doesn't exist)
//200 means success
//201 means created (e.g., resource created successfully)
