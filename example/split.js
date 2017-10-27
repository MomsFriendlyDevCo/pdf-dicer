var fs = require('fs-extra')
var pdfDicer = require('../index');

var dicer = new pdfDicer();
var options = {
  temp: {
    prefix: 'pdfdicer-',
    dir: `${__dirname}/output/split`
  }
};

var outputPath = `${__dirname}/output/split`;
// Clean and prepare work directory
if (fs.existsSync(outputPath)) {
  fs.removeSync(outputPath);
}
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath);
}

var pdfToSplit = [
  './playground/data/f0tsvkmfel1f87c-gen-one-page-ok.pdf',
  './playground/data/hstitdwbvnh76xq-gen-three-pages-ko.pdf',
  './playground/data/ga81ppxnfe86qyu-gen-five-pages-ok.pdf',
  './playground/data/join-f0tsvkmfel1f87c_ga81ppxnfe86qyu.pdf',
  './playground/data/join-hstitdwbvnh76xq_ga81ppxnfe86qyu.pdf',
  './example/data/example-alternating.pdf',
];
var selection = 4;
var documents = 0;

dicer
  .areas([ 
    // Top center area 
    { top: "3%", right: "2%", left: "2%", bottom: "87" },
    // Top-left quarter  
    { top: "0%", right: "50%", left: "0%", bottom: "70%" },
    // Bottom-right quarter 
    { top: "70%", right: "0%", left: "50%", bottom: "0%" }
  ])
  // {{{ Testing
  .on('pagesAnalyzed', (pages) => {
    console.log('PAGES:', pages);
  })
  .on('rangeExtracted', (range) => {
    console.log('RANGE:', range);
  })
  // }}}
  .on('split', (data, stream) => {
    var outputFile = `${outputPath}/document-${data.barcode.id}.pdf`;
    console.log(`PDF range -> ${JSON.stringify(data)} into ${outputFile}`);
    stream.pipe(fs.createWriteStream(outputFile));
    documents++;
  })
  .split(pdfToSplit[selection], options, function(err, output) {
    if (err) console.log('Error when split pdf:', err);
  });