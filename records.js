(function () {
  "use strict";

  const channel = new URLSearchParams(window.location.search).get("channel");
  const connectionStatus = document.getElementById("connection-status");
  const searchInput = document.getElementById("search-input");
  const issueFilter = document.getElementById("issue-filter");
  const exportButton = document.getElementById("export-filtered");
  const importJsonButton = document.getElementById("import-json-button");
  const importJsonInput = document.getElementById("import-json-input");
  const recordsBody = document.getElementById("records-body");
  const visibleCount = document.getElementById("visible-count");
  const listEmpty = document.getElementById("list-empty");
  const recordsNotice = document.getElementById("records-notice");
  const detailEmpty = document.getElementById("detail-empty");
  const detailView = document.getElementById("detail-view");
  const detailHeading = document.getElementById("detail-heading");
  const detailPit = document.getElementById("detail-pit");
  const detailYears = document.getElementById("detail-years");
  const detailIssueBadge = document.getElementById("detail-issue-badge");
  const dummyPhoto = document.getElementById("dummy-photo");
  const photoCaption = document.getElementById("photo-caption");
  const recordIssues = document.getElementById("record-issues");
  const formFields = document.getElementById("form-fields");
  const additionalSections = document.getElementById("additional-sections");
  const jsonEditor = document.getElementById("record-json-editor");
  const jsonStatus = document.getElementById("record-json-status");
  const applyJsonButton = document.getElementById("apply-json");
  const stats = {
    total: document.getElementById("stat-total"),
    affected: document.getElementById("stat-affected"),
    import: document.getElementById("stat-import"),
    format: document.getElementById("stat-format")
  };

  const editableFields = [
    { label: "PK-Kennung", path: ["(0) PK"] },
    { label: "Geschlecht", path: ["(011) Geschlecht"] },
    { label: "PIT", path: ["(1) Name", "PIT"] },
    { label: "Nachname", path: ["(1) Name", "Nachname"] },
    { label: "Vorname", path: ["(1) Name", "Vorname"] },
    { label: "Geburtsjahr", path: ["(1) Name", "Geburtsjahr"] },
    { label: "Sterbejahr", path: ["(1) Name", "Sterbejahr"] },
    { label: "Kurzcharakterisierung", path: ["(1a) Kurzcharakterisierung"], multiline: true, wide: true },
    { label: "Studium in Tübingen", path: ["(1b) Studium-in-Tübingen"], multiline: true, wide: true },
    { label: "Biogramm", path: ["(1c) Biogramme"], multiline: true, wide: true },
    { label: "Würdigung", path: ["(1d) Würdigung"], multiline: true, wide: true },
    { label: "Geburtsdatum", path: ["(6+7) Lebensdaten", "Geburtsdatum"], tag: "#6" },
    { label: "Geburtsort", path: ["(6+7) Lebensdaten", "Geburtsort"], tag: "#6" },
    { label: "Sterbedatum", path: ["(6+7) Lebensdaten", "Sterbedatum"], tag: "#7" },
    { label: "Sterbeort", path: ["(6+7) Lebensdaten", "Sterbeort"], tag: "#7" },
    { label: "Begräbnisdaten", path: ["(6+7) Lebensdaten", "(7a) Begräbnisdaten"], multiline: true, wide: true }
  ];

  const displayGroups = [
    { title: "Universität und Fach", keys: ["(012) Uni-Angehörigkeit", "(2+3) Fakultätszugehörigkeit", "(4) Lehrfach", "(5) Konfession"] },
    { title: "Familie", keys: ["(8+9) Eltern", "(10) Ehepartner", "(10a) Kinder"] },
    { title: "Werdegang und Ämter", keys: ["(11) Bildungsgang", "(12) Berufslaufbahn", "(13) Akademische-Ämter", "(14) Titel", "(15) Mitgliedschaft Wissenschaft", "(15a) Mitgliedschaft Studium"] },
    { title: "Quellen und Nachweise", keys: ["(17) Archivalische-Quellen", "(18) Literatur", "(18a) Online-Quellen", "(19) Bildnachweise", "(20) Bemerkungen", "(21) Bearbeiter", "(23) BIB", "(24) GND"] }
  ];

  let records = [];
  let sourceWarnings = [];
  let sourceName = "prokat";
  let problemCache = [];
  let visibleIndices = [];
  let selectedIndex = -1;
  let notifyTimer = null;

  function safeFileName(name) {
    return String(name || "prokat")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .replace(/^\.+|\.+$/g, "")
      .trim() || "prokat";
  }

  function setText(element, value) {
    element.textContent = value == null ? "" : String(value);
  }

  function fullName(record) {
    const name = record["(1) Name"] || {};
    return [name.Vorname, name.Nachname].filter(Boolean).join(" ") || "Name fehlt";
  }

  function warningCategory(message, hasLine) {
    if (hasLine || /Unbekanntes Feld|Zeile ohne|ohne #1|ohne PIT|Name ohne Komma|Keine TUSTEP-Datensätze/i.test(message)) {
      return "import";
    }
    return "format";
  }

  function warningPath(message) {
    if (/#6\b/.test(message)) return ["(6+7) Lebensdaten", /Ort|Ortsmarkierung/i.test(message) ? "Geburtsort" : "Geburtsdatum"];
    if (/#7\b/.test(message)) return ["(6+7) Lebensdaten", /Ort|Ortsmarkierung/i.test(message) ? "Sterbeort" : "Sterbedatum"];
    return null;
  }

  function validDate(value) {
    const match = String(value).match(/^(\d{1,2})\.(\d{1,2})\.(\d{3,4})$/);
    if (!match) return false;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function getRecordProblems(index) {
    const record = records[index] || {};
    const problems = sourceWarnings
      .filter(function (warning) { return Number(warning.record) === index + 1; })
      .map(function (warning) {
        return {
          category: warningCategory(warning.message, Boolean(warning.line)),
          message: warning.message,
          path: warningPath(warning.message)
        };
      })
      .filter(function (problem) {
        if (problem.category !== "format" || !problem.path) return true;
        const value = pathValue(record, problem.path);
        const field = problem.path[1];
        if (field === "Geburtsdatum" || field === "Sterbedatum") {
          return Boolean(value) && !validDate(value);
        }
        if (field === "Geburtsort" || field === "Sterbeort") {
          return typeof value === "string" && /\(\(o|\)\)/.test(value);
        }
        return true;
      });

    const life = record["(6+7) Lebensdaten"] || {};
    [
      { key: "Geburtsdatum", label: "Geburtsdatum", tag: "#6" },
      { key: "Sterbedatum", label: "Sterbedatum", tag: "#7" }
    ].forEach(function (item) {
      const value = life[item.key];
      if (value && !validDate(value) && !problems.some(function (problem) { return problem.message.indexOf(item.tag) >= 0; })) {
        problems.push({
          category: "format",
          message: item.label + " ist nicht als gültiges Datum im Format T.M.JJJJ lesbar.",
          path: ["(6+7) Lebensdaten", item.key]
        });
      }
    });

    [
      { key: "Geburtsort", label: "Geburtsort", tag: "#6" },
      { key: "Sterbeort", label: "Sterbeort", tag: "#7" }
    ].forEach(function (item) {
      const value = life[item.key];
      if (typeof value === "string" && /\(\(o|\)\)/.test(value) &&
          !problems.some(function (problem) { return problem.message.indexOf(item.tag) >= 0; })) {
        problems.push({
          category: "format",
          message: item.label + " enthält noch eine nicht bereinigte TUSTEP-Ortsmarkierung.",
          path: ["(6+7) Lebensdaten", item.key]
        });
      }
    });
    return problems;
  }

  function rebuildProblemCache() {
    problemCache = records.map(function (_, index) { return getRecordProblems(index); });
  }

  function getVisibleIndices() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const filter = issueFilter.value;
    return records.map(function (_, index) { return index; }).filter(function (index) {
      const record = records[index];
      const problems = problemCache[index];
      if (filter === "issues" && !problems.length) return false;
      if (filter === "import" && !problems.some(function (problem) { return problem.category === "import"; })) return false;
      if (filter === "format" && !problems.some(function (problem) { return problem.category === "format"; })) return false;
      return !query || JSON.stringify(record).toLocaleLowerCase().includes(query);
    });
  }

  function updateStatistics() {
    let affected = 0;
    let importCount = 0;
    let formatCount = 0;
    problemCache.forEach(function (problems) {
      if (problems.length) affected += 1;
      problems.forEach(function (problem) {
        if (problem.category === "import") importCount += 1;
        else formatCount += 1;
      });
    });
    setText(stats.total, records.length);
    setText(stats.affected, affected);
    setText(stats.import, importCount);
    setText(stats.format, formatCount);
  }

  function makeCell(text, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = text || "–";
    return cell;
  }

  function renderTable() {
    visibleIndices = getVisibleIndices();
    if (!visibleIndices.includes(selectedIndex)) selectedIndex = visibleIndices.length ? visibleIndices[0] : -1;
    recordsBody.replaceChildren();
    visibleIndices.forEach(function (index) {
      const record = records[index];
      const name = record["(1) Name"] || {};
      const row = document.createElement("tr");
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", "Eintrag " + fullName(record) + " anzeigen");
      row.dataset.index = String(index);
      if (problemCache[index].length) row.classList.add("row-has-issue");
      if (index === selectedIndex) row.classList.add("is-selected");
      row.append(
        makeCell(name.PIT),
        makeCell(fullName(record), "person-cell"),
        makeCell(record["(011) Geschlecht"]),
        makeCell(record["(1a) Kurzcharakterisierung"], "summary-cell")
      );
      const status = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = problemCache[index].length ? "table-badge has-issue" : "table-badge clean";
      badge.textContent = problemCache[index].length ? problemCache[index].length + " Hinweis" + (problemCache[index].length === 1 ? "" : "e") : "Unauffällig";
      status.append(badge);
      row.append(status);
      row.addEventListener("click", function () { selectRecord(index); });
      row.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRecord(index);
        }
      });
      recordsBody.append(row);
    });
    listEmpty.hidden = visibleIndices.length > 0;
    setText(visibleCount, visibleIndices.length + (visibleIndices.length === 1 ? " Eintrag" : " Einträge"));
    exportButton.disabled = visibleIndices.length === 0;
    const filterText = searchInput.value.trim() ? " passend zur Suche" : "";
    setText(recordsNotice, records.length
      ? visibleIndices.length + " von " + records.length + " Einträgen werden angezeigt" + filterText + "."
      : "Noch keine Datensätze erhalten. Öffne die Übersicht über den Konverter nach dem Erzeugen einer Vorschau.");
    renderDetail();
  }

  function pathValue(record, path) {
    return path.reduce(function (value, key) { return value && value[key]; }, record);
  }

  function setPathValue(record, path, value) {
    let cursor = record;
    for (let index = 0; index < path.length - 1; index += 1) {
      if (!cursor[path[index]] || typeof cursor[path[index]] !== "object") cursor[path[index]] = {};
      cursor = cursor[path[index]];
    }
    cursor[path[path.length - 1]] = value;
  }

  function hasPathProblem(problems, path) {
    return problems.some(function (problem) {
      return problem.path && problem.path.length === path.length &&
        problem.path.every(function (segment, index) { return segment === path[index]; });
    });
  }

  function renderForm(record, problems) {
    formFields.replaceChildren();
    editableFields.forEach(function (field) {
      const label = document.createElement("label");
      label.className = "form-field" + (field.wide ? " is-wide" : "");
      const caption = document.createElement("span");
      caption.className = "field-label";
      caption.textContent = field.label;
      const control = document.createElement(field.multiline ? "textarea" : "input");
      if (!field.multiline) control.type = "text";
      control.value = pathValue(record, field.path) || "";
      control.dataset.path = JSON.stringify(field.path);
      if (hasPathProblem(problems, field.path)) {
        label.classList.add("field-has-issue");
        control.setAttribute("aria-invalid", "true");
      }
      control.addEventListener("change", function () {
        setPathValue(record, field.path, control.value.trim());
        rebuildProblemCache();
        renderTable();
        sendRecordsUpdate();
      });
      label.append(caption, control);
      formFields.append(label);
    });
  }

  function appendValue(container, value) {
    if (value == null || value === "") {
      const empty = document.createElement("span");
      empty.className = "empty-value";
      empty.textContent = "Keine Angabe";
      container.append(empty);
      return;
    }
    if (Array.isArray(value)) {
      if (!value.length) {
        const empty = document.createElement("span");
        empty.className = "empty-value";
        empty.textContent = "Keine Einträge";
        container.append(empty);
        return;
      }
      const list = document.createElement("ul");
      value.forEach(function (item) {
        const entry = document.createElement("li");
        appendValue(entry, item);
        list.append(entry);
      });
      container.append(list);
      return;
    }
    if (typeof value === "object") {
      const list = document.createElement("dl");
      Object.keys(value).forEach(function (key) {
        const term = document.createElement("dt");
        term.textContent = key;
        const description = document.createElement("dd");
        appendValue(description, value[key]);
        list.append(term, description);
      });
      container.append(list);
      return;
    }
    const text = document.createElement("span");
    text.textContent = String(value);
    container.append(text);
  }

  function renderAdditional(record) {
    additionalSections.replaceChildren();
    displayGroups.forEach(function (group) {
      const section = document.createElement("section");
      section.className = "detail-block";
      const heading = document.createElement("h3");
      heading.textContent = group.title;
      const list = document.createElement("dl");
      group.keys.forEach(function (key) {
        const term = document.createElement("dt");
        term.textContent = key;
        const description = document.createElement("dd");
        appendValue(description, record[key]);
        list.append(term, description);
      });
      section.append(heading, list);
      additionalSections.append(section);
    });
  }

  function renderIssues(problems) {
    recordIssues.replaceChildren();
    if (!problems.length) {
      const ok = document.createElement("p");
      ok.className = "no-issues";
      ok.textContent = "Keine Import- oder Formatprobleme erkannt.";
      recordIssues.append(ok);
      return;
    }
    const heading = document.createElement("h3");
    heading.textContent = "Bitte prüfen";
    const list = document.createElement("ul");
    problems.forEach(function (problem) {
      const item = document.createElement("li");
      item.className = problem.category === "import" ? "problem-import" : "problem-format";
      const type = document.createElement("strong");
      type.textContent = problem.category === "import" ? "Importproblem · " : "Formatproblem · ";
      item.append(type, document.createTextNode(problem.message));
      list.append(item);
    });
    recordIssues.append(heading, list);
  }

  function renderDetail() {
    if (selectedIndex < 0 || !records[selectedIndex]) {
      detailEmpty.hidden = false;
      detailView.hidden = true;
      return;
    }
    const record = records[selectedIndex];
    const name = record["(1) Name"] || {};
    const life = record["(6+7) Lebensdaten"] || {};
    const gender = String(record["(011) Geschlecht"] || "").toLocaleLowerCase();
    const problems = problemCache[selectedIndex] || [];
    detailEmpty.hidden = true;
    detailView.hidden = false;
    setText(detailHeading, fullName(record));
    setText(detailPit, "PIT " + (name.PIT || "–"));
    const years = [name.Geburtsjahr || "?", name.Sterbejahr || "?"].join("–");
    setText(detailYears, years);
    detailIssueBadge.hidden = !problems.length;
    detailIssueBadge.className = "issue-badge" + (problems.length ? " has-issue" : "");
    setText(detailIssueBadge, problems.length ? problems.length + " Hinweis" + (problems.length === 1 ? "" : "e") : "");
    dummyPhoto.classList.toggle("gender-male", gender === "männlich" || gender === "m");
    dummyPhoto.classList.toggle("gender-female", gender === "weiblich" || gender === "w");
    setText(photoCaption, "Dummy-Foto · " + (record["(011) Geschlecht"] || "keine Angabe"));
    const birthDeath = [life.Geburtsdatum, life.Geburtsort, life.Sterbedatum, life.Sterbeort].filter(Boolean).join(" · ");
    detailYears.title = birthDeath;
    renderIssues(problems);
    renderForm(record, problems);
    renderAdditional(record);
    jsonEditor.value = JSON.stringify(record, null, 2);
    setText(jsonStatus, "JSON nicht geändert");
    updateStatistics();
  }

  function selectRecord(index) {
    selectedIndex = index;
    renderTable();
  }

  function renderAll() {
    rebuildProblemCache();
    updateStatistics();
    renderTable();
    connectionStatus.classList.add("is-connected");
    setText(connectionStatus, records.length + (records.length === 1 ? " Datensatz geladen" : " Datensätze geladen"));
  }

  function validRecordArray(value) {
    return Array.isArray(value) && value.every(function (record) {
      return record && typeof record === "object" && !Array.isArray(record);
    });
  }

  function validWarnings(value) {
    return Array.isArray(value) && value.every(function (warning) {
      return warning && Number.isInteger(Number(warning.record)) &&
        Number(warning.record) > 0 && typeof warning.message === "string";
    });
  }

  function messageTargetOrigin() {
    return window.location.protocol === "file:" ? "*" : window.location.origin;
  }

  function sendRecordsUpdate() {
    if (!window.opener || !channel) return;
    if (notifyTimer) window.clearTimeout(notifyTimer);
    notifyTimer = window.setTimeout(function () {
      window.opener.postMessage({
        type: "prokat-records-updated",
        channel: channel,
        records: records,
        warnings: sourceWarnings
      }, messageTargetOrigin());
    }, 120);
  }

  async function importJsonFile(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : [parsed];
      if (!incoming.length || !validRecordArray(incoming)) {
        throw new Error("Die Datei muss ein JSON-Objekt oder ein nicht leeres Array aus Datensatz-Objekten enthalten.");
      }

      const firstAddedIndex = records.length;
      records = records.concat(incoming);
      selectedIndex = firstAddedIndex;
      searchInput.value = "";
      issueFilter.value = "all";
      sourceName = safeFileName(file.name.replace(/\.json$/i, "")) || sourceName;
      rebuildProblemCache();
      renderTable();
      setText(recordsNotice, incoming.length + (incoming.length === 1
        ? " Datensatz aus " + file.name + " hinzugefügt."
        : " Datensätze aus " + file.name + " hinzugefügt."));
      sendRecordsUpdate();
    } catch (error) {
      setText(recordsNotice, "JSON-Datei konnte nicht hinzugefügt werden: " + error.message);
    } finally {
      importJsonInput.value = "";
    }
  }

  function exportVisibleRecords() {
    const visibleRecords = visibleIndices.map(function (index) { return records[index]; });
    if (!visibleRecords.length) return;
    const payload = JSON.stringify(visibleRecords, null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFileName(sourceName) + "-gefiltert.json";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    setText(recordsNotice, visibleRecords.length + (visibleRecords.length === 1 ? " gefilterter Eintrag wurde" : " gefilterte Einträge wurden") + " als JSON exportiert.");
  }

  function applyRecordJson() {
    let parsed;
    try {
      parsed = JSON.parse(jsonEditor.value);
    } catch (error) {
      setText(jsonStatus, "JSON-Fehler: " + error.message);
      jsonStatus.className = "json-status is-invalid";
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setText(jsonStatus, "Der Eintrag muss ein JSON-Objekt sein.");
      jsonStatus.className = "json-status is-invalid";
      return;
    }
    records[selectedIndex] = parsed;
    rebuildProblemCache();
    renderTable();
    setText(jsonStatus, "Änderungen übernommen");
    jsonStatus.className = "json-status is-valid";
    sendRecordsUpdate();
  }

  function receiveParentMessage(event) {
    if (event.source !== window.opener) return;
    if (window.location.protocol !== "file:" && event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message || message.channel !== channel) return;
    if (message.type === "prokat-records-append") {
      if (!validRecordArray(message.records) || !message.records.length ||
          !validWarnings(message.warnings) || message.warnings.some(function (warning) {
            return Number(warning.record) > message.records.length;
          })) {
        setText(connectionStatus, "Die ergänzten Datensätze haben ein ungültiges Format.");
        connectionStatus.classList.add("is-error");
        return;
      }
      const firstAddedIndex = records.length;
      records = records.concat(message.records);
      sourceWarnings = sourceWarnings.concat(message.warnings.map(function (warning) {
        return Object.assign({}, warning, { record: Number(warning.record) + firstAddedIndex });
      }));
      sourceName = safeFileName(message.sourceName);
      selectedIndex = firstAddedIndex;
      searchInput.value = "";
      issueFilter.value = "all";
      renderAll();
      setText(recordsNotice, message.records.length + (message.records.length === 1
        ? " Datensatz aus dem TUSTEP-Konverter hinzugefügt."
        : " Datensätze aus dem TUSTEP-Konverter hinzugefügt."));
      sendRecordsUpdate();
      return;
    }
    if (message.type !== "prokat-records-init") return;
    if (!validRecordArray(message.records) || !validWarnings(message.warnings)) {
      setText(connectionStatus, "Die übermittelten Daten haben ein ungültiges Format.");
      connectionStatus.classList.add("is-error");
      return;
    }
    records = message.records;
    sourceWarnings = message.warnings.filter(function (warning) {
      return warning && Number.isInteger(Number(warning.record)) && typeof warning.message === "string";
    });
    sourceName = safeFileName(message.sourceName);
    selectedIndex = records.length ? 0 : -1;
    recordsNotice.textContent = "";
    renderAll();
  }

  searchInput.addEventListener("input", renderTable);
  issueFilter.addEventListener("change", renderTable);
  exportButton.addEventListener("click", exportVisibleRecords);
  importJsonButton.addEventListener("click", function () { importJsonInput.click(); });
  importJsonInput.addEventListener("change", function () { importJsonFile(importJsonInput.files[0]); });
  applyJsonButton.addEventListener("click", applyRecordJson);
  jsonEditor.addEventListener("input", function () {
    try {
      const parsed = JSON.parse(jsonEditor.value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Ein Datensatz muss ein JSON-Objekt sein.");
      setText(jsonStatus, "JSON gültig · Änderungen noch nicht übernommen");
      jsonStatus.className = "json-status is-valid";
    } catch (error) {
      setText(jsonStatus, error.message);
      jsonStatus.className = "json-status is-invalid";
    }
  });
  document.getElementById("close-window").addEventListener("click", function () {
    if (window.opener) window.close();
    else window.location.href = "./index.html";
  });
  window.addEventListener("message", receiveParentMessage);

  if (window.opener && channel) {
    window.opener.postMessage({ type: "prokat-records-ready", channel: channel }, messageTargetOrigin());
  } else {
    connectionStatus.classList.add("is-error");
    setText(connectionStatus, "Öffne diese Übersicht über den TUSTEP-Konverter.");
    recordsNotice.textContent = "Diese Seite erhält ihre Datensätze beim Öffnen aus dem Konverter. Lade dort eine TXT-Datei und erzeuge die Vorschau.";
  }
})();
