const axios = require("axios")
require("dotenv").config();
const mapboxApiKey = process.env.MAPBOX_APP_SECRET

const STARTING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places/";

class GeolocationService {
  constructor() {}

  async getLocationSuggestions(searchText, longitude, latitude) {
    try {
      let url = new URL(`${STARTING_URL}${searchText}.json`);
      url.searchParams.append("worldview", "cn");
      url.searchParams.append("access_token", mapboxApiKey);
      url.searchParams.append("limit", 10);
      // let url = `${STARTING_URL}${searchText}.json?worldview=cn&access_token=${mapboxApiKey}`;
      if (longitude && latitude) {
        url.searchParams.append("proximity", `${longitude},${latitude}`);
        // url += `&proximity=${longitude},${latitude}`;
      }
      const res = await axios.get(url.href);
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
      let url = new URL(`${STARTING_URL}${longitude},${latitude}.json`);
      url.searchParams.append("worldview", "cn");
      url.searchParams.append("access_token", mapboxApiKey);
      const res = await axios.get(url.href);
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

module.exports = GeolocationService
