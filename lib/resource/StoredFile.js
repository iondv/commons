/**
 * Created by kras on 26.07.16.
 */
'use strict';
const { t } = require('@iondv/i18n');
const { resources: { File } } = require('@iondv/commons-contracts');

function StoredFile (id, link, options, streamGetter) {
  this.id = id;

  this.link = link;

  this.options = options;

  this.name = this.options.name || this.id;

  /**
   * @returns {Promise}
   */
  this._getContents = function () {
    return new Promise((resolve, reject) => {
      if (typeof streamGetter === 'function') {
        try {
          streamGetter((err, stream) => {
            if (err) {
              return reject(err);
            }
            if (!stream) {
              return reject(new Error(t('Failed to obtain file reading stream.')));
            }
            return resolve({
              name: this.name,
              options: this.options,
              stream: stream
            });
          });
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(t('Function for getting file input stream not specified.')));
      }
    });
  };

  /**
   * @returns {StoredFile}
   */
  this._clone = function () {
    return new StoredFile(this.id, this.link, this.options, streamGetter);
  };
}

StoredFile.prototype = Object.create(File.prototype);
StoredFile.prototype.constructor = StoredFile;

module.exports = StoredFile;
