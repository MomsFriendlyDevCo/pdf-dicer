var test = require('tape');

var debug = require('debug')('test');
var _ = require('lodash');
var fs = require('fs-extra');
var pdfDicer = require('..');
var outputPath = '';

var profile = 'quagga'; // bardecode/quagga
var isBardecode = (profile === 'bardecode')
var ids = [
	'0000FC#BPyR+L',
	'0000MobL3y!<h',
	'0000MC#6PyadL'
];
if (isBardecode)
	ids = ids.map(i => i.slice(0, -3) + '???');

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

	var dicer = new pdfDicer({profile: profile});
	var stages = [];
	dicer
		.areas([
			{ top: "0%", right: "0%", left: "0%", bottom: "0%" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range, {
				['http://rkj.io/' + ids[0]]: {
					barcode: {
						id: ids[0],
						start: 'http://rkj.io/' + ids[0],
						end: 'http://rkj.io/' + ids[0]
					},
					pages: 2,
					from: 1
				}
			});
		})
		.on('split', (data, stream) => {
			//stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
			fs.writeFileSync(`${outputPath}/example-${data.barcode.id}.pdf`, stream);
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-' + ids[0] + '.pdf'
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

	var dicer = new pdfDicer({profile: profile});
	var stages = [];
	dicer
		.areas([
			{ top: "0%", right: "0%", left: "0%", bottom: "0%" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range, {
				['http://rkj.io/' + ids[1]]: {
					barcode: {
						id: ids[1],
						start: 'http://rkj.io/' + ids[1],
						end: 'http://rkj.io/' + ids[1]
					},
					pages: 2,
					from: 1
				}
			});
		})
		.on('split', (data, stream) => {
			//stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
			fs.writeFileSync(`${outputPath}/example-${data.barcode.id}.pdf`, stream);
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-' + ids[1] + '.pdf'
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

	var dicer = new pdfDicer({profile: profile});
	var stages = [];
	dicer
		.areas([
			{ top: "0%", right: "0%", left: "0%", bottom: "0%" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range, {
				['http://rkj.io/' + ids[2]]: {
					barcode: {
						id: ids[2],
						start: 'http://rkj.io/' + ids[2],
						end: 'http://rkj.io/' + ids[2]
					},
					pages: 2,
					from: 1
				}
			});
		})
		.on('split', (data, stream) => {
			//stream.pipe(fs.createWriteStream(`${outputPath}/example-${data.barcode.id}.pdf`));
			fs.writeFileSync(`${outputPath}/example-${data.barcode.id}.pdf`, stream);
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-' + ids[2] + '.pdf'
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

	var dicer = new pdfDicer({profile: profile});
	var stages = [];
	var counter = 0;
	dicer
		.areas([
			{ top: "0%", right: "0%", left: "0%", bottom: "0%" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			assert.deepEqual(range,{
				['http://rkj.io/' + ids[0]]: {
					barcode: {
						id: ids[0],
						start: 'http://rkj.io/' + ids[0],
						end: 'http://rkj.io/' + ids[0]
					},
					pages: 2,
					from: 1
				},
				['http://rkj.io/' + ids[1]]: {
					barcode: {
						id: ids[1],
						start: 'http://rkj.io/' + ids[1],
						end: 'http://rkj.io/' + ids[1]
					},
					pages: 2,
					from: 3
				},
				['http://rkj.io/' + ids[2]]: {
					barcode: {
						id: ids[2],
						start: 'http://rkj.io/' + ids[2],
						end: 'http://rkj.io/' + ids[2]
					},
					pages: 2,
					from: 5
				}
			});
		})
		.on('split', (data, stream) => {
			counter++;
			//stream.pipe(fs.createWriteStream(`${outputPath}/example-${counter}-${data.barcode.id}.pdf`));
			fs.writeFileSync(`${outputPath}/example-${counter}-${data.barcode.id}.pdf`, stream);
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-1-' + ids[0] + '.pdf',
				'example-2-' + ids[1] +'.pdf',
				'example-3-' + ids[2] + '.pdf'
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

	var id = 'ok6b8R';
	if (isBardecode)
		id = id.slice(0, -3);
	var dicer = new pdfDicer({profile: profile});
	var stages = [];
	var counter = 0;
	dicer
		.areas([
			{ top: "0%", right: "0%", left: "0%", bottom: "0%" }
		])
		.on('stage', stage => {
			debug('stage:', stage);
			stages.push(stage);
		})
		.on('rangeExtracted', (range) => {
			console.log('range', range);
			assert.deepEqual(range, {
				'': {
					barcode: {
						id: false,
						start: false
					},
					pages: 2,
					from: 1
				},
				['http://rkj.io/' + id]: {
					barcode: {
						id: id,
						start: 'http://rkj.io/' + id,
						end: 'http://rkj.io/' + id
					},
					pages: 2,
					from: 3
				}
			});
		})
		.on('split', (data, stream) => {
			counter++;
			//stream.pipe(fs.createWriteStream(`${outputPath}/example-${counter}-${data.barcode.id}.pdf`));
			fs.writeFileSync(`${outputPath}/example-${counter}-${data.barcode.id}.pdf`, stream);
		})
		.on('splitted', () => {
			var fileCount = 0;
			var fileNames = [
				'example-1-false.pdf',
				'example-2-' + id + '.pdf'
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