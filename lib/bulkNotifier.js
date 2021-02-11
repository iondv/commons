const { util: { normalize } } = require('@iondv/meta-model-contracts');
const merge = require('merge');

/**
 * @param {String} str 
 * @param {Item} item 
 */
function replStr(str, item) {
  return (str && str.replace(/\$\{([\w_.]+)\}/g, (match, p1) => item.get(p1))) || null;
}

/**
 * @param {{}} options
 * @param {{}} options.classes
 * @param {Notifier} options.notifier
 * @param {DataRepository} options.dataRepo
 */
module.exports = (options) => {
  let pr = Promise.resolve();
  Object.keys(options.classes).forEach((cl) => {
    /**
     * @param {{}} [loadOptions]
     * @param {String} [message]
     * @param {String} [type]
     * @param {String[] | String} recievers
     * @param {String} [subject]
     * @param {{}} [dispatch]
     */
    const opts = options.classes[cl];
    const recievers = Array.isArray(opts.recievers) ? opts.recievers : [opts.recievers];
    const fe = [];
    recievers.forEach(rec => fe.push(rec.split('.')));
    const lopts = merge.recursive(true, opts.loadOptions || {}, {forceEnrichment: fe});

    pr = pr.then(() => options.dataRepo.getList(cl, lopts))
      .then((list) => {
        let pr2 = Promise.resolve();
        list.forEach((item) => {
          const recs = [];
          recievers.forEach((rec) => {
            let val = item.get(rec);
            if (val) {
              if (!Array.isArray(val))
                val = [val];
              for (let i = 0; i < val.length; i++) {
                if (!recs.includes(val[i]))
                  recs.push(val[i]);
              }
            }
          });

          pr2 = pr2.then(() => options.notifier.notify({
            message: opts.message ? replStr(opts.message, item) : normalize(item),
            type: opts.type,
            recievers: recs,
            subject: replStr(opts.subject, item),
            dispatch: opts.dispatch
          }));
        });
        return pr2;
      });
  });
  return pr;
};
