PDF-Dicer
=========
Split PDF files into many based on barcode separators.

This is useful if scanning a large number of documents in a batch (e.g. via an automated office scanner) which then need to be split up again.

**WARNING: THIS MODULE IS HIGHLY UNSTABLE AND SHOULD NOT BE USED IN PRODUCTION**


PDF-Dicer takes a single PDF file made up of multiple scanned documents. Each sub-document has a starting and ending barcode.

![Input file](docs/input.png)


PDF-Dicer takes this file, splits on each barcode set, validates the barcodes and outputs back into individual files.

![Output process](docs/output.png)
