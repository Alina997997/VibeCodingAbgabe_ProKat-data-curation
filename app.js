(function () {
  "use strict";

  const fileInput = document.getElementById("file-input");
  const sourceInput = document.getElementById("source-input");
  const sourceCount = document.getElementById("source-count");
  const dropZone = document.getElementById("drop-zone");
  const sampleButton = document.getElementById("sample-button");
  const previewButton = document.getElementById("preview-button");
  const previewEmpty = document.getElementById("preview-empty");
  const previewContent = document.getElementById("preview-content");
  const recordCount = document.getElementById("record-count");
  const validationMessage = document.getElementById("validation-message");
  const issues = document.getElementById("issues");
  const jsonOutput = document.getElementById("json-output");
  const jsonStatus = document.getElementById("json-status");
  const downloadButton = document.getElementById("download-button");
  const openRecordsNavButton = document.getElementById("open-records-nav-button");
  const overviewNavStatus = document.getElementById("overview-nav-status");
  const openRecordsButton = document.getElementById("open-records-button");
  const addRecordsButton = document.getElementById("add-records-button");
  const copyButton = document.getElementById("copy-button");
  const backupCreateButton = document.getElementById("backup-create-button");
  const backupFileInput = document.getElementById("backup-file-input");
  const backupFileName = document.getElementById("backup-file-name");
  const backupRestoreButton = document.getElementById("backup-restore-button");
  const backupStatus = document.getElementById("backup-status");
  const steps = Array.from(document.querySelectorAll(".step"));
  let sourceName = "tustep-export";
  let parsedRecords = 0;
  let isPreviewCurrent = false;
  let pendingBackupFile = null;
  let currentRecords = [];
  let currentWarnings = [];
  let recordsWindow = null;
  let recordsChannel = null;
  let recordsWindowReady = false;
  let recordsWindowInitialized = false;
  let previewAddedToOverview = false;
  let overviewRecordsSnapshot = null;
  let recordsReadyTimer = null;

  function updateSourceCount() {
    const count = sourceInput.value.length;
    const lines = sourceInput.value ? sourceInput.value.split(/\r?\n/).length : 0;
    sourceCount.textContent = count ? count.toLocaleString("de-DE") + " Zeichen · " + lines + " Zeilen" : "Noch keine Datei geladen";
    previewButton.disabled = !sourceInput.value.trim();
  }

  function setStep(active) {
    steps.forEach(function (step, index) {
      step.classList.toggle("is-active", index === active - 1);
      step.classList.toggle("is-complete", index < active - 1);
    });
  }

  function resetPreview() {
    isPreviewCurrent = false;
    previewAddedToOverview = false;
    downloadButton.disabled = true;
    copyButton.disabled = true;
    jsonOutput.disabled = true;
    previewEmpty.hidden = false;
    previewContent.hidden = true;
    recordCount.textContent = "Vorschau veraltet";
    currentRecords = [];
    currentWarnings = [];
    setStep(1);
    updateBackupButtons();
  }

  function showFileError(message) {
    isPreviewCurrent = false;
    previewAddedToOverview = false;
    previewEmpty.hidden = true;
    previewContent.hidden = false;
    validationMessage.className = "validation-message has-errors";
    validationMessage.textContent = message;
    issues.replaceChildren();
    jsonOutput.value = "";
    jsonOutput.disabled = true;
    downloadButton.disabled = true;
    copyButton.disabled = true;
    recordCount.textContent = "Datei nicht geladen";
    currentRecords = [];
    currentWarnings = [];
    updateBackupButtons();
  }

  function safeFileName(name, fallback) {
    return String(name)
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .replace(/^\.+|\.+$/g, "")
      .trim() || fallback;
  }

  function updateBackupButtons() {
    backupCreateButton.disabled = !isPreviewCurrent || downloadButton.disabled;
    backupRestoreButton.disabled = !pendingBackupFile;
    openRecordsButton.disabled = !isPreviewCurrent || downloadButton.disabled;
    addRecordsButton.disabled = !isPreviewCurrent || downloadButton.disabled ||
      !currentRecords.length || previewAddedToOverview;
    addRecordsButton.textContent = previewAddedToOverview
      ? "Bereits in Übersicht"
      : "JSON-Datensätze zur Übersicht hinzufügen";
  }

  function setBackupStatus(message, state) {
    backupStatus.className = "backup-status" + (state ? " is-" + state : "");
    backupStatus.textContent = message;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function recordsMessageTarget() {
    return window.location.protocol === "file:" ? "*" : window.location.origin;
  }

  function sendRecordsToWindow() {
    if (!recordsWindow || recordsWindow.closed || !isPreviewCurrent) return;
    recordsWindow.postMessage({
      type: "prokat-records-init",
      channel: recordsChannel,
      records: currentRecords,
      warnings: currentWarnings,
      sourceName: sourceName
    }, recordsMessageTarget());
    overviewRecordsSnapshot = JSON.stringify(currentRecords);
    recordsWindowInitialized = true;
    previewAddedToOverview = true;
    updateBackupButtons();
  }

  function openRecordsWindow() {
    if (recordsWindow && !recordsWindow.closed) {
      recordsWindow.focus();
      overviewNavStatus.textContent = "";
      if (recordsWindowReady && isPreviewCurrent && !downloadButton.disabled && !recordsWindowInitialized) {
        sendRecordsToWindow();
      }
      return;
    }

    recordsChannel = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    recordsWindowReady = false;
    recordsWindowInitialized = false;
    overviewNavStatus.textContent = "";
    const url = new URL("records.html", window.location.href);
    url.searchParams.set("channel", recordsChannel);
    recordsWindow = window.open(url.href, "_blank");
    if (!recordsWindow) {
      overviewNavStatus.textContent = "Pop-up blockiert. Erlaube Pop-ups für die Eintragsübersicht.";
      if (!previewContent.hidden) {
        validationMessage.className = "validation-message has-errors";
        validationMessage.textContent = overviewNavStatus.textContent;
      }
      openRecordsButton.disabled = false;
      return;
    }
    const openingWindow = recordsWindow;
    recordsWindow.focus();
    recordsReadyTimer = window.setTimeout(function () {
      if (recordsWindow !== openingWindow || recordsWindowReady) return;
      recordsWindow = null;
      recordsChannel = null;
      recordsWindowReady = false;
      recordsWindowInitialized = false;
      overviewNavStatus.textContent = "Eintragsübersicht konnte nicht verbunden werden. Bitte erneut öffnen.";
      if (!previewContent.hidden) {
        validationMessage.className = "validation-message has-errors";
        validationMessage.textContent = overviewNavStatus.textContent;
      }
    }, 5000);
  }

  function addCurrentRecordsToOverview() {
    if (!isPreviewCurrent || downloadButton.disabled || !currentRecords.length || previewAddedToOverview) return;
    if (!recordsWindow || recordsWindow.closed) {
      recordsWindow = null;
      recordsWindowReady = false;
      recordsWindowInitialized = false;
      openRecordsWindow();
      return;
    }
    recordsWindow.focus();
    if (!recordsWindowReady) {
      validationMessage.textContent = "Die Eintragsübersicht wird noch verbunden. Klicke nach dem Laden erneut auf „Datensätze zur Übersicht hinzufügen“.";
      return;
    }
    if (!recordsWindowInitialized) {
      sendRecordsToWindow();
      if (recordsWindowInitialized) {
        validationMessage.className = "validation-message";
        validationMessage.textContent = currentRecords.length +
          (currentRecords.length === 1 ? " Datensatz wurde" : " Datensätze wurden") +
          " zur Eintragsübersicht hinzugefügt.";
      }
      return;
    }
    recordsWindow.postMessage({
      type: "prokat-records-append",
      channel: recordsChannel,
      records: currentRecords,
      warnings: currentWarnings,
      sourceName: sourceName
    }, recordsMessageTarget());
    overviewRecordsSnapshot = JSON.stringify(currentRecords);
    previewAddedToOverview = true;
    validationMessage.className = "validation-message";
    validationMessage.textContent = currentRecords.length +
      (currentRecords.length === 1 ? " Datensatz wurde" : " Datensätze wurden") +
      " zur Eintragsübersicht hinzugefügt.";
    updateBackupButtons();
  }

  function validWarnings(warnings) {
    return Array.isArray(warnings) && warnings.every(function (warning) {
      const recordNumber = Number(warning && warning.record);
      return warning && Number.isInteger(recordNumber) && recordNumber >= 0 &&
        (warning.line == null || (Number.isInteger(Number(warning.line)) && Number(warning.line) > 0)) &&
        typeof warning.message === "string";
    });
  }

  function receiveRecordsMessage(event) {
    if (!recordsWindow || event.source !== recordsWindow) return;
    if (window.location.protocol !== "file:" && event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message || message.channel !== recordsChannel) return;

    if (message.type === "prokat-records-ready") {
      recordsWindowReady = true;
      if (recordsReadyTimer) window.clearTimeout(recordsReadyTimer);
      recordsReadyTimer = null;
      if (!isPreviewCurrent || downloadButton.disabled) return;
      validationMessage.className = "validation-message" + (currentWarnings.length ? " has-errors" : "");
      validationMessage.textContent = currentWarnings.length
        ? currentWarnings.length + " Hinweis" + (currentWarnings.length === 1 ? "" : "e") + " – prüfe die markierten Stellen vor dem Export."
        : "Alle " + parsedRecords + " Datensätze wurden ohne Importhinweise erkannt.";
      if (!recordsWindowInitialized) {
        sendRecordsToWindow();
        if (recordsWindowInitialized) {
          validationMessage.className = "validation-message";
          validationMessage.textContent = currentRecords.length +
            (currentRecords.length === 1 ? " Datensatz wurde" : " Datensätze wurden") +
            " zur Eintragsübersicht hinzugefügt.";
        }
      }
      return;
    }
    if (message.type !== "prokat-records-updated" || !Array.isArray(message.records) ||
        !message.records.every(function (record) { return record && typeof record === "object" && !Array.isArray(record); }) ||
        !validWarnings(message.warnings) || !isPreviewCurrent) {
      return;
    }

    currentRecords = message.records;
    currentWarnings = message.warnings;
    overviewRecordsSnapshot = JSON.stringify(currentRecords);
    parsedRecords = currentRecords.length;
    jsonOutput.value = JSON.stringify(currentRecords, null, 2);
    isPreviewCurrent = true;
    copyButton.disabled = false;
    validationMessage.className = "validation-message";
    validationMessage.textContent = "Änderungen aus der Eintragsübersicht übernommen.";
    previewAddedToOverview = true;
    recordCount.textContent = parsedRecords + (parsedRecords === 1 ? " Datensatz" : " Datensätze") +
      (currentWarnings.length ? " · " + currentWarnings.length + (currentWarnings.length === 1 ? " Hinweis" : " Hinweise") : "");
    setStep(2);
    validateJson(false);
    updateBackupButtons();
  }

  async function loadFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt") && file.type !== "text/plain") {
      showFileError("Bitte wähle eine TUSTEP-Textdatei im .txt-Format aus.");
      return;
    }
    try {
      sourceInput.value = await file.text();
      sourceName = safeFileName(file.name.replace(/\.txt$/i, ""), "tustep-export");
      updateSourceCount();
      resetPreview();
    } catch (error) {
      showFileError("Die Datei konnte nicht gelesen werden: " + error.message);
    }
  }

  function renderWarnings(warnings) {
    issues.replaceChildren();
    const visibleWarnings = warnings.slice(0, 30);
    visibleWarnings.forEach(function (warning) {
      const item = document.createElement("div");
      item.className = "issue";
      const label = document.createElement("strong");
      const recordNumber = Number(warning.record);
      label.textContent = warning.line
        ? recordNumber > 0 ? "Datensatz " + recordNumber + " · Zeile " + warning.line + ": " : "Quellzeile " + warning.line + ": "
        : recordNumber > 0 ? "Datensatz " + recordNumber + ": " : "Quelldaten: ";
      item.append(label, document.createTextNode(warning.message));
      issues.append(item);
    });
    if (warnings.length > visibleWarnings.length) {
      const more = document.createElement("div");
      more.className = "issue";
      more.textContent = "Weitere " + (warnings.length - visibleWarnings.length) + " Hinweise ausgeblendet.";
      issues.append(more);
    }
  }

  function generatePreview() {
    const result = window.TustepConverter.parse(sourceInput.value);
    parsedRecords = result.records.length;
    if (!parsedRecords) {
      isPreviewCurrent = false;
      previewAddedToOverview = false;
      currentRecords = [];
      currentWarnings = result.warnings;
      previewEmpty.hidden = true;
      previewContent.hidden = false;
      validationMessage.className = "validation-message has-errors";
      validationMessage.textContent = "Es wurden keine Datensätze gefunden. Korrigiere den Quelltext und versuche es erneut.";
      renderWarnings(result.warnings);
      jsonOutput.value = "";
      jsonOutput.disabled = true;
      jsonStatus.className = "json-status";
      jsonStatus.innerHTML = '<span class="status-dot"></span> Kein JSON vorhanden';
      downloadButton.disabled = true;
      copyButton.disabled = true;
      recordCount.textContent = "0 Datensätze";
      setStep(1);
      updateBackupButtons();
      return;
    }

    currentRecords = result.records;
    currentWarnings = result.warnings;
    previewAddedToOverview = false;
    previewEmpty.hidden = true;
    previewContent.hidden = false;
    jsonOutput.value = JSON.stringify(result.records, null, 2);
    jsonOutput.disabled = false;
    validationMessage.className = "validation-message" + (result.warnings.length ? " has-errors" : "");
    validationMessage.textContent = result.warnings.length
      ? result.warnings.length + " Hinweis" + (result.warnings.length === 1 ? "" : "e") + " – prüfe die markierten Stellen vor dem Export."
      : "Alle " + parsedRecords + " Datensätze wurden ohne Importhinweise erkannt.";
    renderWarnings(result.warnings);
    const warningCount = result.warnings.length;
    recordCount.textContent = parsedRecords + (parsedRecords === 1 ? " Datensatz" : " Datensätze") + (warningCount ? " · " + warningCount + (warningCount === 1 ? " Hinweis" : " Hinweise") : "");
    isPreviewCurrent = true;
    copyButton.disabled = false;
    setStep(2);
    validateJson(false);
    updateBackupButtons();
  }

  function validateJson(announce) {
    if (!isPreviewCurrent) return false;
    try {
      const parsed = JSON.parse(jsonOutput.value);
      if (!Array.isArray(parsed)) throw new Error("Das JSON muss ein Array von Datensätzen sein.");
      if (!parsed.every(function (record) { return record && typeof record === "object" && !Array.isArray(record); })) {
        throw new Error("Jeder Eintrag im JSON muss ein Datensatz-Objekt sein.");
      }
      jsonStatus.className = "json-status is-valid";
      jsonStatus.innerHTML = '<span class="status-dot"></span> Gültiges JSON · ' + parsed.length + (parsed.length === 1 ? ' Datensatz' : ' Datensätze');
      downloadButton.disabled = false;
      if (announce) setStep(3);
      updateBackupButtons();
      return true;
    } catch (error) {
      jsonStatus.className = "json-status is-invalid";
      jsonStatus.innerHTML = '<span class="status-dot"></span> JSON-Fehler: ' + escapeHtml(error.message);
      downloadButton.disabled = true;
      updateBackupButtons();
      return false;
    }
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  sourceInput.addEventListener("input", function () {
    updateSourceCount();
    if (!isPreviewCurrent && previewContent.hidden) return;
    resetPreview();
  });
  fileInput.addEventListener("change", function () { loadFile(fileInput.files[0]); });
  sampleButton.addEventListener("click", async function () {
    sampleButton.disabled = true;
    try {
      const response = await fetch("import-data-example.txt");
      if (!response.ok) throw new Error("HTTP " + response.status);
      sourceInput.value = await response.text();
      sourceName = "import-data-example";
      updateSourceCount();
      resetPreview();
    } catch (error) {
      showFileError("Die Beispieldatei konnte nicht automatisch geladen werden. Starte einen lokalen Webserver oder wähle import-data-example.txt manuell über „Datei auswählen“ aus (" + error.message + ").");
    } finally {
      sampleButton.disabled = false;
    }
  });
  previewButton.addEventListener("click", function () {
    generatePreview();
  });
  openRecordsNavButton.addEventListener("click", openRecordsWindow);
  openRecordsButton.addEventListener("click", openRecordsWindow);
  addRecordsButton.addEventListener("click", addCurrentRecordsToOverview);
  jsonOutput.addEventListener("input", function () {
    const valid = validateJson(false);
    if (valid) {
      currentRecords = JSON.parse(jsonOutput.value);
      previewAddedToOverview = JSON.stringify(currentRecords) === overviewRecordsSnapshot;
    }
    updateBackupButtons();
  });
  window.addEventListener("message", receiveRecordsMessage);
  downloadButton.addEventListener("click", function () {
    if (!validateJson(true)) return;
    downloadBlob(new Blob([jsonOutput.value], { type: "application/json;charset=utf-8" }), sourceName + ".json");
  });
  copyButton.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(jsonOutput.value);
      jsonStatus.className = "json-status is-valid";
      jsonStatus.innerHTML = '<span class="status-dot"></span> JSON in die Zwischenablage kopiert';
    } catch (error) {
      jsonStatus.className = "json-status is-invalid";
      jsonStatus.innerHTML = '<span class="status-dot"></span> Kopieren nicht möglich: ' + escapeHtml(error.message);
    }
  });

  backupFileInput.addEventListener("change", function () {
    pendingBackupFile = backupFileInput.files[0] || null;
    backupFileName.textContent = pendingBackupFile ? pendingBackupFile.name : "Keine Backup-Datei ausgewählt";
    if (pendingBackupFile && !pendingBackupFile.name.toLowerCase().endsWith(".prokat-backup.json")) {
      pendingBackupFile = null;
      backupFileInput.value = "";
      backupFileName.textContent = "Keine gültige Backup-Datei ausgewählt";
      setBackupStatus("Bitte wähle eine .prokat-backup.json-Datei aus.", "error");
    } else if (pendingBackupFile) {
      setBackupStatus("Backup ausgewählt. Es enthält unverschlüsselte personenbezogene Daten.", "");
    }
    updateBackupButtons();
  });
  backupCreateButton.addEventListener("click", async function () {
    if (!validateJson(false)) return;
    backupCreateButton.disabled = true;
    setBackupStatus("Backup wird erstellt …", "");
    try {
      const payload = {
        format: "prokat-data-backup",
        version: 1,
        createdAt: new Date().toISOString(),
        sourceName: sourceName,
        sourceText: sourceInput.value,
        records: JSON.parse(jsonOutput.value)
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, sourceName + ".prokat-backup.json");
      setBackupStatus("Backup erstellt. Die Datei enthält unverschlüsselte personenbezogene Daten.", "success");
    } catch (error) {
      setBackupStatus("Backup konnte nicht erstellt werden: " + error.message, "error");
    } finally {
      updateBackupButtons();
    }
  });
  backupRestoreButton.addEventListener("click", async function () {
    if (!pendingBackupFile) return;
    backupRestoreButton.disabled = true;
    setBackupStatus("Backup wird geladen …", "");
    try {
      const payload = JSON.parse(await pendingBackupFile.text());
      if (!payload || payload.format !== "prokat-data-backup" || payload.version !== 1 ||
          typeof payload.sourceName !== "string" || typeof payload.sourceText !== "string" ||
          !Array.isArray(payload.records) || !payload.records.every(function (record) {
            return record && typeof record === "object" && !Array.isArray(record);
          })) {
        throw new Error("Die Backup-Datei hat ein unbekanntes oder ungültiges Format.");
      }

      const sourceResult = window.TustepConverter.parse(payload.sourceText);
      sourceInput.value = payload.sourceText;
      sourceName = safeFileName(payload.sourceName, "tustep-export");
      updateSourceCount();
      currentRecords = payload.records;
      currentWarnings = sourceResult.warnings;
      parsedRecords = payload.records.length;
      previewEmpty.hidden = true;
      previewContent.hidden = false;
      jsonOutput.value = JSON.stringify(payload.records, null, 2);
      jsonOutput.disabled = false;
      validationMessage.className = "validation-message" + (sourceResult.warnings.length ? " has-errors" : "");
      validationMessage.textContent = sourceResult.warnings.length
        ? sourceResult.warnings.length + " Hinweis" + (sourceResult.warnings.length === 1 ? "" : "e") + " in den gespeicherten Quelldaten."
        : "Backup geladen · " + parsedRecords + (parsedRecords === 1 ? " Datensatz" : " Datensätze") + ".";
      renderWarnings(sourceResult.warnings);
      recordCount.textContent = parsedRecords + (parsedRecords === 1 ? " Datensatz" : " Datensätze") +
        (sourceResult.warnings.length ? " · " + sourceResult.warnings.length + (sourceResult.warnings.length === 1 ? " Hinweis" : " Hinweise") : "");
      copyButton.disabled = false;
      isPreviewCurrent = true;
      previewAddedToOverview = false;
      setStep(2);
      validateJson(false);
      setBackupStatus("Backup geladen. Du kannst Quelltext und JSON weiterbearbeiten.", "success");
    } catch (error) {
      setBackupStatus("Backup konnte nicht geladen werden: " + error.message, "error");
    } finally {
      updateBackupButtons();
    }
  });

  ["dragenter", "dragover"].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
      event.preventDefault();
      dropZone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
      event.preventDefault();
      dropZone.classList.remove("is-dragging");
    });
  });
  dropZone.addEventListener("drop", function (event) {
    loadFile(event.dataTransfer.files[0]);
  });
  sourceInput.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = sourceInput.selectionStart;
      const end = sourceInput.selectionEnd;
      sourceInput.setRangeText("  ", start, end, "end");
      sourceInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  updateSourceCount();
  updateBackupButtons();
})();
