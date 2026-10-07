const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) => {         //generateAccessToken is itself a variable that stores fn that takes userId as parameter, 
  //so all in all the fn will return a jwt token, which is stored in this variable.
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};
// here we r passing the payload which is userId and secret token which we extract frm .env to jwt.sign(). 
// jwt.sign() creates the header and uses the secret to generate the signature, then combines the encoded header, payload, and signature into one JWT string.
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};
module.exports = { generateAccessToken, generateRefreshToken };

// so now when the user logs in for the first time,  
// the server checks the login details, if correct, the server will give two token, an access and a refresh, 
// to the browser of the user and whenever the user sends a req, the server will check only the access token 
// which is sent by the browser, if the signature is valid the processes the req otherwise rejecys it...
// access tokens lets the user access to private documents which r protected, 
// when the access token expires, a spare token, the refresh token is sent for bringing another access token 
// nd for that the servr also checks if the signature of the refresh is valid ornot