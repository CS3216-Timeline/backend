const axios = require("axios")
require("dotenv").config();
const mapboxApiKey = process.env.MAPBOX_APP_SECRET

const STARTING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places/";

class MapboxService {
  constructor() { }

  async getLocationSuggestions(searchText, longitude, latitude) {
    try {
      const url = `${STARTING_URL}${searchText}.json?worldview=cn&limit=10&access_token=${mapboxApiKey}&proximity=${longitude},${latitude}`;
      const res = await axios.get(url);
      const suggestionsFromSearch = res.data.features.map((location) => {
        return {
          place_name: location.place_name,
          geometry: location.geometry,
        };
      });
      return suggestionsFromSearch
    } catch (err) {
      throw err
    }
  }

  async getGeographicFeatures(longitude, latitude) {
    try {
      const res = await axios.get(`${STARTING_URL}${longitude},${latitude}.json?worldview=cn&access_token=${mapboxApiKey}`);
      const features = res.data.features.map((location) => {
        return {
          place_name: location.place_name,
          geometry: location.geometry,
        };
      });
      return features
    } catch (err) {
      throw err
    }
  }
}

module.exports = MapboxService
