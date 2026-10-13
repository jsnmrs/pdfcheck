(function pdfCheck() {
  // Results collected for CSV export, one entry per flag
  let results = [];
  let currentFile = "";

  // Utility functions for UI updates and event handling
  const ui = {
    announceStatus: function (message) {
      const announcer = document.getElementById("announce");
      if (announcer) {
        announcer.textContent = message;
        setTimeout(() => {
          announcer.textContent = "";
        }, 2000); // Clear announce region after 2 seconds
      }
    },
    showFiles: function (files) {
      const label = document.querySelector("#dropzone label");
      const fileName =
        files.length > 1
          ? document
              .querySelector('input[type="file"]')
              .getAttribute("data-multiple-caption")
              .replace("{count}", files.length)
          : files[0].name;
      label.textContent = fileName;
    },
    toggleButtonDisplay: function (display = "none") {
      const button = document.querySelector('#dropzone button[type="submit"]');
      button.style.display = display;
    },
    updateDragState: function (isDragging) {
      const form = document.querySelector("#dropzone");
      form.classList.toggle("is-dragover", isDragging);
    },
    clearReport: function () {
      document.getElementById("report").textContent = "";
      results = [];
      currentFile = "";
      this.toggleExportButton(false);
    },
    toggleExportButton: function (show) {
      const button = document.getElementById("export-csv");
      if (button) {
        button.hidden = !show;
      }
    },
    addFlag: function (className, content, isHTML = false) {
      const tempNode = document.createElement("p");
      tempNode.className = "flag";
      tempNode.dataset.status = className;

      if (isHTML) {
        // Parse the HTML string safely
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        while (doc.body.firstChild) {
          tempNode.appendChild(doc.body.firstChild);
        }
      } else {
        tempNode.textContent = content;
      }

      results.push({
        file: "",
        check: "File",
        result: content,
        status: className,
      });
      document.getElementById("report").appendChild(tempNode);
    },
    addLabeledFlag: function (className, labelText, valueText) {
      const tempNode = document.createElement("p");
      tempNode.className = "flag";
      tempNode.dataset.status = className;

      const strong = document.createElement("strong");
      strong.textContent = labelText;
      tempNode.appendChild(strong);

      tempNode.appendChild(document.createTextNode(" "));

      const span = document.createElement("span");
      span.textContent = valueText;
      tempNode.appendChild(span);

      results.push({
        file: currentFile,
        check: labelText,
        result: valueText,
        status: className,
      });
      document.querySelectorAll(".example-result").forEach((el) => el.remove());
      document.getElementById("report").appendChild(tempNode);
    },
  };

  // Core functionalities
  const fileOps = {
    processStart: function (e) {
      ui.showFiles(e.target.files);
    },
    submitStart: function (e) {
      e.preventDefault();
      this.processFiles(
        e.target.form.querySelector('input[type="file"]').files,
      );
    },
    fileDrop: function (e) {
      e.preventDefault();
      const droppedFiles = e.dataTransfer.files;
      ui.toggleButtonDisplay("none");
      ui.showFiles(droppedFiles);
      this.processFiles(droppedFiles);
    },
    processFiles: function (files) {
      ui.clearReport();

      // Filter for PDF files only
      const pdfFiles = Array.from(files).filter((file) => {
        const isPDF =
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf");

        if (!isPDF) {
          ui.addFlag("failure", `${file.name} is not a PDF file.`);
        }
        return isPDF;
      });

      if (pdfFiles.length > 0) {
        const fileCount = pdfFiles.length;
        const pluralFiles = fileCount === 1 ? "file" : "files";
        ui.announceStatus(`Running checks on ${fileCount} ${pluralFiles}`);
        this.readMultiFiles(pdfFiles);
      }
    },
    readFileAsync: function (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          // Convert ArrayBuffer to binary string for text-based parsing
          const arrayBuffer = e.target.result;
          const bytes = new Uint8Array(arrayBuffer);
          const binaryString = Array.from(bytes)
            .map((byte) => String.fromCharCode(byte))
            .join("");
          resolve(binaryString);
        };

        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`));
        };

        reader.readAsArrayBuffer(file);
      });
    },

    readMultiFiles: async function (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Double-check file type before reading
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          ui.addFlag("failure", `${file.name} is not a PDF file.`);
          continue;
        }

        try {
          const fileData = await this.readFileAsync(file);
          this.runCheck(file, fileData, i + 1);
          ui.announceStatus(
            `Completed checking files. Read forward for results.`,
          );
        } catch (error) {
          console.error("File read error:", error);
          ui.addFlag("failure", `Error reading file: ${file.name}`);
          ui.announceStatus(`Error reading files. Read forward for details.`);
        }
      }

      ui.toggleExportButton(results.length > 0);
    },
    runCheck: function (file, fileData, fileNumber) {
      let valid;
      let tagged = false;

      try {
        buildHeading(file, fileNumber);
        valid = validatePDF(fileData);

        if (valid === true) {
          try {
            findCreatorTool(fileData);
          } catch (error) {
            console.error("Error finding creator tool:", error);
          }

          try {
            findProducer(fileData);
          } catch (error) {
            console.error("Error finding producer:", error);
          }

          try {
            findTitle(fileData);
          } catch (error) {
            console.error("Error finding title:", error);
          }

          try {
            findDisplayDocTitle(fileData);
          } catch (error) {
            console.error("Error finding display doc title:", error);
          }

          try {
            tagged = findTags(fileData);
          } catch (error) {
            console.error("Error finding tags:", error);
          }

          try {
            findLang(fileData);
          } catch (error) {
            console.error("Error finding language:", error);
          }

          try {
            findMark(fileData);
          } catch (error) {
            console.error("Error finding mark:", error);
          }

          try {
            findSuspects(fileData);
          } catch (error) {
            console.error("Error finding suspects:", error);
          }

          try {
            findUA(fileData);
          } catch (error) {
            console.error("Error finding UA:", error);
          }

          try {
            findBookmarks(fileData);
          } catch (error) {
            console.error("Error finding bookmarks:", error);
          }

          if (tagged) {
            try {
              findStructure(fileData);
            } catch (error) {
              console.error("Error finding structure:", error);
            }
          }

          try {
            findFormFields(fileData);
          } catch (error) {
            console.error("Error finding form fields:", error);
          }
        }
      } catch (error) {
        console.error("Error during PDF validation:", error);
        ui.addFlag("failure", `Error validating PDF: ${file.name}`);
      }
    },
  };

  // Event listeners setup
  function setupEventListeners() {
    const form = document.querySelector("#dropzone");
    const input = form.querySelector('input[type="file"]');
    const button = form.querySelector('button[type="submit"]');

    input.addEventListener("change", fileOps.processStart);
    button.addEventListener("click", fileOps.submitStart.bind(fileOps));

    if (isAdvancedUpload()) {
      ["dragover", "dragenter"].forEach((event) => {
        form.addEventListener(
          event,
          (e) => {
            e.preventDefault();
            ui.updateDragState(true);
          },
          false,
        );
      });

      ["dragleave", "dragend", "drop"].forEach((event) => {
        form.addEventListener(
          event,
          (e) => {
            e.preventDefault();
            ui.updateDragState(false);
          },
          false,
        );
      });

      form.addEventListener("drop", fileOps.fileDrop.bind(fileOps));
    }

    // Firefox focus bug fix for file input
    input.addEventListener("focus", () => input.classList.add("has-focus"));
    input.addEventListener("blur", () => input.classList.remove("has-focus"));

    const exportButton = document.getElementById("export-csv");
    if (exportButton) {
      exportButton.addEventListener("click", exportResults);
    }
  }

  // Build a CSV of every result and download it
  function exportResults() {
    const rows = [["File", "Check", "Result", "Status"]].concat(
      results.map((entry) => [
        entry.file,
        entry.check,
        entry.result,
        entry.status,
      ]),
    );
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    // Leading byte order mark so spreadsheets read accented characters correctly
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pdfcheck-results.csv";
    link.click();
    URL.revokeObjectURL(url);
    ui.announceStatus("Downloaded results as CSV");
  }

  // Quote a CSV cell. A value that starts with a formula character gets a
  // leading apostrophe so a spreadsheet shows it as text instead of running it.
  function csvCell(value) {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return `"${text.replace(/"/g, '""')}"`;
  }

  // Utility function to check for advanced upload features
  function isAdvancedUpload() {
    const div = document.createElement("div");
    return (
      ("draggable" in div || ("ondragstart" in div && "ondrop" in div)) &&
      "FormData" in window &&
      "FileReader" in window
    );
  }

  // Initial setup call
  setupEventListeners();

  // Check if valid PDF file (read first 8 bytes, match regex)
  function validatePDF(fileData) {
    // Match PDF version from PDF-1.0 through PDF-3.9
    const regexHeader = /%PDF-(1\.[0-9]|2\.[0-9]|3\.[0-9])/;
    const dataHeader = fileData.substr(0, 8);
    const matchHeader = regexHeader.exec(dataHeader);

    if (!matchHeader) {
      ui.addLabeledFlag("default", "", "Not a valid PDF file");
      return false;
    }

    // The catalog can raise the version above the header value
    const regexVersion = /\/Version\s*\/(\d\.\d)/;
    const matchVersion = regexVersion.exec(fileData);
    let version = matchHeader[1];
    if (matchVersion && parseFloat(matchVersion[1]) > parseFloat(version)) {
      version = matchVersion[1];
    }

    // PDF/UA-1 requires PDF 1.7 or later
    const meetsPDFUA = parseFloat(version) >= 1.7;
    ui.addLabeledFlag(
      meetsPDFUA ? "default" : "warning",
      "PDF Version",
      meetsPDFUA ? version : `${version} (PDF/UA requires 1.7 or later)`,
    );
    return true;
  }

  // Check if StructTreeRoot is set
  function findTags(fileData) {
    const regexTree = /\/StructTreeRoot\s+\d+\s+\d+\s+R/;

    if (regexTree.test(fileData)) {
      ui.addLabeledFlag("success", "Tagged", "Yes");
      return true;
    }
    ui.addLabeledFlag("failure", "Tagged", "No");
    return false;
  }

  // Check if Lang is set, display value if set
  function findLang(fileData) {
    const regexLang = /Lang(?:<|\()(.*?)(?:>|\))/;
    const matchLang = regexLang.exec(fileData);
    if (matchLang && matchLang[1]) {
      let languageCode = matchLang[1];

      // Check and decode hex string format for language code
      if (/^[\da-fA-F]+$/.test(languageCode)) {
        languageCode = decodeHex(languageCode);
      }

      ui.addLabeledFlag("success", "Language", languageCode);
    } else {
      ui.addLabeledFlag("failure", "Language", "not set");
    }
  }

  // Helper function to count regex matches in the file data
  function countMatches(fileData, regex) {
    return (fileData.match(regex) || []).length;
  }

  // Helper function to format a count with a singular or plural noun
  function pluralize(count, noun) {
    return `${count} ${noun}${count === 1 ? "" : "s"}`;
  }

  // Helper function to decode hex string to ASCII
  function decodeHex(hexString) {
    const hexCodePairs = hexString.match(/.{1,2}/g);
    return hexCodePairs
      .map((pair) => String.fromCharCode(parseInt(pair, 16)))
      .join("");
  }

  // Check MarkInfo exists and whether true or false
  function findMark(fileData) {
    const regexMarked = /\/Marked\s+(true|false)/;
    const matchMarked = regexMarked.exec(fileData);
    if (matchMarked) {
      const isMarked = matchMarked[1] === "true";
      ui.addLabeledFlag(
        isMarked ? "success" : "warning",
        "Marked",
        isMarked ? "True" : "False",
      );
    } else {
      ui.addLabeledFlag("failure", "Marked", "No");
    }
  }

  // Check for Suspects flag in MarkInfo, shown only when true
  function findSuspects(fileData) {
    const regexSuspects = /\/Suspects\s+true/;
    if (regexSuspects.test(fileData)) {
      ui.addLabeledFlag("warning", "Suspects", "True");
    }
  }

  // Check for PDF/UA identifier
  function findUA(fileData) {
    const regexPDFUA = /<pdfaSchema:prefix>pdfuaid<\/pdfaSchema:prefix>/;
    const matchPDFUA = regexPDFUA.exec(fileData);
    if (matchPDFUA) {
      ui.addLabeledFlag("success", "PDF/UA identifier", "Yes");
    } else {
      ui.addLabeledFlag("warning", "PDF/UA identifier", "Not set");
    }
  }

  // Check whether structure elements are readable as plain text. Many
  // producers store the tag tree in compressed object streams, which the
  // regex checks can't see into.
  function canInspectStructure(fileData) {
    const regexStructure =
      /\/S\s*\/(Document|Part|Art|Sect|Div|P|H[1-6]|L|LI|Table|Figure|Span)\b/;
    return regexStructure.test(fileData);
  }

  // Run the structure checks when the tag tree is readable
  function findStructure(fileData) {
    if (!canInspectStructure(fileData)) {
      ui.addLabeledFlag(
        "default",
        "Structure",
        "Could not inspect (compressed structure tree)",
      );
      return;
    }

    [findHeadings, findLists, findTables, findFigures].forEach((check) => {
      try {
        check(fileData);
      } catch (error) {
        console.error(`Error in ${check.name}:`, error);
      }
    });
  }

  // Count heading tags by level and flag a missing H1
  function findHeadings(fileData) {
    const counts = [];
    for (let level = 1; level <= 6; level++) {
      const regexLevel = new RegExp(`\\/S\\s*\\/H${level}\\b`, "g");
      const count = countMatches(fileData, regexLevel);
      if (count > 0) {
        counts.push(`H${level}: ${count}`);
      }
    }

    if (counts.length === 0) {
      ui.addLabeledFlag("warning", "Headings", "None found");
      return;
    }

    const hasH1 = counts[0].startsWith("H1:");
    ui.addLabeledFlag(
      hasH1 ? "success" : "warning",
      "Headings",
      hasH1 ? counts.join(", ") : `No H1 (${counts.join(", ")})`,
    );
  }

  // Count list tags and their items, shown only when a list exists
  function findLists(fileData) {
    const listCount = countMatches(fileData, /\/S\s*\/L\b/g);
    if (listCount === 0) {
      return;
    }

    const itemCount = countMatches(fileData, /\/S\s*\/LI\b/g);
    ui.addLabeledFlag(
      "success",
      "Lists",
      `${pluralize(listCount, "list")}, ${pluralize(itemCount, "item")}`,
    );
  }

  // Count table tags and flag tables without header cells
  function findTables(fileData) {
    const tableCount = countMatches(fileData, /\/S\s*\/Table\b/g);
    if (tableCount === 0) {
      return;
    }

    const headerCount = countMatches(fileData, /\/S\s*\/TH\b/g);
    const headerText =
      headerCount > 0
        ? pluralize(headerCount, "header cell")
        : "no header cells";
    ui.addLabeledFlag(
      headerCount > 0 ? "success" : "warning",
      "Tables",
      `${pluralize(tableCount, "table")}, ${headerText}`,
    );
  }

  // Count figure tags and compare with alt text entries
  function findFigures(fileData) {
    const figureCount = countMatches(fileData, /\/S\s*\/Figure\b/g);
    if (figureCount === 0) {
      return;
    }

    const altCount = countMatches(fileData, /\/Alt\s*[(<]/g);
    const altText = `${altCount} alt text ${altCount === 1 ? "entry" : "entries"}`;
    ui.addLabeledFlag(
      altCount >= figureCount ? "success" : "warning",
      "Figures",
      `${pluralize(figureCount, "figure")}, ${altText}`,
    );
  }

  // Check for an outline (bookmarks) reference in the catalog
  function findBookmarks(fileData) {
    const regexOutlines = /\/Outlines\s+\d+\s+\d+\s+R/;
    if (regexOutlines.test(fileData)) {
      ui.addLabeledFlag("success", "Bookmarks", "Present");
    } else {
      ui.addLabeledFlag("default", "Bookmarks", "Not found");
    }
  }

  // Check form fields for descriptions (TU, the tooltip screen readers announce)
  function findFormFields(fileData) {
    if (!/\/AcroForm/.test(fileData)) {
      return;
    }

    const fieldCount = countMatches(fileData, /\/FT\s*\/(Tx|Btn|Ch|Sig)\b/g);
    const descriptionCount = countMatches(fileData, /\/TU\s*[(<]/g);

    if (fieldCount === 0) {
      ui.addLabeledFlag(
        "default",
        "Form Fields",
        "Form present (fields could not be inspected)",
      );
      return;
    }

    ui.addLabeledFlag(
      descriptionCount >= fieldCount ? "success" : "warning",
      "Form Fields",
      `${pluralize(fieldCount, "field")}, ${descriptionCount} with descriptions`,
    );
  }

  // Check for DisplayDocTitle and dc:title
  function findTitle(fileData) {
    const regexTitle =
      /<dc:title>[\s\S]*?<rdf:Alt>([\s\S]*?)<\/rdf:Alt>[\s\S]*?<\/dc:title>/;
    const matchTitle = regexTitle.exec(fileData);
    if (matchTitle && matchTitle[1].trim()) {
      // Check if it's an empty self-closing tag
      const isEmptyTag = /<rdf:li xml:lang="x-default"\/>/.test(matchTitle[1]);

      if (!isEmptyTag) {
        // Extract the actual title text from within the rdf:li tags
        const titleRegex = /<rdf:li[^>]*>([^<]*)<\/rdf:li>/;
        const titleMatch = titleRegex.exec(matchTitle[1]);
        const titleText = titleMatch
          ? titleMatch[1].trim()
          : matchTitle[1].trim();
        ui.addLabeledFlag("default", "Document Title", titleText);
      } else {
        ui.addLabeledFlag("warning", "Document Title", "Empty");
      }
    } else {
      ui.addLabeledFlag("failure", "Document Title", "Not set");
    }
  }

  // Check for DisplayDocTitle in ViewerPreferences
  function findDisplayDocTitle(fileData) {
    // Check for ViewerPreferences with DisplayDocTitle setting
    const regexDisplayTitle =
      /\/ViewerPreferences[^>]*\/DisplayDocTitle\s+(true|false)/;
    const matchDisplayTitle = regexDisplayTitle.exec(fileData);

    if (matchDisplayTitle) {
      const isEnabled = matchDisplayTitle[1] === "true";
      ui.addLabeledFlag(
        isEnabled ? "success" : "warning",
        "Display Document Title",
        isEnabled ? "Enabled" : "Disabled",
      );
    } else {
      // Also check for alternative format
      const regexAltFormat = /\/DisplayDocTitle\s+(true|false)/;
      const matchAltFormat = regexAltFormat.exec(fileData);

      if (matchAltFormat) {
        const isEnabled = matchAltFormat[1] === "true";
        ui.addLabeledFlag(
          isEnabled ? "success" : "warning",
          "Display Document Title",
          isEnabled ? "Enabled" : "Disabled",
        );
      } else {
        ui.addLabeledFlag(
          "warning",
          "Display Document Title",
          "Not configured",
        );
      }
    }
  }

  // Check for xmp:CreatorTool
  function findCreatorTool(fileData) {
    const regexTitle = /<xmp:CreatorTool>([\s\S]*?)<\/xmp:CreatorTool>/;
    const matchTitle = regexTitle.exec(fileData);
    if (matchTitle && matchTitle[1].trim()) {
      ui.addLabeledFlag("default", "Creator Tool", matchTitle[1].trim());
    } else {
      ui.addLabeledFlag("warning", "Creator Tool", "Not set");
    }
  }

  // Check for pdf:Producer
  function findProducer(fileData) {
    const regexTitle = /<pdf:Producer>([\s\S]*?)<\/pdf:Producer>/;
    const matchTitle = regexTitle.exec(fileData);
    if (matchTitle && matchTitle[1].trim()) {
      ui.addLabeledFlag("default", "Producer", matchTitle[1].trim());
    } else {
      ui.addLabeledFlag("warning", "Producer", "Not set");
    }
  }

  // Build file heading - ex: 1. document.pdf [PDF - 236 KB]
  function buildHeading(file, fileNumber) {
    currentFile = file.name;
    const fileExt = file.name.split(".").pop().toUpperCase();
    let fileSize = file.size / 1024; // KB as default unit
    let fileSizeSuffix = "KB";

    if (fileSize > 1024) {
      fileSize = fileSize / 1024; // Convert KB to MB
      fileSizeSuffix = "MB";
    }

    fileSize =
      fileSizeSuffix === "MB" ? fileSize.toFixed(1) : Math.ceil(fileSize);

    const fileLabel = `[${fileExt} - ${fileSize}${fileSizeSuffix}]`;

    // Create the heading safely
    const tempNode = document.createElement("h3");
    tempNode.appendChild(
      document.createTextNode(`${fileNumber}. ${file.name} `),
    );

    const small = document.createElement("small");
    small.textContent = fileLabel;
    tempNode.appendChild(small);

    document.getElementById("report").appendChild(tempNode);
  }
})();
