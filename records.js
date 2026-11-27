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
    missingPit: document.getElementById("stat-missing-pit"),
    import: document.getElementById("stat-import"),
    format: document.getElementById("stat-format")
  };

  const editableFields = [
    { label: "PK-Kennung", path: ["(0) PK"] },
    { label: "Geschlecht", path: ["(011) Geschlecht"] },
    { label: "PIT", path: ["(1) Name", "PIT"] },
    { label: "Nachname", path: ["(1) Name", "Nachname"] },
    { label: "Vorname", path: ["(1) Name", "Vorname"] },
    { label: "Unaufgeteilter Name", path: ["(1) Name", "Unaufgeteilter Name"] },
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
    { title: "Namensvarianten", keys: ["(1*) Namensvarianten"] },
    { title: "Universität und Fach", keys: ["(012) Uni-Angehörigkeit", "(2+3) Fakultätszugehörigkeit", "(4) Lehrfach", "(5) Konfession"] },
    { title: "Familie", keys: ["(8+9) Eltern", "(10) Ehepartner", "(10a) Kinder"] },
    { title: "Werdegang und Ämter", keys: ["(11) Bildungsgang", "(12) Berufslaufbahn", "(13) Akademische-Ämter", "(14) Titel", "(15) Mitgliedschaft Wissenschaft", "(15a) Mitgliedschaft Studium"] },
    { title: "Quellen und Nachweise", keys: ["(17) Archivalische-Quellen", "(18) Literatur", "(18a) Online-Quellen", "(19) Bildnachweise", "(20) Bemerkungen", "(21) Bearbeiter", "(23) BIB", "(24) GND"] }
  ];
  const editableFieldPaths = new Set(editableFields.map(function (field) {
    return JSON.stringify(field.path);
  }));
  const emptyArrayItemTemplates = {
    "(1*) Namensvarianten": { PIT: "", Nachname: "", Vorname: "", Geburtsjahr: "", Sterbejahr: "" },
    "(2+3) Fakultätszugehörigkeit": { Anfangsjahr: "", Endjahr: "", Fakultät: "" },
    "(10) Ehepartner": { Eheschließung: "", Name: "", Vater: "", Bemerkung: "" }
  };
  const pendingArrayDrafts = new WeakMap();

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

  function setRecordsNotice(message) {
    const unassignedWarnings = sourceWarnings.filter(function (warning) {
      return Number(warning.record) === 0;
    });
    const warningDetails = unassignedWarnings.slice(0, 5).map(function (warning) {
      return (warning.line ? "Quellzeile " + warning.line + ": " : "") + warning.message;
    });
    if (unassignedWarnings.length > warningDetails.length) {
      warningDetails.push((unassignedWarnings.length - warningDetails.length) + " weitere Quellhinweise.");
    }
    const parts = [message];
    if (warningDetails.length) parts.push("Nicht zugeordnete Importhinweise: " + warningDetails.join(" "));
    setText(recordsNotice, parts.filter(Boolean).join(" "));
  }

  function fullName(record) {
    const name = record["(1) Name"] || {};
    return [name.Vorname, name.Nachname].filter(Boolean).join(" ") || name["Unaufgeteilter Name"] || "Name fehlt";
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
      .filter(function (warning) {
        return Number(warning.record) === index + 1 &&
          !/Namensfeld ohne PIT-Kennung/i.test(warning.message);
      })
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

    const name = record["(1) Name"] || {};
    if (name.PIT == null || String(name.PIT).trim() === "") {
      problems.push({
        category: "identity",
        message: "PIT fehlt. Trage nur eine PIT aus einer verlässlichen Quelle ein; die Übersicht ergänzt keine Kennung.",
        path: ["(1) Name", "PIT"]
      });
    }

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
      if (filter === "missing-pit" && !problems.some(function (problem) { return problem.category === "identity"; })) return false;
      if (filter === "import" && !problems.some(function (problem) { return problem.category === "import"; })) return false;
      if (filter === "format" && !problems.some(function (problem) { return problem.category === "format"; })) return false;
      return !query || JSON.stringify(record).toLocaleLowerCase().includes(query);
    });
  }

  function updateStatistics() {
    let affected = 0;
    let missingPitCount = 0;
    let importCount = 0;
    let formatCount = 0;
    problemCache.forEach(function (problems) {
      if (problems.length) affected += 1;
      if (problems.some(function (problem) { return problem.category === "identity"; })) missingPitCount += 1;
      problems.forEach(function (problem) {
        if (problem.category === "import") importCount += 1;
        else if (problem.category === "format") formatCount += 1;
      });
    });
    importCount += sourceWarnings.filter(function (warning) {
      return Number(warning.record) === 0;
    }).length;
    setText(stats.total, records.length);
    setText(stats.affected, affected);
    setText(stats.missingPit, missingPitCount);
    setText(stats.import, importCount);
    setText(stats.format, formatCount);
  }

  function makeCell(text, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = text || "–";
    return cell;
  }

  function renderTable(preserveDetail) {
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
    setRecordsNotice(records.length
      ? visibleIndices.length + " von " + records.length + " Einträgen werden angezeigt" + filterText + "."
      : "Noch keine Datensätze erhalten. Öffne die Übersicht über den Konverter nach dem Erzeugen einer Vorschau.");
    if (!preserveDetail) renderDetail();
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

  function refreshEditedRecord(record) {
    const recordIndex = records.indexOf(record);
    if (recordIndex < 0) return;
    rebuildProblemCache();
    renderTable(true);
    if (selectedIndex !== recordIndex) {
      renderDetail();
      updateStatistics();
      sendRecordsUpdate();
      return;
    }

    const name = record["(1) Name"] || {};
    const life = record["(6+7) Lebensdaten"] || {};
    const gender = String(record["(011) Geschlecht"] || "").toLocaleLowerCase();
    const problems = problemCache[recordIndex] || [];
    setText(detailHeading, fullName(record));
    setText(detailPit, "PIT " + (name.PIT || "–"));
    setText(detailYears, [name.Geburtsjahr || "?", name.Sterbejahr || "?"].join("–"));
    detailYears.title = [life.Geburtsdatum, life.Geburtsort, life.Sterbedatum, life.Sterbeort].filter(Boolean).join(" · ");
    detailIssueBadge.hidden = !problems.length;
    detailIssueBadge.className = "issue-badge" + (problems.length ? " has-issue" : "");
    setText(detailIssueBadge, problems.length ? problems.length + " Hinweis" + (problems.length === 1 ? "" : "e") : "");
    dummyPhoto.classList.toggle("gender-male", gender === "männlich" || gender === "m");
    dummyPhoto.classList.toggle("gender-female", gender === "weiblich" || gender === "w");
    setText(photoCaption, "Dummy-Foto · " + (record["(011) Geschlecht"] || "keine Angabe"));
    renderIssues(problems);
    Array.from(detailView.querySelectorAll("[data-path]")).forEach(function (control) {
      const path = JSON.parse(control.dataset.path);
      const field = control.closest(".form-field");
      const hasIssue = hasPathProblem(problems, path);
      field.classList.toggle("field-has-issue", hasIssue);
      if (hasInvalidPathProblem(problems, path)) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    });
    jsonEditor.value = JSON.stringify(record, null, 2);
    setText(jsonStatus, "JSON nicht geändert");
    jsonStatus.className = "json-status";
    updateStatistics();
    sendRecordsUpdate();
  }

  function hasPathProblem(problems, path) {
    return problems.some(function (problem) {
      return problem.path && problem.path.length === path.length &&
        problem.path.every(function (segment, index) { return segment === path[index]; });
    });
  }

  function hasInvalidPathProblem(problems, path) {
    return problems.some(function (problem) {
      return problem.category !== "identity" && problem.path &&
        problem.path.length === path.length &&
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
        if (hasInvalidPathProblem(problems, field.path)) control.setAttribute("aria-invalid", "true");
      }
      control.addEventListener("input", function () {
        setPathValue(record, field.path, control.value);
        refreshEditedRecord(record);
      });
      label.append(caption, control);
      formFields.append(label);
    });
  }

  function getArrayDrafts(record) {
    let drafts = pendingArrayDrafts.get(record);
    if (!drafts) {
      drafts = new Map();
      pendingArrayDrafts.set(record, drafts);
    }
    return drafts;
  }

  function hasEnteredValue(value) {
    if (value == null) return false;
    if (typeof value === "string") return Boolean(value.trim());
    if (Array.isArray(value)) return value.some(hasEnteredValue);
    if (typeof value === "object") return Object.keys(value).some(function (key) {
      return hasEnteredValue(value[key]);
    });
    return true;
  }

  function updateArray(record, path, index) {
    const values = pathValue(record, path);
    values.splice(index, 1);
    rebuildProblemCache();
    renderTable();
    sendRecordsUpdate();
  }

  function startArrayDraft(record, path, values) {
    const drafts = getArrayDrafts(record);
    const key = JSON.stringify(path);
    if (drafts.has(key)) return;
    const template = emptyArrayItemTemplates[path[0]];
    const value = values.length ? emptyValueLike(values[0]) : template ? emptyValueLike(template) : "";
    drafts.set(key, { value: value, changed: false });
    renderDetail();
  }

  function finishArrayDraft(record, path, commit) {
    const drafts = getArrayDrafts(record);
    const key = JSON.stringify(path);
    const draft = drafts.get(key);
    if (!draft) return;
    if (commit) {
      if (!draft.changed || !hasEnteredValue(draft.value)) return;
      pathValue(record, path).push(cleanDraftValue(draft.value));
    }
    drafts.delete(key);
    if (commit) {
      rebuildProblemCache();
      renderTable();
      sendRecordsUpdate();
    } else {
      renderDetail();
    }
  }

  function emptyValueLike(value) {
    if (Array.isArray(value)) return [];
    if (value && typeof value === "object") {
      return Object.keys(value).reduce(function (result, key) {
        result[key] = emptyValueLike(value[key]);
        return result;
      }, {});
    }
    return "";
  }

  function cleanDraftValue(value) {
    if (Array.isArray(value)) {
      return value.filter(hasEnteredValue).map(cleanDraftValue);
    }
    if (value && typeof value === "object") {
      return Object.keys(value).reduce(function (result, key) {
        const cleaned = cleanDraftValue(value[key]);
        if (hasEnteredValue(cleaned)) result[key] = cleaned;
        return result;
      }, {});
    }
    return value;
  }

  function updateDraftArray(draftContext, path, operation, index) {
    const values = path.length ? pathValue(draftContext.draft.value, path) : draftContext.draft.value;
    if (operation === "add") {
      values.push(values.length ? emptyValueLike(values[0]) : "");
    } else {
      values.splice(index, 1);
    }
    draftContext.draft.changed = true;
    draftContext.refresh();
  }

  function renderPrimitiveEditor(container, label, value, path, record, problems, draftContext) {
    if (editableFieldPaths.has(JSON.stringify(path))) return false;
    const field = document.createElement("label");
    field.className = "form-field is-wide";
    const caption = document.createElement("span");
    caption.className = "field-label";
    caption.textContent = label;
    const booleanValue = typeof value === "boolean";
    const multiline = typeof value === "string" && (value.length > 100 || value.includes("\n"));
    const control = document.createElement(booleanValue ? "select" : multiline ? "textarea" : "input");
    if (booleanValue) {
      ["true", "false"].forEach(function (optionValue) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue === "true" ? "Ja" : "Nein";
        control.append(option);
      });
    } else if (!multiline) {
      control.type = typeof value === "number" ? "number" : "text";
      if (typeof value === "number") control.step = "any";
    }
    control.value = value == null ? "" : String(value);
    control.dataset.path = JSON.stringify(path);
    if (hasPathProblem(problems, path)) {
      field.classList.add("field-has-issue");
      control.setAttribute("aria-invalid", "true");
    }
    const updateValue = function () {
      const updatedValue = booleanValue
        ? control.value === "true"
        : typeof value === "number" && control.value !== "" ? Number(control.value) : control.value;
      if (draftContext) {
        if (path.length) setPathValue(draftContext.draft.value, path, updatedValue);
        else draftContext.draft.value = updatedValue;
        draftContext.draft.changed = true;
        draftContext.commitButton.disabled = !hasEnteredValue(draftContext.draft.value);
        return;
      }
      setPathValue(record, path, updatedValue);
      refreshEditedRecord(record);
    };
    control.addEventListener(booleanValue ? "change" : "input", updateValue);
    field.append(caption, control);
    container.append(field);
    return true;
  }

  function renderEditableNode(container, label, value, path, record, problems, draftContext) {
    if (Array.isArray(value)) {
      const draftKey = JSON.stringify(path);
      const draft = draftContext ? null : getArrayDrafts(record).get(draftKey);
      const group = document.createElement("div");
      group.className = "editable-collection is-wide";
      const heading = document.createElement("span");
      heading.className = "field-label";
      heading.textContent = label;
      group.append(heading);

      const entries = document.createElement("div");
      entries.className = "editable-array";
      value.forEach(function (item, index) {
        const row = document.createElement("div");
        row.className = "editable-array-item";
        const content = document.createElement("div");
        content.className = "editable-array-value";
        renderEditableNode(content, "Eintrag " + (index + 1), item, path.concat(index), record, problems, draftContext);
        const removeButton = document.createElement("button");
        removeButton.className = "button button-secondary array-action";
        removeButton.type = "button";
        removeButton.textContent = "Entfernen";
        removeButton.setAttribute("aria-label", label + ": Eintrag " + (index + 1) + " entfernen");
        removeButton.addEventListener("mousedown", function (event) { event.preventDefault(); });
        removeButton.addEventListener("click", function () {
          if (draftContext) updateDraftArray(draftContext, path.concat(index), "remove");
          else updateArray(record, path, index);
        });
        row.append(content, removeButton);
        entries.append(row);
      });
      if (!value.length && !draft) {
        const empty = document.createElement("span");
        empty.className = "empty-value";
        empty.textContent = "Keine Einträge";
        entries.append(empty);
      }
      if (draft) {
        const row = document.createElement("div");
        row.className = "editable-array-item is-draft";
        const content = document.createElement("div");
        content.className = "editable-array-value";
        const note = document.createElement("span");
        note.className = "empty-value draft-note";
        note.textContent = "Wird erst nach Eingabe und Übernahme gespeichert. Leere Angaben werden ausgelassen.";
        const actions = document.createElement("div");
        actions.className = "array-draft-actions";
        const commitButton = document.createElement("button");
        commitButton.className = "button button-primary array-action";
        commitButton.type = "button";
        commitButton.textContent = "Eintrag übernehmen";
        commitButton.disabled = !draft.changed || !hasEnteredValue(draft.value);
        commitButton.addEventListener("mousedown", function (event) { event.preventDefault(); });
        commitButton.addEventListener("click", function () {
          finishArrayDraft(record, path, true);
        });
        const cancelButton = document.createElement("button");
        cancelButton.className = "button button-secondary array-action";
        cancelButton.type = "button";
        cancelButton.textContent = "Verwerfen";
        cancelButton.addEventListener("mousedown", function (event) { event.preventDefault(); });
        cancelButton.addEventListener("click", function () {
          finishArrayDraft(record, path, false);
        });
        const context = {
          draft: draft,
          commitButton: commitButton,
          refresh: function () { renderDetail(); }
        };
        renderEditableNode(content, "Neuer Eintrag", draft.value, [], record, problems, context);
        actions.append(commitButton, cancelButton);
        content.append(note);
        row.append(content, actions);
        entries.append(row);
      }
      const addButton = document.createElement("button");
      addButton.className = "button button-secondary array-action";
      addButton.type = "button";
      addButton.textContent = draft ? "Eintrag in Bearbeitung" : "Eintrag hinzufügen";
      addButton.disabled = Boolean(draft);
      addButton.addEventListener("mousedown", function (event) { event.preventDefault(); });
      addButton.addEventListener("click", function () {
        if (draftContext) updateDraftArray(draftContext, path, "add");
        else startArrayDraft(record, path, value);
      });
      group.append(entries, addButton);
      container.append(group);
      return true;
    }

    if (value && typeof value === "object") {
      const group = document.createElement("div");
      group.className = "editable-object is-wide";
      const heading = document.createElement("span");
      heading.className = "field-label";
      heading.textContent = label;
      const fields = document.createElement("div");
      fields.className = "editable-object-fields";
      let rendered = 0;
      Object.keys(value).forEach(function (key) {
        if (renderEditableNode(fields, key, value[key], path.concat(key), record, problems, draftContext)) rendered += 1;
      });
      if (!rendered) return false;
      group.append(heading, fields);
      container.append(group);
      return true;
    }

    return renderPrimitiveEditor(container, label, value, path, record, problems, draftContext);
  }

  function renderAdditional(record) {
    additionalSections.replaceChildren();
    const problems = problemCache[selectedIndex] || [];
    const groupedKeys = new Set();
    displayGroups.forEach(function (group) {
      const section = document.createElement("section");
      section.className = "detail-block";
      const heading = document.createElement("h3");
      heading.textContent = group.title;
      const fields = document.createElement("div");
      fields.className = "editable-section-fields";
      group.keys.forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) return;
        if (renderEditableNode(fields, key, record[key], [key], record, problems)) groupedKeys.add(key);
      });
      if (fields.childElementCount) {
        section.append(heading, fields);
        additionalSections.append(section);
      }
    });

    const knownGroupKeys = new Set(displayGroups.reduce(function (keys, group) {
      return keys.concat(group.keys);
    }, []));
    const otherFields = document.createElement("div");
    otherFields.className = "editable-section-fields";
    Object.keys(record).forEach(function (key) {
      if (knownGroupKeys.has(key) || groupedKeys.has(key)) return;
      renderEditableNode(otherFields, key, record[key], [key], record, problems);
    });
    if (otherFields.childElementCount) {
      const section = document.createElement("section");
      section.className = "detail-block";
      const heading = document.createElement("h3");
      heading.textContent = "Weitere Angaben";
      section.append(heading, otherFields);
      additionalSections.append(section);
    }
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
      item.className = "problem-" + problem.category;
      const type = document.createElement("strong");
      const labels = { import: "Importproblem", format: "Formatproblem", identity: "Kennungshinweis" };
      type.textContent = (labels[problem.category] || "Hinweis") + " · ";
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
      const recordNumber = Number(warning && warning.record);
      return warning && Number.isInteger(recordNumber) && recordNumber >= 0 &&
        (warning.line == null || (Number.isInteger(Number(warning.line)) && Number(warning.line) > 0)) &&
        typeof warning.message === "string";
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
      setRecordsNotice(incoming.length + (incoming.length === 1
        ? " Datensatz aus " + file.name + " hinzugefügt."
        : " Datensätze aus " + file.name + " hinzugefügt."));
      sendRecordsUpdate();
    } catch (error) {
      setRecordsNotice("JSON-Datei konnte nicht hinzugefügt werden: " + error.message);
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
    setRecordsNotice(visibleRecords.length + (visibleRecords.length === 1 ? " gefilterter Eintrag wurde" : " gefilterte Einträge wurden") + " als JSON exportiert.");
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
        const recordNumber = Number(warning.record);
        return Object.assign({}, warning, {
          record: recordNumber > 0 ? recordNumber + firstAddedIndex : 0
        });
      }));
      sourceName = safeFileName(message.sourceName);
      selectedIndex = firstAddedIndex;
      searchInput.value = "";
      issueFilter.value = "all";
      renderAll();
      setRecordsNotice(message.records.length + (message.records.length === 1
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
