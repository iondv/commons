const { Logger } = require('@iondv/commons-contracts');

class LoggerProxy extends Logger {
  /**
   * @param {String} message
   */
  _info(message) {};

  /**
   * @param {String} message
   */
  _log(message) {};

  /**
   * @param {String} message
   */
  _warn(message) {};

  /**
   * @param {String} message
   */
  _error(message) {};
}

module.exports = LoggerProxy;
