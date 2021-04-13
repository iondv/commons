/**
 * Created by krasilneg on 25.04.19.
 */
const fs = require('fs');
const path = require('path');
const {
  utils: { config: { readConfigFiles, merge } }
} = require('@iondv/core');
const { promisify } = require('util');
const configReader = require('../../config-reader');
const read = promisify(configReader);
const readdirPromise = promisify(fs.readdir);

const isConfig = fn => ['.json', '.yml'].includes(path.extname(fn));
const joinPath = (...pths) => fn => path.join(...pths, fn);
const isBasename = nm => fn => path.basename(fn, path.extname(fn)) === nm;

const smartMerge = require('./merge-configs');

const readdir = pth => readdirPromise(pth)
  .then(files => files.filter(isConfig).map(joinPath(pth)))
  .catch(() => []);

const mergeConfigs = (data) => {
  let result = {};
  Object.keys(data).forEach((key) => {
    result = merge(result, data[key]);
  });
  return result;
};

function readModulesConfigs(modulesPath) {
  let result = {};
  const configs = [];
  return readdirPromise(modulesPath)
    .then((files) => {
      let subdirPromise = Promise.resolve();
      files.forEach((fn) => {
        if (isConfig(fn)) {
          configs.push(fn);
        } else {
          subdirPromise = subdirPromise
            .then(() => readdir(path.join(modulesPath, fn)))
            .then(files => files.filter(isConfig))
            .then((configFiles) => {
              if (!configFiles.length) {
                return;
              }
              return readConfigFiles(configFiles)
                .then((configFilesData) => {
                  result[fn] = mergeConfigs(configFilesData);
                });
            });
        }
      });
      return subdirPromise;
    })
    .then(() => readConfigFiles(configs.map(joinPath(modulesPath))))
    .then((configsData) => {
      result = merge(configsData, result);
      return result;
    })
    .catch(() => {
      return {};
    });
}

async function readOtherAppsConfigs(apps) {
  const config = {};
  const otherAppsPromises = [];
  for (const otherApp of Object.values(apps)) {
    otherAppsPromises.push(new Promise(async (resolve, reject) => {
      const otherAppPath = otherApp.root;
      const dirs = await Promise.all([
        readdir(otherAppPath),
        readdir(path.join(otherAppPath, 'deploy'))
      ]);
      const [rootFiles, deployFiles] = dirs;
      const results = await readConfigFiles([...rootFiles.filter(isBasename('deploy')), ...deployFiles]);
      config[otherApp] = results.deploy || {};
      delete results.deploy;
      config[otherApp] = merge(config[otherApp], mergeConfigs(results));
      config[otherApp].modules = config[otherApp].modules || {};
      return resolve(true);
    }));
  }
  await Promise.all(otherAppsPromises);
  return config;
}

module.exports = (appPath) => {
  let config = {};
  const configDirs = [
    readdir(appPath),
    readdir(path.join(appPath, 'deploy'))
  ];

  return Promise.all(configDirs)
    .then((dirs) => {
      const [rootFiles, deployFiles] = dirs;
      return readConfigFiles([...rootFiles.filter(isBasename('deploy')), ...deployFiles]);
    })
    .then((results) => {
      config = results.deploy || {};
      delete results.deploy;
      config = merge(config, mergeConfigs(results));
      config.modules = config.modules || {};

      return readModulesConfigs(path.join(appPath, 'deploy', 'modules'));
    })
    .then((modulesConfig) => {
      config.modules = merge(config.modules, modulesConfig);

      if (fs.existsSync(path.join(appPath, 'config', 'index.js'))) {
        const {applications: otherApps} = require(path.join(appPath, 'config'));
        if (otherApps)
          return readOtherAppsConfigs(otherApps);
      }
      return {};
    })
    .then((otherAppsConfigs) => {
      let appConfigs = {};
      for (const otherApp of Object.keys(otherAppsConfigs))
        appConfigs = merge(appConfigs, otherAppsConfigs[otherApp]);
      config = smartMerge(appConfigs, config);

      return read(config, appPath);
    });
};
