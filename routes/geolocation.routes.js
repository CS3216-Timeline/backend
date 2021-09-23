const express = require("express");
const router = express.Router();
const GeolocationService = require('../services/GeolocationService');
const auth = require("../middleware/auth");
const logger = require("../middleware/logger")
const geolocationService = new GeolocationService();

router.get("/locations", auth, async (req, res, next) => {
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
    logger.logError(req, err)
    next(err);
  }
});

router.get("/features", auth, async (req, res, next) => {
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
    logger.logError(req, err)
    next(err);
  }
});

module.exports = router;
