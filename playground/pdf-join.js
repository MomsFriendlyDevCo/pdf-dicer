var PDFMerge = require('pdf-merge');
var Promise = require("bluebird");

exports.merge = function(files, outputFileName) {

  return new Promise(function (resolve, reject) {
    PDFMerge(files, { output: `${__dirname}/data/${outputFileName}.pdf` })
      .then((buffer) => {
        console.log('Joined files.');
        resolve(true);
      });
  });

};
