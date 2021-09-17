var { camelCase } = require('lodash');

// credits: https://stackoverflow.com/questions/12931828/convert-returned-json-object-properties-to-lower-first-camelcase
const camelizeKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelizeKeys(v));
  } else if (obj != null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [camelCase(key)]: camelizeKeys(obj[key]),
      }),
      {},
    );
  }
  return obj;
};

module.exports = camelizeKeys 