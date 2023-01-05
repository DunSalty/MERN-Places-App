const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const HttpError = require("../models/httpError");
const getCoordsFromAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

exports.getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Could not find place.", 500);
    return next(error);
  }

  if (!place) {
    return next(new HttpError("No place found with the provided id.", 404));
  }

  res.json({ place: { ...place._doc, id: place._id.toString() } });
};

exports.getUserPlaces = async (req, res, next) => {
  const userId = req.params.userId;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError("Could not find places.", 500);
    return next(error);
  }

  if (!places) {
    return next(new HttpError("No places found with the provided id.", 404));
  }

  res.json({
    places: places.map((place) => {
      return { ...place._doc, id: place._id.toString() };
    }),
  });
};

exports.createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs.", 422));
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsFromAddress(address);
  } catch (error) {
    return next(error);
  }

  const newPlace = new Place({
    title,
    description,
    image: req.file.path,
    address,
    location: coordinates,
    creator: req.userId,
  });

  await newPlace.save();

  const user = await User.findById(req.userId);
  user.places.push(newPlace._id);
  await user.save();

  res.status(201).json({ place: newPlace });
};

exports.updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs.", 422));
  }

  const placeId = req.params.placeId;
  const { title, description } = req.body;

  const place = await Place.findById(placeId);
  if (!place) {
    return next(new HttpError("No place found with the provided id.", 404));
  }

  if (req.userId.toString() !== place.creator.toString()) {
    return next(new HttpError("Not Authorized.", 401));
  }

  place.title = title;
  place.description = description;
  await place.save();

  res.status(200).json({ place: place });
};

exports.deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;
  const place = await Place.findById(placeId).populate("creator");

  if (!place) {
    const error = new HttpError("Could not find place.", 404);
    return next(error);
  }

  if (req.userId.toString() !== place.creator._id.toString()) {
    return next(new HttpError("Not Authorized.", 401));
  }

  place.creator.places.pull(placeId);
  await place.creator.save();
  await Place.findByIdAndRemove(placeId);
  fs.unlink(path.join(__dirname, "..", place.image), (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted post successfully." });
};
