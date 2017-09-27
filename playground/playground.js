var path = require('path');
var fs = require('fs');
var pdfDicer = require('../index');
var scissors = require('scissors');
var uuidv1 = require('uuid/v1');

var dicer = new pdfDicer();
var options = {
    temp: {
        prefix: 'pdfdicer-',
        dir: path.join(__dirname, '/output')
    }
};

var analyzedResult = [];
var outputPath = path.join(__dirname, `/output/${uuidv1()}`);
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
    .on('tempDir', path => console.log('Temporary working path ->', path))
    .on('pageConverted', (page, pageNumber) => {
      console.log('PAGE:', page, 'PAGE NUMER:', pageNumber)
      fs.createReadStream(page.path).pipe(fs.createWriteStream(`${outputPath}/example-alternating-${pageNumber}.png`));
    })
    //.on('pageAnalyzed', (page, pageOffset) => console.log('PAGE:', page, 'PAGEOFFSET:', pageOffset))
    /*.on('pagesAnalyzed', pages => {
      console.log('PAGES ->', pages);
      var memBarcode = '';
      var range = new Object();
      var rangeCount = 1;
      // var flag = 'from';
      var index = 0;
      for (var key in pages) {
        if (pages.hasOwnProperty(key)) {
          var element = pages[key];
          memBarcode = (element.barcode === false) ? memBarcode : element.barcode.split('-')[0];

          if (memBarcode !== false) {
            if (range[memBarcode] == null) {
              range[memBarcode] = new Object();
              range[memBarcode].pages = 1;
              range[memBarcode].from = index + 1;
            } else {
              range[memBarcode].pages++;
            }
          } else {
            if (range[memBarcode] == null) {
              range[memBarcode] = new Object();
              range[memBarcode].pages = 1;
              range[memBarcode].from = index + 1;
            } else {
              range[memBarcode].pages++;
            }
          }

        }
        index++;
      }
      console.log('ANALYZED RESULT ->', range);
      console.log('INDEX', index);
      console.log('RANGE SIZE ->', Object.keys(range).length);

      console.log(`Work output path -> ${outputPath}`);
      for (var key in range) {
        if (range.hasOwnProperty(key)) {
          var element = range[key];
          var from = element.from;
          var to = element.from + element.pages - 1;
          console.log(`Extract from page ${from} to page ${to}. Total pages = ${element.pages}`);
          var pdfCutted = scissors(path.join(__dirname + '/input/example-alternating.pdf')).range(from, to);

          pdfCutted.pdfStream().pipe(fs.createWriteStream(`${outputPath}/range-${key}.pdf`))
            // TODO: Review the messages.
            .on('finish', () => console.log(`Extracted page range from ${from} to ${to} done!`))
            .on('error', (e) => console.error(`Something went wrong extracting range pages form ${from} to ${to}:` + e));
        }
      }
    })*/
    .on('split', (data, stream) => {
      console.log('EVENT SPLIT', data, stream);
      stream.pipe(fs.createWriteStream(__dirname + `/output/range-${data.barcode.start}-${data.barcode.end}.pdf`));
    })
    .split('/home/kratos/Development/MOMS/Github/pdf-dicer/test/data/example-alternating.pdf', options, function(err, output) {
        if (err) console.log('ERROR:', err);
    });