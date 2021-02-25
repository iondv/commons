'use strict';
/* eslint no-process-exit:off */
/**
 * Created by krasilneg on 19.07.17.
 */
const path = require('path');
const extend = require('extend');

const config = require(path.join(process.cwd(), 'config'));
const { di, utils: { errorSetup } } = require('@iondv/core');
const IonLogger = require('../lib/log/IonLogger');
const { t, load, lang } = require('core/i18n');

const sysLog = new IonLogger(config.log || {});
lang(config.lang);
errorSetup();


// jshint maxcomplexity: 20, maxstatements: 30
load(path.normalize(path.join(process.cwd(), 'i18n')), null, config.lang)
  .then(() => di(
    'boot',
    extend(
      true,
      {
        settings: {
          module: path.normalize(path.join(__dirname, '..', 'lib', 'settings', 'SettingsRepository')),
          initMethod: 'init',
          initLevel: 1,
          options: {
            logger: 'ion://sysLog'
          }
        }
      },
      config.bootstrap
    ),
    { sysLog: sysLog }
  ))
  .then(scope =>
    di(
      'app',
      di.extract(
        'scheduler',
        extend(
          true,
          {
            kvRepo: {
              module: path.normalize(path.join(__dirname, '..', 'lib', 'cache', 'InnerCacheRepository'))
            },
            scheduler: {
              module: path.normalize(path.join(__dirname, '..', 'lib', 'Scheduler')),
              options: {
                settings: 'ion://settings',
                repo: 'ion://kvRepo',
                log: 'ion://sysLog'
              }
            }
          },
          config.di,
          scope.settings.get('plugins') || {}
        )
      ),
      {},
      'boot'
    )
  )
  .then(
    /**
     * @param {{}} scope
     * @param {SettingsRepository} [scope.settings]
     * @returns {Promise}
     */
    (scope) => scope.scheduler.start()
  )
  .then(() => {
    sysLog.info(t('Schedule started'));
  })
  .catch((err) => {
    sysLog.error(err);
    process.exit(130);
  });