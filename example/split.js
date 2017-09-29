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

dicer
  .areas([
    { // Top-left quarter
      top: "0%",
      right: "50%",
      left: "0%",
      bottom: "70%",
    },
    { // Bottom-right quarter
      top: "70%",
      right: "0%",
      left: "50%",
      bottom: "0%",
    },
  ])
  .on('split', (data, stream) => {
    var outputFile = `${outputPath}/range-_${data.barcode.start}_-_${data.barcode.end}_.pdf`;
    console.log(`PDF range -> ${JSON.stringify(data)} into ${outputFile}`);
    stream.pipe(fs.createWriteStream(outputFile))
  })
  .split('./example/data/example-alternating.pdf', options, function(err, output) {
    if (err) console.log('Error when split pdf:', err);
  });