const jwt = require("jsonwebtoken");

const HttpError = require("../models/httpError");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("Authentication Failed!");
    }

    const decodedToken = jwt.verify(token, "somesupersecretkey");
    req.userId = decodedToken.userId;
    next();
  } catch (err) {
    return next(new HttpError("Authentication Failed!", 403));
  }
};
