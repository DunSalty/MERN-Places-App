const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/httpError");
const User = require("../models/user");
const { validationResult } = require("express-validator");

exports.getUsers = async (req, res, next) => {
  const users = await User.find({}, "-password");

  res.status(200).json({
    users: users.map((user) => {
      return {
        id: user._id.toString(),
        ...user._doc,
      };
    }),
  });
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs.", 422));
  }

  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    return next(new HttpError("User email already in use.", 422));
  }

  const hashedPw = await bcrypt.hash(password, 12);

  const user = new User({
    name,
    email,
    password: hashedPw,
    image: req.file.path,
    places: [],
  });

  await user.save();

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.PRIVATE_KEY,
    { expiresIn: "1h" }
  );

  res.status(201).json({
    user: { email: user.email, userId: user._id.toString(), token: token },
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });

  if (!user) {
    return next(new HttpError("Invalid email or password.", 403));
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return next(new HttpError("Invalid email or password.", 403));
  }

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.PRIVATE_KEY,
    { expiresIn: "1h" }
  );

  res.json({
    message: "Logged in!",
    user: { email: user.email, userId: user._id.toString(), token: token },
  });
};
