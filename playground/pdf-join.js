var PDFMerge = require('pdf-merge');
var Promise = require("bluebird");
var debug = require('debug')('pdf-join');

exports.merge = function(files, outputFileName) {

  return new Promise(function (resolve, reject) {
    PDFMerge(files, { output: `${__dirname}/data/${outputFileName}.pdf` })
      .then((buffer) => {
        debug('Joined files.');
        resolve(true);
      });
  });

};
