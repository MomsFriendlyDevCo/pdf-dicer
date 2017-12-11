var _ = require('lodash');
var async = require('async-chainable');
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
function PDFDicer() {
	var dicer = this;

	dicer._defaults = {
		reader: {
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
	};

	dicer.new = () => new PDFDicer();

	dicer.defaults = function(options) {
		_.merge(this._defaults, options);
		return this;
	};

	dicer.areas = function(areas) {
		this._defaults.areas = areas;
		return this;
	};

	/**
	 * Take an input file and split it into many PDF files based on configured options
	 * @emits stage Fired at each stage of the process. ENUM: 'init', 'readPDF', 'readPages', 'extracted', 'loadRange', 'splitPDFWithScissors'
	 * 							'splitPDFWithScissors' stage is thrown as many times as is needed.
	 * @emits tempDir The temp dir used for storage
	 * @emits pageConverted  Fired with each page and pageOffset extracted as they are extracted
	 * @emits pagesConverted Fired with an array of all extracted page collection
	 * @emits pageAnalyze Fired before each page gets analyzed with the page object and offset
	 * @emits pageAnalyzed Fired after each page has been analyzed with the page object and offset
	 * @emits pagesAnalyzed Fired after all pages have been analyzed with the page collection
	 * @emits rangeExtracted Fired after the splitted range has been calculated from the original input pdf
	 * @emits split Fired after each pdf has been separated in the range and it gives you the pdf resultant
	 * @emits splitted Fired after pdf have been separated in the range
	 * @param {string} input The input path to process (ends in .pdf usually)
	 * @param {Object} [options] Optional options which override the defaults
	 * @param {function} callback Callback function to fire on completion or error
	 * @return {PDFDicer} This chainable object
	 */
	dicer.split = function(input, options, callback) {
		// Argument mangling {{{
		if (_.isFunction(options)) { // input, options
			callback = options;
			options = {};
		} else if (!_.isFunction(callback)) {
			throw new Error('Callback required as the final parametert of pdfDicer.convert()');
		}
		// }}}

		var settings = _.defaults({}, options, this._defaults);

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
					convertOptions: {
						'-quality': 100,
						'-density': 150,
						'-background': 'white',
						'-alpha': 'remove',
						'-gaussian-blur': '0x1'
					},
				}));
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
			// Convert the file into PNG images {{{
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
				dicer.emit('pageAnalyze', page, pageOffset)
				page.barcode = false;
				async()
					.limit(settings.threads.areas)
					.forEach(settings.areas, function(nextArea, area) {
						barcodeReader.decodeSingle(_.merge({}, settings.reader, {
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
						dicer.emit('pageAnalyzed', page, pageOffset);
						next();
					})
					.end(nextPage);
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
				dicer.emit('splitted', true);
				next();
			})
			// }}}
			.end(callback);

		return this;
	};
};

util.inherits(PDFDicer, events.EventEmitter);

module.exports = PDFDicer;
