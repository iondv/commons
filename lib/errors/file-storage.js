/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';

const { IonError } = require('@iondv/core');

const PREFIX = 'file-storage';

const errors = module.exports = {
  BAD_DATA: `${PREFIX}.bd`,
  NO_DIR: `${PREFIX}.nd`,
  NO_FILE: `${PREFIX}.nf`
};

IonError.registerMessages(errors);
