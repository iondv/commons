'use strict';

const { Repository } = require('@iondv/commons-contracts');

/**
 * @param {Object} config
 * @constructor
 */
function InnerCacheRepository() {

  const cache = {};

  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
     */
  this._get = function (key) {
    return Promise.resolve(cache[key]);
  };

  /**
   *
   * @param {String} key
   * @param {*} value
   * @returns {Promise}
     * @private
     */
  this._set = function (key, value) {
    cache[key] = value;
    return Promise.resolve();
  };

}

InnerCacheRepository.prototype = new Repository();
module.exports = InnerCacheRepository;
