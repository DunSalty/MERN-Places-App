const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const usersController = require("../controllers/users");

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  [
    body("name").notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 5 }),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

module.exports = router;
