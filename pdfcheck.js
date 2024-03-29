(function pdfCheck() {
  // Utility functions for UI updates and event handling
  const ui = {
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
    addFlag: function (className, markup) {
      const tempNode = document.createElement("p");
      tempNode.className = `flag ${className}`;
      tempNode.innerHTML = markup;
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
      this.readMultiFiles(files);
    },
    readMultiFiles: function (files) {
      const reader = new FileReader();

      const readFile = (index) => {
        if (index >= files.length) return;
        const file = files[index];

        reader.onload = (e) => {
          this.runCheck(file, e.target.result, index + 1);
          readFile(index + 1);
        };
        reader.readAsText(file);
      };
      readFile(0);
    },
    runCheck: function (file, fileData, fileNumber) {
      let valid;

      buildHeading(file, fileNumber);
      valid = validatePDF(fileData);

      if (valid === true) {
        findCreatorTool(fileData);
        findProducer(fileData);
        findTitle(fileData);
        findTags(fileData);
        findLang(fileData);
        findMark(fileData);
        findUA(fileData);
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
      const markup = "<strong>Not a valid PDF file</strong>";
      ui.addFlag("default", markup);
      return false;
    }
    const markup = `<span>PDF Version:</span> <strong>${matchHeader[1]}</strong>`;
    ui.addFlag("default", markup);
    return true;
  }

  // Check if StructTreeRoot is set and count tags
  function findTags(fileData) {
    const regexTree = /StructTreeRoot\s(\d*)\s(\d*)/;
    const matchTree = regexTree.exec(fileData);
    let markup;

    if (matchTree) {
      markup = `<span><a href="#help-tagged">Tagged</a></span> <strong>Yes (${matchTree[1]} tags)</strong>`;
      ui.addFlag("success", markup);
    } else {
      markup =
        '<span><a href="#help-tagged">Tagged</a></span> <strong>No</strong>';
      ui.addFlag("failure", markup);
    }
  }

  // Check if Lang is set, display value if set
  function findLang(fileData) {
    const regexLang = /Lang(?:<|\()(.*?)(?:>|\))/;
    const matchLang = regexLang.exec(fileData);

    let markup;
    if (matchLang && matchLang[1]) {
      let languageCode = matchLang[1];

      // Check and decode hex string format for language code
      if (/^[\da-fA-F]+$/.test(languageCode)) {
        languageCode = decodeHex(languageCode);
      }

      markup = `<span><a href="#help-language">Language</a></span> <strong>${languageCode}</strong>`;
      ui.addFlag("success", markup);
    } else {
      markup =
        '<span><a href="#help-language">Language</a></span> <strong>not set</strong>';
      ui.addFlag("failure", markup);
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

    let markup;
    if (matchMarked) {
      const isMarked = matchMarked[1] === "true";
      markup = `<span><a href="#help-marked">Marked</a></span> <strong>${isMarked ? "True" : "False"}</strong>`;
      ui.addFlag(isMarked ? "success" : "warning", markup);
    } else {
      markup =
        '<span><a href="#help-marked">Marked</a></span> <strong>No</strong>';
      ui.addFlag("failure", markup);
    }
  }

  // Check for PDF/UA identifier
  function findUA(fileData) {
    const regexPDFUA = /<pdfaSchema:prefix>pdfuaid<\/pdfaSchema:prefix>/;
    const matchPDFUA = regexPDFUA.exec(fileData);

    let markup;
    if (matchPDFUA) {
      markup = `<span><a href="#help-pdfua">PDF/UA identifier</a></span> <strong>Yes</strong>`;
      ui.addFlag("success", markup);
    } else {
      markup = `<span><a href="#help-pdfua">PDF/UA identifier</a></span> <strong>Not set</strong>`;
      ui.addFlag("warning", markup);
    }
  }

  // Check for DisplayDocTitle and dc:title
  function findTitle(fileData) {
    const regexTitle =
      /<dc:title>[\s\S]*?<rdf:Alt>([\s\S]*?)<\/rdf:Alt>[\s\S]*?<\/dc:title>/;
    const matchTitle = regexTitle.exec(fileData);

    let markup;
    if (matchTitle && matchTitle[1].trim()) {
      const isNotEmptyTag = !/<rdf:li xml:lang="x-default"\/>/.test(
        matchTitle[1],
      );
      markup = `<span><a href="#help-title"">Document Title</a></span> <strong>${isNotEmptyTag ? matchTitle[1].trim() : "Empty"}</strong>`;
      ui.addFlag(isNotEmptyTag ? "default" : "warning", markup);
    } else {
      markup =
        '<span><a href="#help-title"">Document Title</a></span> <strong>Not set</strong>';
      ui.addFlag("failure", markup);
    }
  }

  // Check for xmp:CreatorTool
  function findCreatorTool(fileData) {
    const regexTitle =
      /<xmp:CreatorTool>([\s\S]*?)<\/xmp:CreatorTool>/;
    const matchTitle = regexTitle.exec(fileData);

    let markup;
    if (matchTitle && matchTitle[1].trim()) {
      markup = `<span>Creator Tool</span> <strong>${matchTitle[1].trim()}</strong>`;
      ui.addFlag("default", markup);
    } else {
      markup =
        '<span>Creator Tool</span> <strong>Not set</strong>';
      ui.addFlag("warning", markup);
    }
  }

    // Check for pdf:Producer
    function findProducer(fileData) {
      const regexTitle =
        /<pdf:Producer>([\s\S]*?)<\/pdf:Producer>/;
      const matchTitle = regexTitle.exec(fileData);

      let markup;
      if (matchTitle && matchTitle[1].trim()) {
        markup = `<span>Producer</span> <strong>${matchTitle[1].trim()}</strong>`;
        ui.addFlag("default", markup);
      } else {
        markup =
          '<span>Producer</span> <strong>Not set</strong>';
        ui.addFlag("warning", markup);
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
    const markup = `${fileNumber}. ${file.name} <small>${fileLabel}</small>`;
    ui.addFlag("title", markup);
  }
})();
