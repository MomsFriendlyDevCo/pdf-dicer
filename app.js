#!/usr/bin/env node

var async = require('async-chainable');
var dicer = require('./index');
var minimatch = require('minimatch');
var program = require('commander');

program
	.version(require('./package.json').version)
	.usage('[options] [files...]')
	.option('-l, --list', 'List contents of PDF')
	.option('-w, --write', 'Output PDF files (use --dir to specify a path, otherwise the cwd is used)')
	.option('-d, --dir [path]', 'Output PDFs to the specified path instead of the current directory')
	.option('-p, --profile [profile]', 'Use the specified input profile. Options: quagga, bardecode')
	.option('-f, --filter [glob]', 'Only accept (and split on) barcodes with the supplied globbing expression')
	.option('-v, --verbose', 'Be verbose')
	.parse(process.argv);


async()
	// Sanity checks {{{
	.then(function(next) {
		if (!program.list) return next('You must specify --list and/or --write');
		next();
	})
	// }}}
	// Init dicer {{{
	.then('dicer', function(next) {
		next(null, new dicer());
	})
	// }}}
	// --filter {{{
	.then(function(next) {
		if (!program.filter) return next();
		this.dicer.set('filter', page => page.barcode ? minimatch(page.barcode, program.filter) : false);
		next();
	})
	// }}}
	// --profile {{{
	.then(function(next) {
		if (!program.profile) return next();
		this.dicer
			.profile(program.profile)
			.set('bardecode.checkEvaluation', false) // STFU about eval versions

		next();
	})
	// }}}
	// --verbose {{{
	.then(function(next) {
		if (!program.verbose) return next();

		this.dicer.on('stage', stage => console.log('Stage =', stage));

		this.dicer.on('barcodeFiltered', page => {
			if (page.barcode !== false) console.log('Barcode rejected on page', page.number, '=', page.barcode)
		});

		next();
	})
	// }}}
	// --list {{{
	.then(function(next) {
		if (!program.list) return next();

		this.dicer.on('pageAnalyzed', page => {
			if (page.barcode) console.log('Barcode extracted from page', page.number, '=', page.barcode);
		});

		this.dicer.on('split', range => {
			console.log('Split!', `Pages ${range.from} - ${range.from + range.pages} (${range.pages} pages)`, range.barcode.id);
		});

		next();
	})
	// }}}
	// --write {{{
	.then(function(next) {
		if (!program.write) return next();
		next();
	})
	// }}}
	// Execute the split process {{{
	.limit(1)
	.forEach(program.args, function(next, path) {
		this.dicer.split(path, next);
	})
	// }}}
	// End {{{
	.end(function(err) {
		if (err) {
			console.log('ERROR', err.toString());
			process.exit(1);
		} else {
			process.exit(0);
		}
	});
	// }}}
