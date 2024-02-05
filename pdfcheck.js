(function pdfCheck() {
  // Utility functions for UI updates and event handling
  const ui = {
    showFiles: function(files) {
      const label = document.querySelector("#dropzone label");
      const fileName = files.length > 1
        ? document.querySelector('input[type="file"]').getAttribute("data-multiple-caption").replace("{count}", files.length)
        : files[0].name;
      label.textContent = fileName;
    },
    toggleButtonDisplay: function(display = 'none') {
      const button = document.querySelector('#dropzone button[type="submit"]');
      button.style.display = display;
    },
    updateDragState: function(isDragging) {
      const form = document.querySelector("#dropzone");
      form.classList.toggle("is-dragover", isDragging);
    },
    clearReport: function() {
      document.getElementById("report").textContent = "";
    },
    addFlag: function(className, markup) {
      const tempNode = document.createElement("p");
      tempNode.className = `flag ${className}`;
      tempNode.innerHTML = markup;
      document.getElementById("report").appendChild(tempNode);
    }
  };

  // Core functionalities
  const fileOps = {
    processStart: function(e) {
      ui.showFiles(e.target.files);
    },
    submitStart: function(e) {
      e.preventDefault();
      this.processFiles(e.target.form.querySelector('input[type="file"]').files);
    },
    fileDrop: function(e) {
      e.preventDefault();
      const droppedFiles = e.dataTransfer.files;
      ui.toggleButtonDisplay("none");
      ui.showFiles(droppedFiles);
      this.processFiles(droppedFiles);
    },
    processFiles: function(files) {
      ui.clearReport();
      this.readMultiFiles(files);
    },
    readMultiFiles: function(files) {
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
    runCheck: function(file, fileData, fileNumber) {
      // Placeholder for actual check functions
      // Example: validatePDF(fileData), findTags(fileData), etc.
      var valid;

      buildHeading(file, fileNumber);
      valid = validatePDF(fileData);

      if (valid === true) {
        findTitle(fileData);
        findTags(fileData);
        findLang(fileData);
        findMark(fileData);
        findUA(fileData);
      }
    }
  };

  // Event listeners setup
  function setupEventListeners() {
    const form = document.querySelector("#dropzone");
    const input = form.querySelector('input[type="file"]');
    const button = form.querySelector('button[type="submit"]');

    input.addEventListener("change", fileOps.processStart);
    button.addEventListener("click", fileOps.submitStart.bind(fileOps));

    if (isAdvancedUpload()) {
      ["dragover", "dragenter"].forEach(event => {
        form.addEventListener(event, (e) => {
          e.preventDefault();
          ui.updateDragState(true);
        }, false);
      });

      ["dragleave", "dragend", "drop"].forEach(event => {
        form.addEventListener(event, (e) => {
          e.preventDefault();
          ui.updateDragState(false);
        }, false);
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
    return (("draggable" in div) || ("ondragstart" in div && "ondrop" in div)) &&
            "FormData" in window && "FileReader" in window;
  }

  // Initial setup call
  setupEventListeners();

  // Check if valid PDF file (read first 8 bytes, match regex)
  function validatePDF(fileData) {

    // Match PDF version from PDF-1.0 through PDF-3.9
    const regexHeader = /%PDF-(1\.[0-9]|2\.[0-9]|3\.[0-9])/;
    const dataHeader = fileData.substr(0, 8);
    const matchHeader = regexHeader.exec(dataHeader);

    // If no match is found, report the file as invalid
    if (!matchHeader) {
      const markup = "<strong>Not a valid PDF file</strong>";
      ui.addFlag("default", markup);
      return false;
    }
    // If a match is found, report the PDF version number
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
      // If a match is found, indicate that the document is tagged and show the number of tags
      markup = `<span>Tagged <a href="#help-tagged" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>Yes (${matchTree[1]} tags)</strong>`;
      ui.addFlag("success", markup);
    } else {
      // If no match is found, indicate that the document is not tagged
      markup = '<span>Tagged <a href="#help-tagged" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>No</strong>';
      ui.addFlag("failure", markup);
    }
  }

  // Check if Lang is set, display value if set
  function findLang(fileData) {
    var markup,
      regexLang = /Lang((<|\()\S*(>|\)))/g,
      matchLang = regexLang.exec(fileData);

    if (matchLang) {
      // Handle hex encoding
      if (matchLang[1] === "<656E2D5553>") {
        matchLang[1] = "(en-US)";
      }
      markup =
        '<span>Language <a href="#help-language" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>' +
        matchLang[1] +
        "</strong>";
      ui.addFlag("success", markup);
    } else {
      markup =
        '<span>Language <a href="#help-language" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>not set</strong>';
      ui.addFlag("failure", markup);
    }
  }

  // Check MarkInfo exists and whether true or false
  function findMark(fileData) {
    var markup,
      regexMarked = /<<\/Marked (true|false)/g,
      matchMarked = regexMarked.exec(fileData);

    if (matchMarked) {
      if (matchMarked[1] === "true") {
        markup =
          '<span>Marked <a href="#help-marked" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>True</strong>';
        ui.addFlag("success", markup);
      } else {
        markup =
          '<span>Marked <a href="#help-marked" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>False</strong>';
        ui.addFlag("warning", markup);
      }
    } else {
      markup =
        '<span>Marked <a href="#help-marked" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>No</strong>';
      ui.addFlag("failure", markup);
    }
  }

  // Check for PDF/UA identifier
  function findUA(fileData) {
    var markup,
      regexPDFUA = /<pdfaSchema:prefix>pdfuaid<\/pdfaSchema:prefix>/g,
      matchPDFUA = regexPDFUA.exec(fileData);

    if (matchPDFUA) {
      markup =
        '<span>PDF/UA identifier <a href="#help-pdfua" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>Yes</strong>';
      ui.addFlag("success", markup);
    } else {
      markup =
        '<span>PDF/UA identifier <a href="#help-pdfua" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>Not set</strong>';
      ui.addFlag("warning", markup);
    }
  }

  // Check for DisplayDocTitle and dc:title
  function findTitle(fileData) {
    var markup,
      regexTitle =
        /<dc:title>[\s\S]*?<rdf:Alt>([\s\S]*?)<\/rdf:Alt>[\s\S]*?<\/dc:title>/g,
      matchTitle = regexTitle.exec(fileData),
      emptyTag = /<rdf:li xml:lang="x-default"\/>/g,
      matchEmpty = emptyTag.exec(matchTitle);

    if (matchTitle) {
      if (matchEmpty) {
        markup =
          '<span>Document Title <a href="#help-title" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>Empty</strong>';
        ui.addFlag("warning", markup);
      } else {
        markup =
          '<span>Document Title <a href="#help-title" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>' +
          matchTitle[1] +
          "</strong>";
        ui.addFlag("default", markup);
      }
    } else {
      markup =
        '<span>Document Title <a href="#help-title" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>Not set</strong>';
      ui.addFlag("failure", markup);
    }
  }

  // Build file heading - ex: 1. document.pdf [PDF - 236 KB]
  function buildHeading(file, fileNumber) {
    var fileLabel,
      markup,
      fileExt = file.name.split(".").pop().toUpperCase(),
      fileSize = file.size / 1024 / 1024,
      fileSizeSuffix = " MB";

    fileSize = Number(fileSize.toFixed(1));
    if (fileSize <= 1) {
      fileSize = Math.ceil(file.size / 1024);
      fileSizeSuffix = " KB";
    }
    fileLabel = "[" + fileExt + " - " + fileSize + fileSizeSuffix + "]";
    markup =
      fileNumber + ". " + file.name + " <small>" + fileLabel + "</small>";
    ui.addFlag("title", markup);
  }
})();
