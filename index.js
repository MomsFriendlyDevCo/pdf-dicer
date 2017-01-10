var _ = require('lodash');
var async = require('async-chainable');
var barcodeReader = require('quagga').default;
var events = require('events');
var temp = require('temp');
var pdfImage = require('pdf-image').PDFImage;
var util = require('util');

function PDFDicer() {
	var dicer = this;

	dicer._defaults = {
		temp: {
			prefix: 'pdfdicer-',
		},
		threads: 1,
	};

	dicer.new = ()=> new PDFDicer();

	dicer.defaults = function(options) {
		_.assign(this._defaults, options);
		return this;
	};


	/**
	* Take an input file and split it into many PDF files based on configured options
	* @emits stage Fired at each stage of the process. ENUM: 'init', 'readPDF', 'readPages', 'extracted'
	* @emits tempDir The temp dir used for storage
	* @emits pageConverted  Fired with each page and pageOffset extracted as they are extracted
	* @emits pagesConverted Fired with an array of all extracted page collection
	* @emits pageAnalyze Fired before each page gets analyzed with the page object and offset
	* @emits pageAnalyzed Fired after each page has been analyzed with the page object and offset
	* @emits pagesAnalyzed Fired after all pages have been analyzed with the page collection
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
			// Prepare (temp directory) {{{
			.then('tempDir', function(next) {
				temp.mkdir(settings.temp, next);
			})
			// }}}
			// Build the PDF processing instance {{{
			.then('pdf', function(next) {
				dicer.emit('tempDir', this.tempDir);
				next(null, new pdfImage(input, {
					outputDirectory: this.tempDir,
					convertOptions: {
						'-quality': 100,
						'-density': 150,
					},
				}));
			})
			// }}}
			// Extract info about the input file {{{
			.then('info', function(next) {
				dicer.emit('stage', 'readPDF');
				this.pdf.getInfo()
					.catch(e => next(e))
					.then(data => next(null, data))
			})
			// }}}
			// Convert the file into PNG images {{{
			.set('pages', {})
			.then(function(next) {
				dicer.emit('stage', 'readPages');
				async()
					.set('pdf', this.pdf)
					.set('pages', this.pages)
					.forEach(parseInt(this.info.Pages) - 1, function(next, pageNumber) {
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
			.limit(settings.threads)
			.forEach('pages', function(next, page, pageOffset) {
				dicer.emit('pageAnalyze', page, pageOffset)
				barcodeReader.decodeSingle({
					src: page.path,
					numOfWorkers: 0, // Always 0 in Node backend
					locate: true, // Search for the barcode on the page
					inputStream: {
						size: false, // Force full image resolution
						area: {
							top: "0%",
							right: "50%",
							left: "0%",
							bottom: "60%",
						},
					},
					decoder: {
						readers: ['code_128_reader'],
						multiple: false,
					},
				}, function(res) {
					page.barcode = res && res.codeResult ? res.codeResult.code : false;
					dicer.emit('pageAnalyzed', page, pageOffset);
					next();
				});
			})
			// }}}
			.then(function(next) {
				dicer.emit('pagesAnalyzed', this.pages);
				next();
			})
			.end(callback);

		return this;
	};
};

util.inherits(PDFDicer, events.EventEmitter);

module.exports = PDFDicer;
