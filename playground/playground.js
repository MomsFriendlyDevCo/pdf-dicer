var async = require('async-chainable');
var PDFGenerator = require('./generate-pdf');
var PDFJoiner = require('./pdf-join');

var pdfs = [
  {
    name: 'example-one-page-ok',
    pages: 1,
    barcode: {
      start: true,
      end: true
    }
  },
  {
    name: 'example-three-pages-ko',
    pages: 3,
    barcode: {
      start: true,
      end: false
    }
  },
  {
    name: 'example-five-pages-ok',
    pages: 5,
    barcode: {
      start: true,
      end: true
    }
  }
];
var mergePdfs = [
  {
    pdfsToJoin: [0, 1],
    outputFile: 'join-0_1'
  },
  {
    pdfsToJoin: [1, 2],
    outputFile: 'join-1_2'
  },
  {
    pdfsToJoin: [0, 2],
    outputFile: 'join-0_2'
  }
];

var generatedFiles = [];

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
    console.log('Generated files:', generatedFiles);
    next();
  })
  /*.set('joinFiles', mergePdfs)
  .forEach('joinFiles', function(nextFile, file, fileIndex) {
    var filesToJoin = [];
    for (var i = 0; i < file.pdfsToJoin.length; i++) {
      var element = file.pdfsToJoin[i];
      filesToJoin.push(generatedFiles[element]);
    }
    console.log('Files to join:', filesToJoin, 'in output file:', file.outputFile);
    PDFJoiner.merge(filesToJoin, file.outputFile)
      .then(() => nextFile());
  })*/
  .end(() => console.log('END'));