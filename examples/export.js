#!/usr/bin/env node
/**
* This is a simple PDF-Dicer export script which takes a directory, scans all PDFs and exports all found files elsewhere
*
* To run (from the project root directory):
* ./examples/export.js
*/

var async = require('async-chainable');
var Dicer = require('..');
var fs = require('fs');
var fspath = require('path');

var dicer = new Dicer({ // Setup pdf-dicer instance
	driver: 'quagga',
	areas: [ // Where to look per-page for a barcode
		{ top: "0%", right: "0%", left: "0%", bottom: "0%" } // Default to scan everywhere (better to be specific if you can)
	],
});

var exported = 0;
var pathFrom = `${__dirname}/../test/data/default`; // Or wherever your files-to-process live
var pathTo = `${__dirname}/../test/output`;

async()
	.then('paths', ()=> fs.promises.readdir(pathFrom))
	.limit(1) // Process files one at a time, change to '0' to do everything in parallel or >0 to limit to that number of threads
	.forEach('paths', (next, file) => {
		var fullPath = fspath.join(pathFrom, file);

		console.log('Reading file', fullPath);
		dicer
			.on('split', (data, buffer) => {
				var fullPathTo = fspath.join(pathTo, data.barcode.id + '.pdf');
				console.log('* Found barcode', data.barcode.id, 'saving as', fullPathTo);
				exported++;
				return fs.promises.writeFile(fullPathTo, buffer); // Write the output file
			})
			.split(fullPath, next);
	})
	.end(err => {
		if (err) {
			console.warn('Error:', err);
			process.exit(1);
		} else {
			console.log('All done');
			console.log('Exported', exported, 'PDFs');
		}
	});
