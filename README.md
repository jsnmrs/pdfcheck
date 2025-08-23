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

## Quick Start

1. Clone the repository: `git clone https://github.com/jsnmrs/pdfcheck.git && cd pdfcheck`
2. Serve the files locally: `npx serve`
3. Open your browser and navigate to `http://localhost:3000`
4. Upload PDF files using the file picker or drag and drop interface

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

## Examples

### Visual Result States

PDFcheck displays results with color-coded indicators for quick assessment:

- **Success (Green background)**: Indicates the check passed successfully
  - Tagged: Yes (with tag count)
  - Language: Set with valid code (e.g., en-US)
  - Marked: True
  - PDF/UA identifier: Yes

- **Warning (Yellow background)**: Indicates a potential issue that may need attention
  - Marked: False
  - PDF/UA identifier: Not set
  - Document Title: Empty or Not set
  - Creator Tool: Not set
  - Producer: Not set

- **Failure (Red background)**: Indicates a critical accessibility issue
  - Tagged: No
  - Language: Not set
  - Marked: No
  - Document Title: Not set

- **Default (Gray background)**: Neutral information display
  - PDF Version display
  - File information headers

### Batch Processing

The tool can analyze multiple PDFs simultaneously. Select or drag multiple files, and each will be processed and displayed with its individual results, numbered sequentially with file size information.

## Limitations

PDFcheck is designed as a quick screening tool with the following limitations:

- Does not validate the correctness of existing tags (only checks for their presence)
- Cannot fix accessibility issues (detection only)
- Does not perform full WCAG compliance validation
- Uses text-based PDF analysis which may not detect all edge cases
- Does not check for proper reading order
- Cannot validate alt text quality or appropriateness
- Does not examine table structure validity
- Cannot detect issues with form field labels or descriptions
- Does not replace the need for manual accessibility testing

## Technical Architecture

PDFcheck is built as a lightweight, client-side application with the following architecture:

- **Pure JavaScript implementation**: No external dependencies or frameworks required
- **FileReader API**: Enables local file processing without server uploads
- **Regex-based PDF analysis**: Parses PDF structure to extract accessibility metadata
- **Privacy-focused**: All processing occurs in the browser with no external data transmission
- **Modular design**: Separated concerns for UI updates, file operations, and PDF analysis

## Development

### Key Components

- **UI Module**: Handles user interface updates and event management
- **File Operations**: Manages file reading and processing
- **PDF Analysis**: Contains specialized functions for PDF property extraction
- **Event Handling**: Implements drag-and-drop and form submission logic

## Test Files

The `/examples` directory contains sample PDFs for testing various accessibility scenarios:

### Files Without Accessibility Features

- `not-pdf.txt`: Non-PDF file for testing file validation
- `not-tagged.pdf`: PDF without any structural tags
- `not-tagged-with-UA.pdf`: Untagged PDF that includes PDF/UA identifier
- `not-tagged-with-doctitle.pdf`: Untagged PDF with document title set
- `not-tagged-with-filename.pdf`: Untagged PDF with only filename as title
- `not-tagged-with-language.pdf`: Untagged PDF with language attribute set

### Files With Accessibility Features

- `tagged-with-UA.pdf`: Properly tagged PDF with PDF/UA compliance
- `tagged-no-UA.pdf`: Tagged PDF without PDF/UA identifier
- `tagged-no-UA-with-filename.pdf`: Tagged PDF using filename as title
- `tagged-PAC2-pass.pdf`: PDF that passes PAC 2 validation
- `tagged-HTML-headings-PAC-2024-pass.pdf`: Tagged PDF with HTML headings passing PAC 2024
- `tagged-HTML-headings-chrome.pdf`: PDF with HTML headings created in Chrome
- `tagged-HTML-headings-chrome-espanol.pdf`: Spanish language PDF with HTML headings from Chrome

### Using Test Files

1. Navigate to the `/examples` directory
2. Upload individual files or multiple files to test batch processing
3. Compare results against expected outcomes based on filename descriptions
4. Use these files to verify the tool is working correctly after updates

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
