(function pdfCheck() {
  "use strict";

  var form = document.querySelector("#dropzone"),
    input = form.querySelector('input[type="file"]'),
    label = form.querySelector("label"),
    droppedFiles = false;

  input.addEventListener("change", function processStart(e) {
    showFiles(e.target.files);
    processFiles(e.target.files);
  });

  if (isAdvancedUpload()) {
    form.addEventListener("drag", stopShort, false);
    form.addEventListener("dragstart", stopShort, false);
    form.addEventListener("dragend", stopShort, false);
    form.addEventListener("dragover", stopShort, false);
    form.addEventListener("dragenter", stopShort, false);
    form.addEventListener("dragleave", stopShort, false);
    form.addEventListener("drop", stopShort, false);

    form.addEventListener("dragover", dragIn, false);
    form.addEventListener("dragenter", dragIn, false);

    form.addEventListener("dragleave", dragOut, false);
    form.addEventListener("dragend", dragOut, false);
    form.addEventListener("drop", dragOut, false);

    form.addEventListener("drop", function fileDrop(e) {
      droppedFiles = e.dataTransfer.files;
      showFiles(droppedFiles);
      processFiles(droppedFiles);
    });
  }

  // Firefox focus bug fix for file input
  input.addEventListener("focus", function fileFocus() {
    input.classList.add("has-focus");
  });

  input.addEventListener("blur", function fileBlur() {
    input.classList.remove("has-focus");
  });

  function dragIn() {
    form.classList.add("is-dragover");
  }

  function dragOut() {
    form.classList.remove("is-dragover");
  }

  function stopShort(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function showFiles(files) {
    label.textContent = files[0].name;
    if (files.length > 1) {
      label.textContent = input
        .getAttribute("data-multiple-caption")
        .replace("{count}", files.length);
    }
  }

  function addFlag(className, innerHTML) {
    var tempNode = document.createElement("p");

    tempNode.className = "flag " + className;
    tempNode.innerHTML = innerHTML;
    document.getElementById("report").appendChild(tempNode);
  }

  // Check if valid PDF file (read first 8 bytes, match regex)
  function validatePDF(fileData) {
    var markup,
      dataHeader = fileData.substr(0, 8),
      regexHeader = /%PDF-(1.[0-7])/g,
      matchHeader = regexHeader.exec(dataHeader);

    if (!matchHeader) {
      markup = "<strong>Not a valid PDF file</strong>";
      addFlag("default", markup);

      return false;
    }
    markup =
      "<span>PDF Version:</span> <strong>" + matchHeader[1] + "</strong>";
    addFlag("default", markup);

    return true;
  }

  // Check if StructTreeRoot is set and count tags
  function findTags(fileData) {
    var markup,
      regexTree = /StructTreeRoot\s(\d*)\s(\d*)/g,
      matchTree = regexTree.exec(fileData);

    if (matchTree) {
      markup =
        '<span>Tagged <a href="#help-tagged" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>Yes (' +
        matchTree[1] +
        " tags)</strong>";
      addFlag("success", markup);
    } else {
      markup =
        '<span>Tagged <a href="#help-tagged" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>No</strong>';
      addFlag("failure", markup);
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
      addFlag("success", markup);
    } else {
      markup =
        '<span>Language <a href="#help-language" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>not set</strong>';
      addFlag("failure", markup);
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
        addFlag("success", markup);
      } else {
        markup =
          '<span>Marked <a href="#help-marked" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>False</strong>';
        addFlag("warning", markup);
      }
    } else {
      markup =
        '<span>Marked <a href="#help-marked" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>No</strong>';
      addFlag("failure", markup);
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
      addFlag("success", markup);
    } else {
      markup =
        '<span>PDF/UA identifier <a href="#help-pdfua" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>Not set</strong>';
      addFlag("warning", markup);
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
        addFlag("warning", markup);
      } else {
        markup =
          '<span>Document Title <a href="#help-title" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>' +
          matchTitle[1] +
          "</strong>";
        addFlag("default", markup);
      }
    } else {
      markup =
        '<span>Document Title <a href="#help-title" class="more-info" aria-label="more information on this check" title="more information on this check">i</a></span> <strong>Not set</strong>';
      addFlag("failure", markup);
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
    addFlag("title", markup);
  }

  function runCheck(file, fileData, fileNumber) {
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

  function readMultiFiles(files) {
    var reader = new FileReader();

    function readFile(index) {
      var file;

      if (index >= files.length) {
        return;
      }
      file = files[index];
      reader.onload = function onload(e) {
        var fileData = e.target.result;

        runCheck(file, fileData, index + 1);
        readFile(index + 1);
      };
      reader.readAsText(file);
    }
    readFile(0);
  }

  function processFiles(files) {
    document.getElementById("report").innerHTML = "";
    readMultiFiles(files);
  }

  function isAdvancedUpload() {
    var div = document.createElement("div");

    return (
      ("draggable" in div || ("ondragstart" in div && "ondrop" in div)) &&
      "FormData" in window &&
      "FileReader" in window
    );
  }
})();
