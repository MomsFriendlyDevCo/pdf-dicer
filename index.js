var _ = require('lodash');
var async = require('async-chainable');
var asyncExec = require('async-chainable-exec');
var barcodeReader = require('quagga').default;
var events = require('events');
var fs = require('fs');
var temp = require('temp');
var pdfImage = require('pdf-image').PDFImage;
var scissors = require('scissors');
var util = require('util');

/**
 * PDFDicer functions that gives the all functionality.
 */
function PDFDicer(options) {
	var dicer = this;

	dicer.settings = _.defaults(options, {
		profile: 'quagga', // Default profile to use
		areas: [
			// Top-center area
			{ top: "3%", right: "2%", left: "2%", bottom: "87" }
		],
		imageFormat: 'png',
		magickOptions: {}, // Options passed to ImageMagick when converting pdf -> page output format
		bardecode: {
			bin: '/opt/bardecoder/bin/bardecode',
			checkEvaluation: true,
			serial: '',
		},
		quagga: { // Options passed to Quagga
			numOfWorkers: 0, // Always 0 in Node backend
			locate: false, // We have to indicate the location of the barcode
			inputStream: {
				size: false, // Force full image resolution
			},
			decoder: {
				readers: ['code_128_reader'],
				multiple: false,
			},
		},
		temp: {
			prefix: 'pdfdicer-',
		},
		threads: {
			pages: 1,
			areas: 1,
		},
	});

	dicer.profile = name => {
		switch (name) {
			case 'quagga':
				_.merge(dicer.settings, {
					driver: 'quagga',
					imageFormat: 'png',
					magickOptions: {
						'-quality': 100,
						'-density': 150,
						'-background': 'white',
						'-alpha': 'remove',
						'-gaussian-blur': '0x1',
					},
				});
				break;
			case 'bardecode':
				_.merge(dicer.settings, {
					driver: 'bardecode',
					imageFormat: 'tif',
					magickOptions: {},
				});
				break;
			default:
				throw new Error(`Unknown profile: ${name}`);
		}

		return this;
	};


	/**
	* Convenience function to quickly set a setting
	* @param {string} key The key of the setting to set, dotted notation is supported
	* @param {*} value The value to set to
	* @return {Object} This chainable object
	*/
	dicer.set = (key, value) => {
		_.set(dicer.settings, key, value);
		return dicer;
	};


	/**
	* Shortcut function to set the areas used by the split function
	* @param {array} areas The areas array to set. Each option should have `top`, `right`, `left`, `bottom` which are either percentages or absolute values
	* @return {Object} This chainable object
	*/
	dicer.areas = areas => {
		_.merge(this.settings.areas, areas);
		return this;
	};

	/**
	 * Take an input file and split it into many PDF files based on configured options
	 * @param {string} input The input path to process (ends in .pdf usually)
	 * @param {Object} [options] Optional options which override the defaults
	 * @param {function} callback Callback function to fire on completion or error
	 * @return {PDFDicer} This chainable object
	 *
	 * @emits stage Fired at each stage of the process. ENUM: 'init', 'readPDF', 'readPages', 'extracted', 'loadRange', 'splitPDFWithScissors', 'splitPDFWithScissors' stage is thrown as many times as is needed.
	 * @emits tempDir The temp dir used for storage
	 * @emits pageConverted  Fired with each page and pageOffset extracted as they are extracted
	 * @emits pagesConverted Fired with an array of all extracted page collection
	 * @emits pageAnalyze Fired before each page gets analyzed with the page object
	 * @emits pageAnalyzed Fired after each page has been analyzed with the page object
	 * @emits pagesAnalyzed Fired after all pages have been analyzed with the page collection
	 * @emits rangeExtracted Fired after the splitted range has been calculated from the original input pdf
	 * @emits split Fired after each pdf has been separated in the range and it gives you the pdf resultant
	 * @emits splitted Fired after pdf have been separated in the range
	 */
	dicer.split = function(input, options, callback) {
		// Argument mangling {{{
		if (_.isFunction(options)) { // Called as: input, callback
			callback = options;
			options = {};
		} else if (!_.isFunction(callback)) {
			throw new Error('Callback required as the final parametert of pdfDicer.convert()');
		}
		// }}}

		var settings = _.defaults({}, options, this.settings);

		async()
			// Sanity checks {{{
			.then(function(next) {
				dicer.emit('stage', 'init');
				if (!_.isString(input)) return next('Unknown input type');
				next();
			})
			// }}}
			// Check file exists {{{
			.then(function(next) {
				fs.access(input, err => next(err ? 'File not found' : null));
			})
			// }}}
			// Prepare (temp directory) {{{
			.then('tempDir', function(next) {
				temp.mkdir(settings.temp, next);
			})
			// }}}
			// Build the PDF processing instance {{{
			// More information about image processing on https://www.imagemagick.org/script/command-line-options.php
			.then('pdf', function(next) {
				dicer.emit('tempDir', this.tempDir);
				next(null, new pdfImage(input, {
					outputDirectory: this.tempDir,
					convertOptions: settings.magickOptions,
				}));
			})
			// }}}
			// Set output image format {{{
			.then(function(next) {
				this.pdf.setConvertExtension(settings.imageFormat);
				next();
			})
			// }}}
			// Extract info about the input file {{{
			.then('info', function(next) {
				dicer.emit('stage', 'readPDF');
				this.pdf.getInfo()
					.catch(e => next(e))
					.then(data => next(null, data), next)
			})
			// }}}
			// Convert the file into images {{{
			.set('pages', {})
			.then(function(next) {
				dicer.emit('stage', 'readPages');
				async()
					.set('pdf', this.pdf)
					.set('pages', this.pages)
					.forEach(0, parseInt(this.info.Pages) - 1, function(next, pageNumber) {
						this.pdf.convertPage(pageNumber)
							.then(path => {
								this.pages[pageNumber] = {
									path: path,
								},
								dicer.emit('pageConverted', this.pages[pageNumber], pageNumber);
								next();
							})
							.catch(next)
					})
					.end(next);
			})
			// }}}
			// Post conversion emitters {{{
			.then(function(next) {
				dicer.emit('pagesConverted', this.pages);
				dicer.emit('stage', 'extracted');
				next();
			})
			// }}}
			// Read each page and extract a barcode if there is one {{{
			.limit(settings.threads.pages)
			.forEach('pages', function(nextPage, page, pageOffset) {
				page.number = parseInt(pageOffset) + 1;
				page.barcode = false;
				dicer.emit('pageAnalyze', page)
				if (settings.driver == 'quagga') {
					async()
						.limit(settings.threads.areas)
						.forEach(settings.areas, function(nextArea, area) {
							barcodeReader.decodeSingle(Object.assign({}, settings.quagga, {
								src: page.path,
								inputStream: {
									area: area,
								},
							}), function(res) {
								if (!page.barcode && res && res.codeResult) page.barcode = res.codeResult.code;
								nextArea();
							});
						})
						.then(function(next) {
							dicer.emit('pageAnalyzed', page);
							next();
						})
						.end(nextPage);
				} else if (settings.driver == 'bardecode') {
					var runCommand = [
						settings.bardecode.bin,
						page.path,
					];
					if (settings.bardecode.serial) runCommand.push('-K', settings.bardecode.serial); // Append serial number if we have one

					async()
						.use(asyncExec)
						.exec('response', runCommand)
						.then('response', function(next) {
							var firstExtracted = _(this.response)
								.filter(i => ! /^EVALUATION MODE/.test(i))
								.first();

							if (firstExtracted) page.barcode = firstExtracted;

							if (settings.bardecode.checkEvaluation && /\?\?\?$/.test(page.barcode)) console.warn('You are using an evaluation version of Bardecode - the last three digits of the barcode are obscured!');

							next();
						})
						.then(function(next) {
							dicer.emit('pageAnalyzed', page);
							next();
						})
						.end(nextPage);
				} else {
					throw new Error(`Unknown page decoder: ${settings.driver}`);
				}
			})
			// }}}
			// Post pages analyzed emitters {{{
			.then(function(next) {
				dicer.emit('pagesAnalyzed', this.pages);
				next();
			})
			// }}}
			// Build range to split the pdf {{{
			.set('range', new Object())
			.then(function(next) {
				dicer.emit('stage', 'loadRange');
				var memBarcodeID = '';
				var rangeCount = 1;
				var index = 0;

				try {
					for (var key in this.pages) {
						if (this.pages.hasOwnProperty(key)) {
							var page = this.pages[key];
							memBarcodeID = (page.barcode === false) ? memBarcodeID : page.barcode.split('-')[0];

							if (this.range[memBarcodeID] == null) {
								this.range[memBarcodeID] = new Object();
								this.range[memBarcodeID].barcode = new Object();
								try {
									this.range[memBarcodeID].barcode.id = page.barcode.substring(page.barcode.lastIndexOf("/") + 1, page.barcode.length);
								} catch (error) {
									// The barcode scanner is not able to find the barcode information.
									this.range[memBarcodeID].barcode.id = page.barcode;
								}
								this.range[memBarcodeID].barcode.start = page.barcode;
								this.range[memBarcodeID].pages = 1;
								this.range[memBarcodeID].from = index + 1;
							} else {
								this.range[memBarcodeID].pages++;
								if (page.barcode !== false)
									this.range[memBarcodeID].barcode.end = page.barcode;
							}
						}
						index++;
					}
				} catch (error) {
					console.error('[PDF-DICER] Error', error);
					return next(error);
				}

				next();
			})
			// }}}
			// Emits the data with the range to split the pdf {{{
			.then(function(next) {
				dicer.emit('rangeExtracted', this.range);
				next();
			})
			// }}}
			// Gives the resultant split pdfs {{{
			.forEach('range', function(nextRange, range, rangeIndex) {
				dicer.emit('stage', 'splitPDFWithScissors');
				var from = range.from;
				var to = range.from + range.pages - 1;

				dicer.emit('split', range, scissors(input).range(from, to).pdfStream());

				nextRange();
			})
			// }}}
			// Emits the end signal for the functionality {{{
			.then(function(next) {
				dicer.emit('splitted');
				next();
			})
			// }}}
			.end(callback);

		return this;
	};

	dicer.profile(dicer.settings.profile); // Load default profile
};

util.inherits(PDFDicer, events.EventEmitter);

module.exports = PDFDicer;
