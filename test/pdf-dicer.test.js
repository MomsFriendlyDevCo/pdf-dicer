var test = require('tape');

var debug = require('debug')('test');
var _ = require('lodash');
var fs = require('fs-extra')
var pdfDicer = require('..');
var outputPath = '';

// Define test timeout
var testTimeout = 60 * 1000;
// Define which test is skiped
var testOptions = [
	// Default Testing
	{ name: 'should split sample 1', skip: false, timeout: testTimeout },
	{ name: 'should split sample 2', skip: false, timeout: testTimeout },
	{ name: 'should split sample 3', skip: false, timeout: testTimeout },
	{ name: 'should split all-samples', skip: false, timeout: testTimeout },

	// Testing found incidences
	{ name: 'should split scanned documents countering the barcode with imagemagick options', skip: false, timeout: testTimeout },
];

// https://github.com/substack/tape/issues/59
var before = test;

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

before("before all tests", { timeout: testTimeout, skip: false }, function (assert) {
	outputPath = `${__dirname}/output`;
	// Clean and prepare work directory
	if (fs.existsSync(outputPath)) {
		fs.removeSync(outputPath);
	}
	createTestDirectory(outputPath);
	assert.end()
});

test(testOptions[0].name, { timeout: testOptions[0].timeout, skip: testOptions[0].skip }, function(assert) {
	outputPath = createTestDirectory(`${__dirname}/output/sample-1`);

	var options = {
		temp: {
			prefix: 'pdfdicer-',
			dir: outputPath
		}
	};

	var dicer = new pdfDicer();
	var stages = [];
	dicer
		.areas([
			// Top-center area
			{ top: "3%", right: "2%", left: "2%", bottom: "87" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range, {
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
		})
		.on('split', (data, stream) => {
			stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-0000FC#BPyR+L.pdf'
			];
			fs.readdirSync(outputPath).forEach(file => {
				if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
					fileCount++;
				}
			});
			assert.equal(fileCount, 1);

		})
		.split(`${__dirname}/data/default/sample-1.pdf`, options, function(err, output) {
			if (err) return assert.end(err);

			assert.end();
		});
});

test(testOptions[1].name, { timeout: testOptions[1].timeout, skip: testOptions[1].skip }, function(assert) {
	outputPath = createTestDirectory(`${__dirname}/output/sample-2`);

	var options = {
		temp: {
			prefix: 'pdfdicer-',
			dir: outputPath
		}
	};

	var dicer = new pdfDicer();
	var stages = [];
	dicer
		.areas([
			// Top-center area
			{ top: "3%", right: "2%", left: "2%", bottom: "87" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range, {
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
		})
		.on('split', (data, stream) => {
			stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-0000MobL3y!<h.pdf'
			];
			fs.readdirSync(outputPath).forEach(file => {
				if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
					fileCount++;
				}
			});
			assert.equal(fileCount, 1);

		})
		.split(`${__dirname}/data/default/sample-2.pdf`, options, function(err, output) {
			if (err) return assert.end(err);

			assert.end();
		});
});

test(testOptions[2].name, { timeout: testOptions[2].timeout, skip: testOptions[2].skip }, function(assert) {
	outputPath = createTestDirectory(`${__dirname}/output/sample-3`);

	var options = {
		temp: {
			prefix: 'pdfdicer-',
			dir: outputPath
		}
	};

	var dicer = new pdfDicer();
	var stages = [];
	dicer
		.areas([
			// Top-center area
			{ top: "3%", right: "2%", left: "2%", bottom: "87" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range, {
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
		})
		.on('split', (data, stream) => {
			stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-0000MC#6PyadL.pdf'
			];
			fs.readdirSync(outputPath).forEach(file => {
				if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
					fileCount++;
				}
			});
			assert.equal(fileCount, 1);

		})
		.split(`${__dirname}/data/default/sample-3.pdf`, options, function(err, output) {
			if (err) return assert.end(err);

			assert.end();
		});
});

test(testOptions[3].name, { timeout: testOptions[3].timeout, skip: testOptions[3].skip }, function(assert) {
	outputPath = createTestDirectory(`${__dirname}/output/all-samples`);

	var options = {
		temp: {
			prefix: 'pdfdicer-',
			dir: outputPath
		}
	};

	var dicer = new pdfDicer();
	var stages = [];
	var counter = 0;
	dicer
		.areas([
			// Top-center area
			{ top: "3%", right: "2%", left: "2%", bottom: "87" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range,{
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
		})
		.on('split', (data, stream) => {
			counter++;
			stream.pipe(fs.createWriteStream(`${outputPath}/example-${counter}-${data.barcode.id}.pdf`));
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-1-0000FC#BPyR+L.pdf',
				'example-2-0000MobL3y!<h.pdf',
				'example-3-0000MC#6PyadL.pdf'
			];
			fs.readdirSync(outputPath).forEach(file => {
				if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
					fileCount++;
				}
			});
			assert.equal(fileCount, 3);

		})
		.split(`${__dirname}/data/default/all-samples.pdf`, options, function(err, output) {
			if (err) return assert.end(err);

			assert.end();
		});
});

test(testOptions[4].name, { timeout: testOptions[4].timeout, skip: testOptions[4].skip }, function(assert) {
	outputPath = createTestDirectory(`${__dirname}/output/scanned-documents`);

	var options = {
		temp: {
			prefix: 'pdfdicer-',
			dir: outputPath
		}
	};

	var dicer = new pdfDicer();
	var stages = [];
	var counter = 0;
	dicer
		.areas([
			// Top-center area
			{ top: "3%", right: "2%", left: "2%", bottom: "87" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range, {
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
		})
		.on('split', (data, stream) => {
			counter++;
			stream.pipe(fs.createWriteStream(`${outputPath}/example-${counter}-${data.barcode.id}.pdf`));
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-1-false.pdf',
				'example-2-ok6b8R.pdf'
			];
			fs.readdirSync(outputPath).forEach(file => {
				if (!fs.lstatSync(outputPath + '/' + file).isDirectory() && fileNames.includes(file)) {
					fileCount++;
				}
			});
			assert.equal(fileCount, 2);

		})
		.split(`${__dirname}/data/example-scanned-documents.pdf`, options, function(err, output) {
			if (err) return assert.end(err);

			assert.end();
		});
});