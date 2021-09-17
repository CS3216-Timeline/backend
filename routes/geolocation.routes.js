const express = require("express");
const router = express.Router();
const passport = require('passport');
const GeolocationService = require('../services/GeolocationService');

const geolocationService = new GeolocationService();

router.get("/locations", passport.authenticate(['jwt'], {
  session: false
}), async (req, res, next) => {
  const {
    searchText,
    longitude,
    latitude
  } = req.query;
  try {
    const suggestions = await geolocationService.getLocationSuggestions(searchText, longitude, latitude)
    res.status(200).json({
      suggestions
    })
  } catch (err) {
    next(err);
  }
});

router.get("/features", passport.authenticate(['jwt'], {
  session: false
}), async (req, res, next) => {
  const {
    longitude,
    latitude
  } = req.query;
  try {
    const features = await geolocationService.getGeographicFeatures(longitude, latitude)
    res.status(200).json({
      features
    })
  } catch (err) {
    next(err);
  }
});

module.exports = router;
