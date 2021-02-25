'use strict';
/**
 * Created by krasilneg on 19.07.17.
 */
const path = require('path');
const extend = require('extend');
const { format } = require('util');

const config = require(path.join(process.cwd(), 'config'));
const { di, utils: { errorSetup } } = require('@iondv/core');
const IonLogger = require('../lib/log/IonLogger');
const { t, load, lang } = require('core/i18n');
const { alias } = di;

const sysLog = new IonLogger(config.log || {});

lang(config.lang);
errorSetup();

let jobName = false;
let job = false;
let notifier = null;

load(path.normalize(path.join(process.cwd(), 'i18n')), null, config.lang)
  .then(() => {
    if (process.argv.length > 2) {
      jobName = process.argv[2];
    } else {
      console.error(t('Job name not specified'));
      process.exit(130);
    }    
    return di(
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
    );
  })
  .then(scope =>
    di(
      'app',
      extend(true, config.di, scope.settings.get('plugins') || {}),
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
    (scope) => {
      let jobs = scope.settings.get('jobs') || {};
      if (
        jobs.hasOwnProperty(jobName) &&
        jobs[jobName] &&
        typeof jobs[jobName] === 'object'
      ) {
        job = jobs[jobName];
        if (!job.worker) {
          throw new Error(format(t('Worker component not specified for job %s'), jobName));
        }
        return di(
          'app',
          di.extract(
            [job.worker],
            extend(
              true,
              config.di,
              scope.settings.get('plugins') || {},
              jobs[jobName].di || {}
            )
          ),
          {}
        );
      } else {
        throw new Error(format(t('Job %s not found'), jobName));
      }
    }
  )
  .then(scope => alias(scope, scope.settings.get('di-alias')))
  .then((scope) => {
    notifier = scope.notifier;
    let worker = scope[job.worker];
    if (!worker) {
      throw new Error(format(t('Worker component of job %s not found'), jobName));
    }
    if (typeof worker !== 'function' && typeof worker.run !== 'function') {
      throw new Error(format(t('Worker component of job %s has no launch method'), jobName));
    }
    let msg = format(t('Job %s started'), jobName);
    sysLog.info(msg);
    let promise = Promise.resolve();
    if (notifier && job.notify) {
      promise = promise.then(() => notifier.notify({
        subject: jobName,
        message: msg,
        sender: job.sender,
        recievers: job.notify
      }));
    }
    return promise.then(() => (typeof worker === 'function') ? worker() : worker.run());
  })
  .then(() => {
    let msg = format(t('Job %s done'), jobName);
    sysLog.info(msg);
    let p = Promise.resolve();
    if (notifier && job.notify) {
      p = p.then(() => notifier.notify({
        subject: jobName,
        message: msg,
        sender: job.sender,
        recievers: job.notify
      }));
    }
    return p.then(() => {
      process.exit(0);
    });
  })
  .catch((err) => {
    sysLog.error(err);
    let p = Promise.resolve();
    if (notifier && job.notify) {
      p = p.then(() => notifier.notify({
        subject: jobName,
        message: err,
        sender: job.sender,
        recievers: job.notify
      }));
    }
    p
      .catch(() => {
        sysLog.error(err);
      })
      .then(() => {
        process.exit(130);
      });
  });