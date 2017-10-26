const PDFMerge = require('pdf-merge');

/*const files = [
	'./example/data/playground-1.pdf',
	'./example/data/playground-2.pdf',
];*/

//Save as new file
//PDFMerge(files, { output: './example/data/playground-merged.pdf' });

exports.merge = function(files, outputFileName) {

  return new Promise(function (resolve, reject) {
    PDFMerge(files, { output: `${__dirname}/data/${outputFileName}.pdf` })
      .then((buffer) => {
        console.log('Joined files.');
        resolve(true);
      });
  });

};
