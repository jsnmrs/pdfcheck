# PDFcheck

[PDFcheck](https://code.jasonmorris.com/pdfcheck) is a browser-based tool that allows you to quickly analyze PDF files for signs of inaccessibility. It performs immediate local checks on one or multiple PDF files to identify if tags and accessibility-related metadata are present without transmitting any data externally.

This tool does not validate the accessibility of PDFs and is not intended to be used as a replacement for manual accessibility testing. It is designed to provide a quick and easy way to identify potential accessibility issues in PDF files.

## Features

- **Instant Local Analysis**: Check PDFs directly in your browser with no server uploads required
- **Batch Processing**: Analyze multiple PDF files simultaneously
- **Drag & Drop Support**: Easy file uploading through drag and drop interface
- **Comprehensive Checks**: Evaluates multiple criteria:
  - PDF tagging status and tag count
  - Document language settings
  - PDF/UA identifier presence
  - Document title properties
  - PDF version detection
  - Creator tool information
  - Producer details
  - Mark information status

## Key Accessibility Checks

### Tagged PDF Status

Verifies if the PDF contains proper structural tags, which are essential for accessibility. The tool:

- Detects the presence of `StructTreeRoot`
- Counts the number of tags if present
- Clearly indicates if a document is untagged

### Language Settings

Checks for proper language attribution:

- Verifies if a language identifier is set
- Displays the specified language code
- Supports both standard and hex-encoded language values

### Document Properties

Examines critical document metadata:

- Checks for document title presence and display settings
- Verifies PDF/UA compliance markers
- Validates mark information dictionary settings

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jsnmrs/pdfcheck.git
cd pdfcheck
```

2. Run locally using any static file server. For example:
```bash
npx serve
```

## Usage

1. **Web Interface**
   - Visit `http://localhost:3000` (or your server's address)
   - Use the file upload interface or drag and drop PDFs
   - View instant feedback on the status of each file

2. **Analyzing Files**
   - Upload single or multiple PDF files
   - Results are displayed immediately below the upload area
   - Each file's status is shown with details in text and color-coded indicators:
     - Green: Passing checks
     - Yellow: Warning conditions
     - Red: Failed checks

3. **Understanding Results**
   Each PDF is analyzed for:
   - PDF version
   - Tag status and count
   - Language settings
   - PDF/UA identifier
   - Document title
   - Creator tool
   - Producer information
   - Mark information status

## Development

### Key Components

- **UI Module**: Handles user interface updates and event management
- **File Operations**: Manages file reading and processing
- **PDF Analysis**: Contains specialized functions for PDF property extraction
- **Event Handling**: Implements drag-and-drop and form submission logic

## Security

- All file processing occurs locally in the browser
- No data is transmitted to external servers
- Files are processed using the HTML5 File API

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b new-feature`)
3. Commit your changes (`git commit -m 'Add a feature'`)
4. Push to the branch (`git push origin new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [HTML5 File API PDF validation techniques](https://blog.idrsolutions.com/2013/07/check-if-a-pdf-is-valid-using-html5-file-api/)
- [Stack Overflow: Tagged PDF indicators](https://stackoverflow.com/a/16275070)
- [Multiple file reading with FileReader API](https://stackoverflow.com/a/13975217)
- [CSS-Tricks: Drag and drop file uploading](https://css-tricks.com/drag-and-drop-file-uploading/)

## Author

Created by [Jason Morris](https://jasonmorris.com)

---

For more information, read the [PDFcheck blog post](https://jasonmorris.com/code/pdfcheck) or try the [live demo](https://code.jasonmorris.com/pdfcheck).
