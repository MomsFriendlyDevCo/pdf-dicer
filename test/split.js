var _ = require('lodash');
var fs = require('fs-extra')
var expect = require('chai').expect;
var mlog = require('mocha-logger');
var pdfDicer = require('..');

var outputPath = '';

describe('pdfDicer.split()', function() {

	beforeEach(function() {
		outputPath = `${__dirname}/output`;
		// Clean and prepare work directory
		if (fs.existsSync(outputPath)) {
			fs.removeSync(outputPath);
		}
		if (!fs.existsSync(outputPath)) {
			fs.mkdirSync(outputPath);
		}
	});

	it('should split by alternating top/bottom barcodes', function(next) {
		this.timeout(60 * 1000);

		outputPath = `${__dirname}/output/split`;
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
			.on('pageConverted', (page, pageNumber) => fired.pageConverted++)
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
			.on('rangeExtracted', (range) => {
				
				expect(range).to.be.deep.equal({
					101: {
						barcode: {
							start: "101-a",
							end: "101-z"
						},
						pages: 2,
						from: 1
					},
					250: {
						barcode: {
							start: "250-a",
							end: "250-z"
						},
						pages: 4,
						from: 3
					},
					666: {
						barcode: {
							start: "666-a",
							end: "666-z"
						},
						pages: 3,
						from: 7
					},
					1234567890: {
						barcode: {
							start: "1234567890-a",
							end: "1234567890-z"
						},
						pages: 5,
						from:10
					}
				});

			})
			.on('split', (data, stream) => {
				stream.pipe(fs.createWriteStream(`${outputPath}/range-${data.barcode.start}-${data.barcode.end}.pdf`));
			})
			.on('splitted', () => {
				var fileCount = 0;
				var fileNames = [
					'range-101-a-101-z.pdf',
					'range-250-a-250-z.pdf',
					'range-666-a-666-z.pdf',
					'range-1234567890-a-1234567890-z.pdf'
				];
				fs.readdirSync(outputPath).forEach(file => {
					if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
						fileCount++;
					}
				});
				expect(fileCount).to.be.equal(4);
			})
			.split(`${__dirname}/data/example-alternating.pdf`, options, function(err, output) {
				if (err) return next(err);

				expect(stages).to.be.deep.equal([
					'init', 'readPDF', 'readPages', 'extracted', 'loadRange', 
					'splitPDFscissors', 'splitPDFscissors', 'splitPDFscissors', 'splitPDFscissors'
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
