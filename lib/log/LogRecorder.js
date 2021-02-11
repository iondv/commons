/**
 * Created by kras on 06.10.16.
 */
'use strict';
const { Logger } = require('@iondv/commons-contracts');

/**
 * @param {{}} options
 * @param {IonLogger} options.target
 * @param {String[]} options.messageTypes
 * @constructor
 */
function LogRecorder(options) {

  let recording = false;

  let buf = [];

  if (options && options.target) {
    options.target.addDestination(this, options.messageTypes || []);
  }

  this.start = function () {
    recording = true;
  };

  this.stop = function () {
    recording = false;
    const result = buf;
    buf = [];
    return result;
  };

  /**
   * @param {String} message
   */
  this._info = function (message) {
    if (recording) {
      buf.push({type: 'info', message: message && (message.message || message)});
    }
  };

  /**
   * @param {String} message
   */
  this._log = function (message) {
    if (recording) {
      buf.push({type: 'log', message: message && (message.message || message)});
    }
  };

  /**
   * @param {String} message
   */
  this._warn = function (message) {
    if (recording) {
      buf.push({type: 'warn', message: message && (message.message || message)});
    }
  };

  /**
   * @param {String} message
   */
  this._error = function (message) {
    if (recording) {
      buf.push({type: 'error', message: message && (message.message || message)});
    }
  };
}

LogRecorder.prototype = new Logger();

module.exports = LogRecorder;
