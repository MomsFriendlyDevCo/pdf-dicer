PDF-Dicer
=========
Split PDF files into many based on barcode separators.

This is useful if scanning a large number of documents in a batch (e.g. via an automated office scanner) which then need to be split up again.

PDF-Dicer takes a single PDF file made up of multiple scanned documents. Each sub-document has a starting and ending barcode.

![Input file](docs/input.png)


PDF-Dicer takes this file, splits on each barcode set, validates the barcodes and outputs back into individual files.

![Output process](docs/output.png)


Installing
----------
This module requires ImageMagick, GhostScript and Poppler.

You can install them as follows:

* **Ubuntu Linux** - `sudo apt-get install imagemagick ghostscript poppler-utils pdftk`
* **OSX (Yosemite)** - `brew install imagemagick ghostscript poppler`
  * Install [PDFTK](https://www.pdflabs.com/tools/pdftk-server/#download) from website.


Example
-------
```javascript
var pdfDicer = require('pdf-dicer');

var dicer = new pdfDicer();

dicer
	.on('split', (data, buffer) => {
	  fs.writeFile('output.pdf', buffer);
	})
	.split('input.pdf', function(err, output) {
		if (err) console.log(`Something went wrong: ${err}`);
	});
```


API
===

dicer (class)
-------------
The main class of this module.

The constructor takes an optional settings object which is used to populate the initial setup.

```javascript
var dicer = new pdfDicer({driver: 'quagga'});
```

dicer.settings (object)
-----------------------
An object of the instance settings. These can be set either on construction, via a call to `set()` or directly.

The following settings are supported:

| Setting                     | Type      | Default                                           | Profile   | Description                                                                      |
|-----------------------------|-----------|---------------------------------------------------|-----------|----------------------------------------------------------------------------------|
| `areas`                     | Array     | `{top:'3%',right:'2%',left:'2%',bottom:87}`       | Quagga    | The areas of the input pages that Quagga should scan                             |
| `imageFormat`               | String    | `png` (Quagga), `tif` (Bardecode)                 | All       | The intermediate image format to use before processing the barcode               |
| `magickOptions`             | Object    | Various (Quagga), `{}` (Bardecode)                | All       | Additional options to pass to ImageMagick when converting the PDF to images      |
| `bardecode`                 | Object    | See below                                         | Bardecode | Options specific to Bardecode                                                    |
| `bardecode.bin`             | String    | `/opt/bardecoder/bin/bardecode`                   | Bardecode | Path to the `bardecode` binary                                                   |
| `bardecode.checkEvaluation` | Boolean   | `true`                                            | Bardecode | Check that the barcode doesn't end in `???` and raise a warning if it does       |
| `bardecode.serial`          | String    | `""`                                              | Bardecode | Your Bardecode serial number                                                     |
| `filter`                    | Function  | `(page) => true`                                  | All       | Optional filter to discard pages before calculating ranges                       |
| `quagga`                    | Object    | See below                                         | Quagga    | Options specific to Quagga                                                       |
| `quagga.locate`             | Boolean   | `false`                                           | Quagga    | Indicates if Quagga should try to detect the barcode or we should use areas      |
| `quagga.decoder`            | Object    | `{readers:['code_128_reader'],multiple: false}`   | Quagga    | Options passed to the Quagga decoder                                             |
| `temp`                      | Object    | See below                                         | All       | Options passed to Temp when generating a temporary directory                     |
| `tempClean`                 | Boolean   | `true`                                            | All       | Automatically erase the temporary directory when done                            |
| `temp.prefix`               | String    | `pdfdicer-`                                       | All       | The prefix used when generating a temporary directory                            |
| `threads`                   | Object    | See below                                         | All       | Options used for async threading                                                 |
| `threads.pages`             | Number    | `1`                                               | All       | The number of threads allowed to run simultaneously when processing pages        |
| `threads.areas`             | Number    | `1`                                               | Quagga    | The number of threads allowed to run simultaneously when processing page areas   |


dicer.set(setting, value)
-------------------------
Convenience function to quickly set a setting. Dotted notation is allowed for `setting`.


dicer.profile(profile)
----------------------
Convenience function to configure the module with optimal settings for the supported barcode readers.

Supported profiles are:

* `quagga`
* `bardecode`


dicer.split(inputPath, callback)
--------------------------------
Process the inputPath (usually a PDF) and split it into multiple PDF files.

Hook into the output of this function by trapping events.


Events
------
The following events are fired by this module:

| Event             | Arguments            | Description                                                 |
|-------------------|----------------------|-------------------------------------------------------------|
| `stage`           | `(stageName)`        | Fired for each stage of operation. ENUM: 'init', 'readPDF', 'readPages', 'extracted', 'filtering', 'loadRange', 'preSplit' |
| `tempDir`         | `(path)`             | Fired when a temp directory has been allocated              |
| `pageConverted`   | `(page, pageOffset)` | Fired for each page that is converted                       |
| `pagesConverted`  | `(pages)`            | Fired when all pages have been converted                    |
| `pageAnalyze`     | `(page)`             | Fired before an individual page is analyzed                 |
| `barcodeFiltered` | `(page)`             | Fired if a page is filtered out                             |
| `barcodePassed`   | `(page)`             | Fired if a page passes filtering and is not filtered out    |
| `pageAnalyzed`    | `(page)`             | Fired after a page has been analyzed                        |
| `pagesAnalyzed`   | `(pages)`            | Fired when all pages have been analyzed                     |
| `split`           | `(range, buffer)`    | Fired when a range has been detected and a buffer is ready  |
