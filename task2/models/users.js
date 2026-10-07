const mongoose = require("mongoose");   //importing mongoose first into this doc

const userSchema = new mongoose.Schema(      //mongodb is noSql db, so it can accept data in wtv form enetred, but we need a particular format varna koi bhi kuch bhi daal dega
  {                                           // schema makes that blueprint ki data aisa le varna error fek                      
    name: {                              // so yaha blueprint is data shud be name, email,password...ab har field k jo rules h woh uske andar likhenge ki aisa hi aana chahiye ye field
      type: String,
      required: [true, "Name is required"],     //required mai true means ki woh fiels is mandatory, cant skip, if false hota tph could skip..
      trim: true,                               // removes whitespace aage aur peeche se
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,                             
      required: [true, "Email is required"],
      unique: true,                          // mongooose creates a unique index for this field, so that no 2 users can have same email, if same email is entered then error thrown
      lowercase: true,                      //these r all properties , eg agr lowercase ni hai toh usme convert krdega
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],  // checks regex pattern
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [7, "Password must be at least 7 characters"],
    },
  },
  { timestamps: true }              //this adds createdAt and updatedAt fields  along w others
);

module.exports = mongoose.model("User", userSchema);    //schema made the blueprint, now model will become the interface so that data can be entered and further operation/methdos/functions can be used on it to modify it
                                                        // so basically u give data to the model, mongoose checks if it is in the right format using schema, if yes then it makes it into document and stores it in the db, if not then error is thrown

                                                        //moreover,unique k liye no need for writing custom error, unique index enforces that automatically
                                                        //but required k lye laga cuz required is a mongoose validation, so if required field is missing then mongoose will throw error automatically
                                                        //and Validation checks whether the data is valid.
                                    //trim,lowercase,etc dont show err, they directly transform data
                                    //unique doess show err on problem buthats a momgodb duplicate key err not mongoose validation err like req, minlength etc