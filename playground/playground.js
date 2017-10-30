var async = require('async-chainable');
var PDFGenerator = require('./generate-pdf');
var PDFJoiner = require('./pdf-join');

var pdfs = [
  {
    name: 'gen-one-page-ok',
    pages: 1,
    barcode: {
      start: true,
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
var mergePdfs = [
  {
    pdfsToJoin: [0, 2],
    outputFile: 'join-f0tsvkmfel1f87c_ga81ppxnfe86qyu'
  },
  {
    pdfsToJoin: [1, 2],
    outputFile: 'join-hstitdwbvnh76xq_ga81ppxnfe86qyu'
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
      console.log('Generated files:', generatedFiles);
      next();
    })
    .end(() => console.log('END'));
} else {
  generatedFiles = [ './playground/data/f0tsvkmfel1f87c-gen-one-page-ok.pdf',
  './playground/data/hstitdwbvnh76xq-gen-three-pages-ko.pdf',
  './playground/data/ga81ppxnfe86qyu-gen-five-pages-ok.pdf' ];
  
  async()
    .set('joinFiles', mergePdfs)
    .forEach('joinFiles', function(nextFile, file, fileIndex) {
      var filesToJoin = [];
      for (var i = 0; i < file.pdfsToJoin.length; i++) {
        var element = file.pdfsToJoin[i];
        filesToJoin.push(generatedFiles[element]);
      }
      console.log('Files to join:', filesToJoin, 'in output file:', file.outputFile);
      PDFJoiner.merge(filesToJoin, file.outputFile)
        .then(() => nextFile());
    })
    .end(() => console.log('END'));
}