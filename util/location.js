const axios = require("axios");
const HttpError = require("../models/httpError");
const API_KEY = process.env.COORD_API_KEY;

async function getCoordsFromAddress(address) {
  const response = await axios.get(
    `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(
      address
    )}&format=json`
  );

  const data = response.data[0];

  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError(
      "Could not find location for the specified address.",
      422
    );
  }

  const coorLat = data.lat;
  const coorLon = data.lon;
  const coordinates = {
    lat: coorLat,
    lon: coorLon,
  };

  return coordinates;
}

module.exports = getCoordsFromAddress;
