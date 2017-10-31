var async = require('async-chainable');
var fs = require('fs');
var PDFGenerator = require('./generate-pdf');
var PDFJoiner = require('./pdf-join');
var debug = require('debug')('playground');

/**
 * To generate some examples it's necessary the following steps:
 *  1. Configure pdfs variable.
 *  2. Configure mergePdfs variable.
 *  3. Execute npm run playground
 *  4. The result documents are in ./playground/data
 */

// Configure what pdfs you want to generate.
var pdfs = [
  {
    // Name of the generated document
    name: 'gen-one-page-ok',
    // How many pages you want for the document
    pages: 1,
    barcode: {
      // Put barcode information at the beginning of the document
      start: true,
      // Put barcode information at the end of the document
      end: true
    }
  },
  {
    name: 'gen-three-pages-ko',
    pages: 3,
    barcode: {
      start: true,
      end: false
    }
  },
  {
    name: 'gen-five-pages-ok',
    pages: 5,
    barcode: {
      start: true,
      end: true
    }
  }
];

// Configure joined pdfs
var mergePdfs = [
  {
    // From pdfs, which ones are going to join
    pdfsToJoin: [0, 2],
    // First part of the joined pdf file name
    fileName: 'join'
  },
  {
    pdfsToJoin: [1, 2],
    fileName: 'join'
  }
];

var generatedFiles = [];

if (process.env.GENERATE ? process.env.GENERATE === 'true' : false) {
  async()
    .set('pdfs', pdfs)
    .forEach('pdfs', function(nextPdf, pdf, pdfIndex) {
      PDFGenerator.generate(pdf.pages, pdf.name, pdf.barcode.end)
        .then((result) => {
          generatedFiles.push(result.fileName);
          nextPdf();}
        );
    })
    .then((next) => {
      debug('Generated files:', generatedFiles);
      fs.writeFile(`${__dirname}/data/generatedFiles.txt`, JSON.stringify(generatedFiles), (err) => {
        if (err) throw err;
    
        debug("File with generatedFiles was successfully saved!");
    }); 
      next();
    })
    .end(() => debug('END'));
} else {
  var array = fs.readFileSync(`${__dirname}/data/generatedFiles.txt`).toString().split("\n");
  array = JSON.parse(array);
  for(i in array) {
      generatedFiles.push(array[i]);
  }
  
  for (var key in mergePdfs) {
    if (mergePdfs.hasOwnProperty(key)) {
      var element = mergePdfs[key];
      for (var index = 0; index < element.pdfsToJoin.length; index++) {
        var item = element.pdfsToJoin[index];
        mergePdfs[key].fileName = mergePdfs[key].fileName.concat('-').concat(generatedFiles[item].substring(generatedFiles[item].indexOf('/data/')+6,generatedFiles[item].indexOf('-gen')));
      }
    }
  }

  async()
    .set('joinFiles', mergePdfs)
    .forEach('joinFiles', function(nextFile, file, fileIndex) {
      var filesToJoin = [];
      for (var i = 0; i < file.pdfsToJoin.length; i++) {
        var element = file.pdfsToJoin[i];
        filesToJoin.push(generatedFiles[element]);
      }
      debug('Files to join:', filesToJoin, 'in output file:', file.fileName);
      PDFJoiner.merge(filesToJoin, file.fileName)
        .then(() => nextFile());
    })
    .end(() => debug('END'));
}