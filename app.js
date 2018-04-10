#!/usr/bin/env node

var async = require('async-chainable');
var colors = require('chalk');
var dicer = require('./index');
var fs = require('fs');
var fspath = require('path');
var minimatch = require('minimatch');
var program = require('commander');

program
	.version(require('./package.json').version)
	.usage('[options] [files...]')
	.option('-l, --list', 'List contents of PDF')
	.option('-w, --write', 'Output PDF files (use --dir to specify a path, otherwise the cwd is used)')
	.option('-d, --dir [path]', 'Output PDFs to the specified path instead of the current directory')
	.option('-p, --profile [profile]', 'Use the specified input profile. Options: quagga, bardecode')
	.option('-s, --set [setting=value]', 'CSV of specific Dicer settings (e.g. `--set bardecode.serial=1234)`')
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
		if (program.verbose) console.log(colors.blue('info '), 'Using barcode glob', colors.cyan(program.filter));
		this.dicer.set('filter', page => page.barcode ? minimatch(page.barcode, program.filter) : false);
		next();
	})
	// }}}
	// --set {{{
	.then(function(next) {
		if (!program.set) return next();
		program.set.split(/\s*,\s*/).forEach(rawSetting => {
			var [key, val] = rawSetting.split(/\s*=\s*/);
			if (program.verbose) console.log(colors.blue('info '), 'Using setting [' + colors.cyan(key) + ']', '=', '[' + colors.cyan(val) + ']');
			this.dicer.set(key, val);
		});
		next();
	})
	// }}}
	// --profile {{{
	.then(function(next) {
		if (!program.profile) return next();
		if (program.verbose) console.log(colors.blue('info '), 'Using profile', colors.cyan(program.profile));
		this.dicer
			.profile(program.profile)
			.set('bardecode.checkEvaluation', false) // STFU about eval versions

		next();
	})
	// }}}
	// --verbose {{{
	.then(function(next) {
		if (!program.verbose) return next();

		this.dicer.on('stage', stage => console.log(colors.blue('stage'), stage));

		this.dicer.on('barcodeFiltered', page => {
			if (page.barcode !== false) console.log(colors.yellow('warn '), 'Barcode rejected on page', colors.cyan(page.number), '=', colors.cyan(page.barcode));
		});

		next();
	})
	// }}}
	// --list {{{
	.then(function(next) {
		if (!program.list) return next();

		this.dicer.on('pageAnalyzed', page => {
			if (page.barcode) console.log(colors.blue('info '), 'Barcode extracted from page', colors.cyan(page.number), '=', colors.cyan(page.barcode));
		});

		this.dicer.on('split', range => {
			console.log(colors.bold.blue('split'), 'Pages', colors.cyan(range.from), '-', colors.cyan(range.from + range.pages), `(${colors.cyan(range.pages)} pages)`, '=', colors.cyan(range.barcode.id));
		});

		next();
	})
	// }}}
	// --write {{{
	.set('writeBuffers', async())
	.then(function(next) {
		if (!program.write) return next();

		this.dicer.on('split', (range, buffer) => {
			this.writeBuffers.defer(next => {
				fs.writeFile(fspath.join(program.dir || process.cwd(), `OUT-${range.from}-${range.to}.pdf`), buffer, next);
			});
		});

		next();
	})
	// }}}
	// Execute the split process {{{
	.limit(1)
	.forEach(program.args, function(next, path) {
		this.dicer.split(path, next);
	})
	// }}}
	// Wait for buffers to flush if we are saving documents {{{
	.then(function(next) {
		this.writeBuffers
			.await()
			.end(next);
	})
	// }}}
	// End {{{
	.end(function(err) {
		if (err) {
			console.log(colors.bold.red('ERROR'), err.toString());
			process.exit(1);
		} else {
			process.exit(0);
		}
	});
	// }}}
