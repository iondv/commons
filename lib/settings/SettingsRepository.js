const smartMerge = require('./util/merge-configs');
const { SettingsRepository: ISettingsRepository } = require('@iondv/commons-contracts');
const read = require('./util/readAppDeployConfig');

/**
 * @param {{dataSource: DataSource, logger: Logger}} opts
 * @constructor
 */
function SettingsRepository(opts) {
  const registry = {};

  this._set = (nm, value, options) => {
    const {merge} = (options === true) ? {} : options || {};
    registry[nm] = merge ? smartMerge(registry[nm], value, options) : value;
  };

  this._get = (nm) => {
    if (registry.hasOwnProperty(nm))
      return registry[nm];
    return null;
  };

  this._apply = () => Promise.resolve();

  /**
   * @returns {Promise}
   */
  this._reset = () => Promise.resolve();

  function setParams(mod, globals) {
    for (const nm in globals) {
      if (globals.hasOwnProperty(nm)) {
        const snm = (mod ? `${mod}.` : '') + nm;
        registry[snm] = smartMerge(registry[snm], globals[nm]);
      }
    }
  }

  this._init = () => {
    return read(process.cwd())
    .then((config) => {
      if (config.globals && typeof config.globals === 'object')
        setParams(null, config.globals);

      if (config.modules && typeof config.modules === 'object') {
        Object.keys(config.modules).forEach((mod) => {
          setParams(mod, config.modules[mod].globals);
        });
      }
    })
    .catch(err => opts.logger.error(err));
  };
}

SettingsRepository.prototype = new ISettingsRepository();
module.exports = SettingsRepository;
