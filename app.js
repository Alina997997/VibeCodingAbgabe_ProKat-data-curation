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
    downloadButton.disabled = true;
    copyButton.disabled = true;
    jsonOutput.disabled = true;
    previewEmpty.hidden = false;
    previewContent.hidden = true;
    recordCount.textContent = "Vorschau veraltet";
    setStep(1);
    updateBackupButtons();
  }

  function showFileError(message) {
    isPreviewCurrent = false;
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
      label.textContent = warning.line ? "Datensatz " + warning.record + " · Zeile " + warning.line + ": " : "Datensatz " + warning.record + ": ";
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
      previewEmpty.hidden = true;
      previewContent.hidden = false;
      validationMessage.className = "validation-message has-errors";
      validationMessage.textContent = "Es wurden keine Datensätze gefunden. Korrigiere den Quelltext und versuche es erneut.";
      renderWarnings(result.warnings);
      jsonOutput.value = "";
      jsonOutput.disabled = true;
      downloadButton.disabled = true;
      copyButton.disabled = true;
      recordCount.textContent = "0 Datensätze";
      setStep(1);
      updateBackupButtons();
      return;
    }

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
      showFileError("Die Beispieldatei konnte nicht geladen werden. Starte die lokale WebApp über einen Webserver und versuche es erneut (" + error.message + ").");
    } finally {
      sampleButton.disabled = false;
    }
  });
  previewButton.addEventListener("click", generatePreview);
  jsonOutput.addEventListener("input", function () {
    validateJson(false);
    updateBackupButtons();
  });
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
