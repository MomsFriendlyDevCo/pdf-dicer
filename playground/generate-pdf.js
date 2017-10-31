var async = require('async-chainable');
var fs = require('fs');
var uid = require('uid');
var bwipjs = require('bwip-js');
var PDFDocument = require('pdfkit');
var Promise = require("bluebird");
var debug = require('debug')('generate-pdf');

exports.generate = function(defaultPages, fileName, addEndBarcode) {

  var PNG;
  var doc = new PDFDocument({
    autoFirstPage: false,
    bufferPages: true
  });

  return new Promise(function(resolve, reject) {

    var lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl. Suspendisse rhoncus nisl posuere tortor tempus et dapibus elit porta. Cras leo neque, elementum a rhoncus ut, vestibulum non nibh. Phasellus pretium justo turpis. Etiam vulputate, odio vitae tincidunt ultricies, eros odio dapibus nisi, ut tincidunt lacus arcu eu elit. Aenean velit erat, vehicula eget lacinia ut, dignissim non tellus. Aliquam nec lacus mi, sed vestibulum nunc. Suspendisse potenti. Curabitur vitae sem turpis. Vestibulum sed neque eget dolor dapibus porttitor at sit amet sem. Fusce a turpis lorem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;\nMauris at ante tellus. Vestibulum a metus lectus. Praesent tempor purus a lacus blandit eget gravida ante hendrerit. Cras et eros metus. Sed commodo malesuada eros, vitae interdum augue semper quis. Fusce id magna nunc. Curabitur sollicitudin placerat semper. Cras et mi neque, a dignissim risus. Nulla venenatis porta lacus, vel rhoncus lectus tempor vitae. Duis sagittis venenatis rutrum. Curabitur tempor massa tortor.';
    
    debug('GENERATE -> ', defaultPages, fileName, addEndBarcode);

    async()
      .then((next) => {
        debug('New barcode generation start...');
        var url = `http://localhost/#/forms/filings/${uid(15)}`;
        var id = url.substring(url.lastIndexOf('/') + 1,url.length);
        fileName = `${id}-${fileName}`;

        bwipjs.toBuffer({
          bcid:        'code128',       // Barcode type
          text:        url,             // Text to encode
          scaleX:      2,               // 2x scaling factor
          scaleY:      1,               // 1y scaling factor
          includetext: false,           // Show human-readable text
          textxalign:  'center',        // Always good to set this
        }, function (err, png) {
          if (err) {
            console.error(err);
          } else {
            PNG = png;
            next();
          }
        });
        
      })
      .then((next) => {
        debug(`Barcode generated ${PNG != null}`);
        next();
      })
      .then((next) => {
        
        for (var i = 0; i < defaultPages; i++) {
          doc.addPage();
      
          // draw some text
          doc.fontSize(25)
            .text('Here is some vector graphics...', 100, 80);
      
          // some vector graphics
          doc.save()
            .moveTo(100, 150)
            .lineTo(100, 250)
            .lineTo(200, 250)
            .fill("#FF3300");
      
          doc.circle(280, 200, 50)
            .fill("#6600FF");
      
          // an SVG path
          doc.scale(0.6)
            .translate(470, 130)
            .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
            .fill('red', 'even-odd')
            .restore();
      
          // and some justified text wrapped into columns
          doc.text('And here is some wrapped text...', 100, 300)
            .font('Times-Roman', 13)
            .moveDown()
            .text(lorem, {
              width: 412,
              align: 'justify',
              indent: 30,
              columns: 2,
              height: 300,
              ellipsis: true
            });      
        }
    
        next();
      })
      .then((next) => {
        if (addEndBarcode) doc.addPage();
    
        var range = doc.bufferedPageRange();
    
        debug('RANGE:', range);
        for (var i = range.start; i < range.count; i++) {
          doc.switchToPage(i);
    
          if (i === 0) {
            doc.image(PNG, 50, 40, {
              height: 30,
              width: 500,
              align: 'center',
              valign: 'center'
            });
          } else if (i === range.count - 1 && addEndBarcode) {
            doc.image(PNG, 50, 40, {
              width: 500,
              align: 'center',
              valign: 'center'
            });
          }
    
          doc.fontSize(10).text(`Page ${i + 1} of ${range.count}`, 10, 10, {
            align: 'center'
          });
        }
    
        doc.flushPages();
    
        next();
      })
      .end(() => {
        PNG = null;
        doc.pipe(fs.createWriteStream(`${__dirname}/data/${fileName}.pdf`));
        
        // Close creation
        doc.end();
        debug(`PDF ${__dirname}/data/${fileName}.pdf Generated.`);
        resolve({
          result: true,
          fileName: `${__dirname}/data/${fileName}.pdf`
        });
      });

  });

};
