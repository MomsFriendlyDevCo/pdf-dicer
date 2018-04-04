var expect = require('chai').expect;
var _ = require('lodash');
var fs = require('fs-extra')
var pdfDicer = require('..');


var outputPath = '';
// Define test timeout
var testTimeout = 60 * 1000;

/**
 * Creates path to use in the test.
 * @param {string} directory Path to use in tests.
 */
function createTestDirectory(directory) {
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory);
	}
	return directory;
}

createTestDirectory(`${__dirname}/output`);

describe('1. pdf-dicer - Sanity check', () => {

	before('create path to use in the test', done => {
		outputPath = `${__dirname}/output/1.sanity-check`;
		// Clean and prepare work directory
		if (fs.existsSync(outputPath)) {
			fs.removeSync(outputPath);
		}
		createTestDirectory(outputPath);
		done();
	});

	// {{{
	it('should raise an error - (Unknown input type)', function () {

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};

		var dicer = new pdfDicer();
		dicer
			.areas([
				// Top-center area
				{ top: "3%", right: "2%", left: "2%", bottom: "87" }
			])
			.split(false, options, function (err, output) {
				expect(err).to.be.ok;
				expect(err).to.be.equal('Unknown input type');
			});
	});
	// }}}

	// {{{
	it('should raise an error - (File not found)', function () {

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};

		var dicer = new pdfDicer();
		dicer
			.areas([
				// Top-center area
				{ top: "3%", right: "2%", left: "2%", bottom: "87" }
			])
			.split(`${__dirname}/data/default/file_not_found.pdf`, options, function (err, output) {
				expect(err).to.be.ok;
				expect(err).to.be.equal('File not found');
			});
	});
	// }}}

	// {{{
	it('should raise an error - (Callback is missing)', function () {

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};

		var dicer = new pdfDicer();
		try {

			dicer
				.areas([
					// Top-center area
					{ top: "3%", right: "2%", left: "2%", bottom: "87" }
				])
				.split(`${__dirname}/data/default/sample-1.pdf`, options);
		} catch (err) {
			expect(err).to.be.ok;
			expect(err.message).to.be.equal('Callback required as the final parametert of pdfDicer.convert()');
		}
	});
	// }}}
});

describe('2. pdf-dicer - split sample-1.pdf', () => {
	var extractedRange;
	var fileCount;
	var stages;

	before('create path to use in the test', function (done) {
		this.timeout(testTimeout);
		outputPath = `${__dirname}/output/2.sample-1`;
		extractedRange = {};
		fileCount = 0;
		stages = [];

		// Clean and prepare work directory
		if (fs.existsSync(outputPath)) {
			fs.removeSync(outputPath);
		}
		createTestDirectory(outputPath);

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};

		var dicer = new pdfDicer();
		dicer
			.areas([
				// Top-center area
				{ top: "3%", right: "2%", left: "2%", bottom: "87" }
			])
			.on('stage', stage => {
				stages.push(stage);
			})
			.on('rangeExtracted', (range) => {
				extractedRange = range;
			})
			.on('split', (data, stream) => {
				stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
			})
			.on('splitted', () => {
				var count = 0;
				var fileNames = [
					'example-0000FC#BPyR+L.pdf'
				];
				fs.readdirSync(outputPath).forEach(file => {
					if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
						count++;
					}
				});
				fileCount = count;
				done();
			})
			.split(`${__dirname}/data/default/sample-1.pdf`, options, function (err, output) {

			});

	});

	// {{{
	it('should have a correct range object - rangeExtracted event', function () {
		expect(extractedRange).to.deep.equal({
			'http://rkj.io/0000FC#BPyR+L': {
				barcode: {
					id: '0000FC#BPyR+L',
					start: 'http://rkj.io/0000FC#BPyR+L',
					end: 'http://rkj.io/0000FC#BPyR+L'
				},
				pages: 2,
				from: 1
			}
		});
	});
	// }}}

	// {{{
	it('should emit stage events in correct order - splitted event', function () {
		expect(stages[0]).to.equal('init');
		expect(stages[1]).to.equal('readPDF');
		expect(stages[2]).to.equal('readPages');
		expect(stages[3]).to.equal('extracted');
		expect(stages[4]).to.equal('loadRange');
		expect(stages[5]).to.equal('splitPDFWithScissors');
	});
	// }}}

	// {{{
	it('should have correct number of output pdf file - splitted event', function () {
		expect(fileCount).to.equal(1);
	});
	// }}}

});

describe('3. pdf-dicer - split sample-2.pdf', () => {
	var extractedRange;
	var fileCount;
	var stages;

	before('create path to use in the test', function (done) {
		this.timeout(testTimeout);
		outputPath = `${__dirname}/output/3.sample-2`;
		extractedRange = {};
		fileCount = 0;
		stages = [];

		// Clean and prepare work directory
		if (fs.existsSync(outputPath)) {
			fs.removeSync(outputPath);
		}
		createTestDirectory(outputPath);

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};

		var dicer = new pdfDicer();
		dicer
			.areas([
				// Top-center area
				{ top: "3%", right: "2%", left: "2%", bottom: "87" }
			])
			.on('stage', stage => {
				stages.push(stage);
			})
			.on('rangeExtracted', (range) => {
				extractedRange = range;
			})
			.on('split', (data, stream) => {
				stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
			})
			.on('splitted', () => {
				var count = 0;
				var fileNames = [
					'example-0000MobL3y!<h.pdf'
				];
				fs.readdirSync(outputPath).forEach(file => {
					if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
						count++;
					}
				});
				fileCount = count;
				done();
			})
			.split(`${__dirname}/data/default/sample-2.pdf`, options, function (err, output) {

			});

	});

	// {{{
	it('should have a correct range object - rangeExtracted event', function () {
		expect(extractedRange).to.deep.equal({
			'http://rkj.io/0000MobL3y!<h': {
				barcode: {
					id: '0000MobL3y!<h',
					start: 'http://rkj.io/0000MobL3y!<h',
					end: 'http://rkj.io/0000MobL3y!<h'
				},
				pages: 2,
				from: 1
			}
		});
	});
	// }}}

	// {{{
	it('should emit stage events in correct order - splitted event', function () {
		expect(stages[0]).to.equal('init');
		expect(stages[1]).to.equal('readPDF');
		expect(stages[2]).to.equal('readPages');
		expect(stages[3]).to.equal('extracted');
		expect(stages[4]).to.equal('loadRange');
		expect(stages[5]).to.equal('splitPDFWithScissors');
	});
	// }}}

	// {{{
	it('should have correct number of output pdf file - splitted event', function () {
		expect(fileCount).to.equal(1);
	});
	// }}}

});

describe('4. pdf-dicer - split sample-3.pdf', () => {
	var extractedRange;
	var fileCount;
	var stages;

	before('create path to use in the test', function (done) {
		this.timeout(testTimeout);
		outputPath = `${__dirname}/output/4.sample-3`;
		extractedRange = {};
		fileCount = 0;
		stages = [];

		// Clean and prepare work directory
		if (fs.existsSync(outputPath)) {
			fs.removeSync(outputPath);
		}
		createTestDirectory(outputPath);

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};

		var dicer = new pdfDicer();
		dicer
			.areas([
				// Top-center area
				{ top: "3%", right: "2%", left: "2%", bottom: "87" }
			])
			.on('stage', stage => {
				stages.push(stage);
			})
			.on('rangeExtracted', (range) => {
				extractedRange = range;
			})
			.on('split', (data, stream) => {
				stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
			})
			.on('splitted', () => {
				var count = 0;
				var fileNames = [
					'example-0000MC#6PyadL.pdf'
				];
				fs.readdirSync(outputPath).forEach(file => {
					if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
						count++;
					}
				});
				fileCount = count;
				done();
			})
			.split(`${__dirname}/data/default/sample-3.pdf`, options, function (err, output) {

			});

	});

	// {{{
	it('should have a correct range object - rangeExtracted event', function () {
		expect(extractedRange).to.deep.equal({
			'http://rkj.io/0000MC#6PyadL': {
				barcode: {
					id: '0000MC#6PyadL',
					start: 'http://rkj.io/0000MC#6PyadL',
					end: 'http://rkj.io/0000MC#6PyadL'
				},
				pages: 2,
				from: 1
			}
		});
	});
	// }}}

	// {{{
	it('should emit stage events in correct order - splitted event', function () {
		expect(stages[0]).to.equal('init');
		expect(stages[1]).to.equal('readPDF');
		expect(stages[2]).to.equal('readPages');
		expect(stages[3]).to.equal('extracted');
		expect(stages[4]).to.equal('loadRange');
		expect(stages[5]).to.equal('splitPDFWithScissors');
	});
	// }}}

	// {{{
	it('should have correct number of output pdf file - splitted event', function () {
		expect(fileCount).to.equal(1);
	});
	// }}}

});

describe('5. pdf-dicer - split all-samples.pdf', () => {
	var extractedRange;
	var fileCount;
	var stages;

	before('create path to use in the test', function (done) {
		this.timeout(testTimeout);
		outputPath = `${__dirname}/output/5.all-samples`;
		extractedRange = {};
		fileCount = 0;
		stages = [];

		// Clean and prepare work directory
		if (fs.existsSync(outputPath)) {
			fs.removeSync(outputPath);
		}
		createTestDirectory(outputPath);

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};

		var dicer = new pdfDicer();
		dicer
			.areas([
				// Top-center area
				{ top: "3%", right: "2%", left: "2%", bottom: "87" }
			])
			.on('stage', stage => {
				stages.push(stage);
			})
			.on('rangeExtracted', (range) => {
				extractedRange = range;
			})
			.on('split', (data, stream) => {
				stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
			})
			.on('splitted', () => {
				var count = 0;
				var fileNames = [
					'example-0000FC#BPyR+L.pdf',
					'example-0000MobL3y!<h.pdf',
					'example-0000MC#6PyadL.pdf'
				];
				fs.readdirSync(outputPath).forEach(file => {
					if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
						count++;
					}
				});
				fileCount = count;
				done();
			})
			.split(`${__dirname}/data/default/all-samples.pdf`, options, function (err, output) {

			});

	});

	// {{{
	it('should have a correct range object - rangeExtracted event', function () {
		expect(extractedRange).to.deep.equal({
			'http://rkj.io/0000FC#BPyR+L': {
				barcode: {
					id: '0000FC#BPyR+L',
					start: 'http://rkj.io/0000FC#BPyR+L',
					end: 'http://rkj.io/0000FC#BPyR+L'
				},
				pages: 2,
				from: 1
			},
			'http://rkj.io/0000MobL3y!<h': {
				barcode: {
					id: '0000MobL3y!<h',
					start: 'http://rkj.io/0000MobL3y!<h',
					end: 'http://rkj.io/0000MobL3y!<h'
				},
				pages: 2,
				from: 3
			},
			'http://rkj.io/0000MC#6PyadL': {
				barcode: {
					id: '0000MC#6PyadL',
					start: 'http://rkj.io/0000MC#6PyadL',
					end: 'http://rkj.io/0000MC#6PyadL'
				},
				pages: 2,
				from: 5
			}
		});
	});
	// }}}

	// {{{
	it('should emit stage events in correct order - splitted event', function () {
		expect(stages[0]).to.equal('init');
		expect(stages[1]).to.equal('readPDF');
		expect(stages[2]).to.equal('readPages');
		expect(stages[3]).to.equal('extracted');
		expect(stages[4]).to.equal('loadRange');
		expect(stages[5]).to.equal('splitPDFWithScissors');
	});
	// }}}

	// {{{
	it('should have correct number of output pdf file - splitted event', function () {
		expect(fileCount).to.equal(3);
	});
	// }}}

});

describe('6. pdf-dicer - split example-scanned-documents.pdf', () => {
	var extractedRange;
	var fileCount;
	var stages;

	before('create path to use in the test', function (done) {
		this.timeout(testTimeout);
		outputPath = `${__dirname}/output/6.example-scanned-documents`;
		extractedRange = {};
		fileCount = 0;
		stages = [];

		// Clean and prepare work directory
		if (fs.existsSync(outputPath)) {
			fs.removeSync(outputPath);
		}
		createTestDirectory(outputPath);

		var options = {
			temp: {
				prefix: 'pdfdicer-',
				dir: outputPath
			}
		};

		var dicer = new pdfDicer();
		dicer
			.areas([
				// Top-center area
				{ top: "3%", right: "2%", left: "2%", bottom: "87" }
			])
			.on('stage', stage => {
				stages.push(stage);
			})
			.on('rangeExtracted', (range) => {
				extractedRange = range;
			})
			.on('split', (data, stream) => {
				stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
			})
			.on('splitted', () => {
				var count = 0;
				var fileNames = [
					'example-false.pdf',
					'example-ok6b8R.pdf'
				];
				fs.readdirSync(outputPath).forEach(file => {
					if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
						count++;
					}
				});
				fileCount = count;
				done();
			})
			.split(`${__dirname}/data/example-scanned-documents.pdf`, options, function (err, output) {

			});

	});

	// {{{
	it('should have a correct range object - rangeExtracted event', function () {
		expect(extractedRange).to.deep.equal({
			'': {
				barcode: {
					id: false,
					start: false
				},
				pages: 2,
				from: 1
			},
			'http://rkj.io/ok6b8R': {
				barcode: {
					id: 'ok6b8R',
					start: 'http://rkj.io/ok6b8R',
					end: 'http://rkj.io/ok6b8R'
				},
				pages: 2,
				from: 3
			}
		});
	});
	// }}}

	// {{{
	it('should emit stage events in correct order - splitted event', function () {
		expect(stages[0]).to.equal('init');
		expect(stages[1]).to.equal('readPDF');
		expect(stages[2]).to.equal('readPages');
		expect(stages[3]).to.equal('extracted');
		expect(stages[4]).to.equal('loadRange');
		expect(stages[5]).to.equal('splitPDFWithScissors');
	});
	// }}}

	// {{{
	it('should have correct number of output pdf file - splitted event', function () {
		expect(fileCount).to.equal(2);
	});
	// }}}

});