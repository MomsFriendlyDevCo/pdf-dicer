var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;
var mlog = require('mocha-logger');
var pdfDicer = require('..');

describe('pdfDicer.split()', function() {

	it('should split by alternating top/bottom bacrcodes', function(next) {
		this.timeout(60 * 1000);

		var outputPath = path.join(__dirname, '/output');
		if (!fs.existsSync(outputPath)) {
			fs.mkdirSync(outputPath);
		}

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};
		
		var dicer = new pdfDicer();
		var stages = [];
		var fired = {
			tempDir: 0,
			pageConverted: 0,
			pagesConverted: 0,
			pageAnalyze: 0,
			pageAnalyzed: 0,
			pagesAnalyzed: 0,
		};

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
			.on('stage', stage => {
				mlog.log('stage:', stage);
				stages.push(stage);
			})
			.on('tempDir', path => fired.tempDir++)
			.on('pageConverted', (page, pageNumber) => { 
				fired.pageConverted++; 
				/*fs.createReadStream(page.path)
					.pipe(fs.createWriteStream(`/home/kratos/Development/MOMS/Github/pdf-dicer/test/output/example-alternating-${pageNumber}.png`));*/
			})
			.on('pagesConverted', path => fired.pagesConverted++)
			.on('pageAnalyze', ()=> fired.pageAnalyze++)
			.on('pageAnalyzed', ()=> fired.pageAnalyzed++)
			.on('pagesAnalyzed', pages => {
				fired.pagesAnalyzed++;
				expect(_.map(pages).map(p => p.barcode)).to.deep.equal([
					'101-a','101-z',
					'250-a',false,false,'250-z',
					'666-a',false,'666-z',
					'1234567890-a',false,false,false,'1234567890-z',
				]);
			})
			.on('split', (range) => {
				console.log('EVENT SPLIT', range);
				//data.stream.pipe(fs.createWriteStream(__dirname + `/output/range-${data.barcode.start}-${data.barcode.end}.pdf.pdf`));
			})
			.split(__dirname + '/data/example-alternating.pdf', options, function(err, output) {
				if (err) return next(err);

				expect(stages).to.be.deep.equal([
					'init', 'readPDF', 'readPages', 'extracted',
				]);

				expect(fired).to.be.deep.equal({
					tempDir: 1,
					pageConverted: 14,
					pagesConverted: 1,
					pageAnalyze: 14,
					pageAnalyzed: 14,
					pagesAnalyzed: 1,
				});

				next();
			});
	});

});
