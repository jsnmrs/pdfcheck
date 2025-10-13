(function pdfCheck() {
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
    },
    addFlag: function (className, content, isHTML = false) {
      const tempNode = document.createElement("p");
      tempNode.className = `flag ${className}`;

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

      document.getElementById("report").appendChild(tempNode);
    },
    addFlagWithLink: function (
      className,
      labelText,
      linkHref,
      linkText,
      valueText,
    ) {
      const tempNode = document.createElement("p");
      tempNode.className = `flag ${className}`;

      const span = document.createElement("span");
      if (linkHref) {
        const link = document.createElement("a");
        link.href = linkHref;
        link.textContent = linkText;

        span.appendChild(link);
      } else {
        span.textContent = labelText;
      }
      tempNode.appendChild(span);

      tempNode.appendChild(document.createTextNode(" "));

      const strong = document.createElement("strong");
      strong.textContent = valueText;
      tempNode.appendChild(strong);

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
          ui.addFlag(
            "failure",
            `<strong>Not a PDF file: ${file.name}</strong>`,
          );
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
          ui.addFlag(
            "failure",
            `<strong>Skipping non-PDF: ${file.name}</strong>`,
          );
          continue;
        }

        try {
          const fileData = await this.readFileAsync(file);
          this.runCheck(file, fileData, i + 1);
          ui.announceStatus(`Completed checking ${file.name}`);
        } catch (error) {
          console.error("File read error:", error);
          ui.addFlag("failure", `Error reading file: ${file.name}`);
          ui.announceStatus(`Error reading file: ${file.name}`);
        }
      }
    },
    runCheck: function (file, fileData, fileNumber) {
      let valid;

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
            findTags(fileData);
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
            findUA(fileData);
          } catch (error) {
            console.error("Error finding UA:", error);
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
      ui.addFlagWithLink("default", "", null, "", "Not a valid PDF file");
      return false;
    }
    ui.addFlagWithLink(
      "default",
      "PDF Version:",
      null,
      "PDF Version:",
      matchHeader[1],
    );
    return true;
  }

  // Check if StructTreeRoot is set and count tags
  function findTags(fileData) {
    const regexTree = /StructTreeRoot\s(\d*)\s(\d*)/;
    const matchTree = regexTree.exec(fileData);

    if (matchTree) {
      ui.addFlagWithLink(
        "success",
        "Tagged",
        "#help-tagged",
        "Tagged",
        `Yes (${matchTree[1]} tags)`,
      );
    } else {
      ui.addFlagWithLink("failure", "Tagged", "#help-tagged", "Tagged", "No");
    }
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

      ui.addFlagWithLink(
        "success",
        "Language",
        "#help-language",
        "Language",
        languageCode,
      );
    } else {
      ui.addFlagWithLink(
        "failure",
        "Language",
        "#help-language",
        "Language",
        "not set",
      );
    }
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
    const regexMarked = /<<\/Marked (true|false)/;
    const matchMarked = regexMarked.exec(fileData);
    if (matchMarked) {
      const isMarked = matchMarked[1] === "true";
      ui.addFlagWithLink(
        isMarked ? "success" : "warning",
        "Marked",
        "#help-marked",
        "Marked",
        isMarked ? "True" : "False",
      );
    } else {
      ui.addFlagWithLink("failure", "Marked", "#help-marked", "Marked", "No");
    }
  }

  // Check for PDF/UA identifier
  function findUA(fileData) {
    const regexPDFUA = /<pdfaSchema:prefix>pdfuaid<\/pdfaSchema:prefix>/;
    const matchPDFUA = regexPDFUA.exec(fileData);
    if (matchPDFUA) {
      ui.addFlagWithLink(
        "success",
        "PDF/UA identifier",
        "#help-pdfua",
        "PDF/UA identifier",
        "Yes",
      );
    } else {
      ui.addFlagWithLink(
        "warning",
        "PDF/UA identifier",
        "#help-pdfua",
        "PDF/UA identifier",
        "Not set",
      );
    }
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
        ui.addFlagWithLink(
          "default",
          "Document Title",
          "#help-title",
          "Document Title",
          titleText,
        );
      } else {
        ui.addFlagWithLink(
          "warning",
          "Document Title",
          "#help-title",
          "Document Title",
          "Empty",
        );
      }
    } else {
      ui.addFlagWithLink(
        "failure",
        "Document Title",
        "#help-title",
        "Document Title",
        "Not set",
      );
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
      ui.addFlagWithLink(
        isEnabled ? "success" : "warning",
        "Display Document Title",
        "#help-display-title",
        "Display Document Title",
        isEnabled ? "Enabled" : "Disabled",
      );
    } else {
      // Also check for alternative format
      const regexAltFormat = /\/DisplayDocTitle\s+(true|false)/;
      const matchAltFormat = regexAltFormat.exec(fileData);

      if (matchAltFormat) {
        const isEnabled = matchAltFormat[1] === "true";
        ui.addFlagWithLink(
          isEnabled ? "success" : "warning",
          "Display Document Title",
          "#help-display-title",
          "Display Document Title",
          isEnabled ? "Enabled" : "Disabled",
        );
      } else {
        ui.addFlagWithLink(
          "warning",
          "Display Document Title",
          "#help-display-title",
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
      ui.addFlagWithLink(
        "default",
        "Creator Tool",
        null,
        "Creator Tool",
        matchTitle[1].trim(),
      );
    } else {
      ui.addFlagWithLink(
        "warning",
        "Creator Tool",
        null,
        "Creator Tool",
        "Not set",
      );
    }
  }

  // Check for pdf:Producer
  function findProducer(fileData) {
    const regexTitle = /<pdf:Producer>([\s\S]*?)<\/pdf:Producer>/;
    const matchTitle = regexTitle.exec(fileData);
    if (matchTitle && matchTitle[1].trim()) {
      ui.addFlagWithLink(
        "default",
        "Producer",
        null,
        "Producer",
        matchTitle[1].trim(),
      );
    } else {
      ui.addFlagWithLink("warning", "Producer", null, "Producer", "Not set");
    }
  }

  // Build file heading - ex: 1. document.pdf [PDF - 236 KB]
  function buildHeading(file, fileNumber) {
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
    const tempNode = document.createElement("p");
    tempNode.className = "flag title";
    tempNode.appendChild(
      document.createTextNode(`${fileNumber}. ${file.name} `),
    );

    const small = document.createElement("small");
    small.textContent = fileLabel;
    tempNode.appendChild(small);

    document.getElementById("report").appendChild(tempNode);
  }
})();
