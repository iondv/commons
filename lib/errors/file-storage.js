/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';

const { IonError, utils: { strings } } = require('@iondv/core');
const { w: t } = require('@iondv/i18n');

const PREFIX = 'file-storage';

const errors = module.exports = {
  BAD_DATA: `${PREFIX}.bd`,
  NO_DIR: `${PREFIX}.nd`,
  NO_FILE: `${PREFIX}.nf`
};

IonError.registerMessages({
  [errors.BAD_DATA]: t(`Invalid data format.`),
  [errors.NO_DIR]: t(`Directory '%dir' not found.`),
  [errors.NO_FILE]: t(`File '%file' not found.`)
});
