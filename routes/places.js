const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const placesController = require("../controllers/places");
const isAuth = require("../middleware/isAuth");

router.get("/:placeId", placesController.getPlaceById);

router.get("/user/:userId", placesController.getUserPlaces);

router.use(isAuth);

router.post(
  "/",
  [
    body("title").notEmpty(),
    body("description").isLength({ min: 5 }),
    body("address").notEmpty(),
  ],
  placesController.createPlace
);

router.patch(
  "/:placeId",
  [body("title").notEmpty(), body("description").isLength({ min: 5 })],
  placesController.updatePlace
);

router.delete("/:placeId", placesController.deletePlace);

module.exports = router;
