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
  const portraitImage = document.getElementById("portrait-image");
  const portraitPlaceholder = document.getElementById("portrait-placeholder");
  const portraitFileInput = document.getElementById("portrait-file-input");
  const choosePortraitButton = document.getElementById("choose-portrait");
  const removePortraitButton = document.getElementById("remove-portrait");
  const portraitStatus = document.getElementById("portrait-status");
  const recordIssues = document.getElementById("record-issues");
  const formFields = document.getElementById("form-fields");
  const additionalSections = document.getElementById("additional-sections");
  const jsonEditor = document.getElementById("record-json-editor");
  const jsonStatus = document.getElementById("record-json-status");
  const applyJsonButton = document.getElementById("apply-json");
  const createMapButton = document.getElementById("create-map");
  const createPersonMapButton = document.getElementById("create-person-map");
  const showFamilyGraphButton = document.getElementById("show-family-graph");
  const mapDialog = document.getElementById("map-dialog");
  const mapTitle = document.getElementById("map-title");
  const mapStatus = document.getElementById("map-status");
  const mapElement = document.getElementById("places-map");
  const mapUnresolved = document.getElementById("map-unresolved");
  const closeMapButton = document.getElementById("close-map");
  const familyDialog = document.getElementById("family-dialog");
  const familyTitle = document.getElementById("family-title");
  const familyStatus = document.getElementById("family-status");
  const familyGraph = document.getElementById("family-graph");
  const closeFamilyButton = document.getElementById("close-family");
  const openAnalyticsButton = document.getElementById("open-analytics");
  const analyticsDialog = document.getElementById("analytics-dialog");
  const closeAnalyticsButton = document.getElementById("close-analytics");
  const analyticsSummary = document.getElementById("analytics-summary");
  const completenessChart = document.getElementById("completeness-chart");
  const birthDecadeChart = document.getElementById("birth-decade-chart");
  const facultyDistributionChart = document.getElementById("faculty-distribution-chart");
  const timelinePersonSelect = document.getElementById("timeline-person-select");
  const personTimeline = document.getElementById("person-timeline");
  const timelineUndated = document.getElementById("timeline-undated");
  const genderPositionSelect = document.getElementById("gender-position-select");
  const genderPositionChart = document.getElementById("gender-position-chart");
  const genderFacultySelect = document.getElementById("gender-faculty-select");
  const genderFacultyChart = document.getElementById("gender-faculty-chart");
  const facultyNetworkSelect = document.getElementById("faculty-network-select");
  const facultyNetwork = document.getElementById("faculty-network");
  const digitalResourceList = document.getElementById("digital-resource-list");
  const digitalLinkTitle = document.getElementById("digital-link-title");
  const digitalLinkUrl = document.getElementById("digital-link-url");
  const addDigitalLinkButton = document.getElementById("add-digital-link");
  const chooseDigitalFilesButton = document.getElementById("choose-digital-files");
  const digitalFileInput = document.getElementById("digital-file-input");
  const digitalResourceStatus = document.getElementById("digital-resource-status");
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
  const positionRules = [
    { label: "Prorektor", pattern: /\bProrektor(?:in)?\b/i },
    { label: "Rektor", pattern: /\bRektor(?:in)?\b/i },
    { label: "Professor", pattern: /\b(?:(?:o|ao|apl)\.\s*)?Prof(?:essor(?:in)?)(?:\.|(?=\s|$))|\b(?:(?:o|ao|apl)\.\s*)?Prof(?=\.|\b)|\b(?:Universitäts|Gymnasial)professor(?:in)?\b/i },
    { label: "Privatdozent", pattern: /\b(?:PDoz(?=\.|\b)|Privatdozent(?:in)?\b)/i },
    { label: "Dozent", pattern: /\b(?:Diätendoz(?=\.|\b)|Dozent(?:in)?\b)/i },
    { label: "Wissenschaftliche Assistenz", pattern: /\bWiss\.\s*Ass\.?\b/i },
    { label: "Wissenschaftlicher Rat", pattern: /\bWiss\.\s*(?:Rat|Rätin)\b/i },
    { label: "Dekan", pattern: /\bDekan(?:in)?\b/i },
    { label: "Direktor", pattern: /\bDirektor(?:in)?\b/i },
    { label: "Leitung", pattern: /\bLeiter(?:in)?\b/i },
    { label: "Generalsuperintendent", pattern: /\bGeneralsuperintendent(?:in)?\b/i },
    { label: "Superintendent", pattern: /\bSuperintendent(?:in)?\b/i },
    { label: "Prälat", pattern: /\bPrälat(?:in)?\b/i },
    { label: "Pädagogarch", pattern: /\bPädagogarch(?:in)?\b/i },
    { label: "Repetent", pattern: /\bRepetent(?:in)?\b/i },
    { label: "Vikar", pattern: /\bVikar(?:in)?\b/i },
    { label: "Priester", pattern: /\bPriester\b/i },
    { label: "Pfarrer", pattern: /\b(?:Stadt)?pfarrer(?:in)?\b/i },
    { label: "Diakon", pattern: /\bDiakon(?:in)?\b/i },
    { label: "Lehrkraft", pattern: /\bLehrer(?:in)?\b/i },
    { label: "Förster", pattern: /\b(?:(?:Revier|Ober)?förster)(?:in)?\b/i },
    { label: "Feldjäger", pattern: /\bFeldjäger\b/i },
    { label: "Reinigungskraft", pattern: /\bReinigungskraft\b/i },
    { label: "Bibliothekar", pattern: /\bBibliothekar(?:in)?\b/i },
    { label: "Archivar", pattern: /\bArchivar(?:in)?\b/i },
    { label: "Stadtschreiber", pattern: /\bStadtschreiber(?:in)?\b/i },
    { label: "Oberamtmann", pattern: /\bOberamtmann\b/i },
    { label: "Kanzler", pattern: /\bKanzler(?:in)?\b/i }
  ];
  const editableFieldPaths = new Set(editableFields.map(function (field) {
    return JSON.stringify(field.path);
  }));
  const digitalResourceKey = "Digitale Ressourcen";
  const portraitMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/bmp"]);
  const portraitExtensions = {
    bmp: "image/bmp",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    avif: "image/avif",
    webp: "image/webp"
  };
  let displayedPortraitRecord = null;
  let displayedPortraitResource = null;
  let portraitObjectUrl = "";
  const appManagedFields = new Set([digitalResourceKey]);
  const emptyArrayItemTemplates = {
    "(1*) Namensvarianten": { PIT: "", Nachname: "", Vorname: "", Geburtsjahr: "", Sterbejahr: "" },
    "(2+3) Fakultätszugehörigkeit": { Anfangsjahr: "", Endjahr: "", Fakultät: "" },
    "(10) Ehepartner": { Eheschließung: "", Name: "", Vater: "", Bemerkung: "" }
  };
  const pendingArrayDrafts = new WeakMap();
  const geocodeCacheKey = "prokat-map-geocode-cache-v1";

  let records = [];
  let sourceWarnings = [];
  let sourceName = "prokat";
  let problemCache = [];
  let visibleIndices = [];
  let selectedIndex = -1;
  let notifyTimer = null;
  let leafletLoadPromise = null;
  let placeMap = null;
  let placeLayer = null;
  let mapRequestController = null;
  let mapGeneration = 0;
  let lastGeocodeRequest = 0;
  let geocodeCache = new Map();
  let geocodeCacheLoaded = false;
  let geocodeCacheWritable = true;
  let geocodeCacheNotice = "";

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

  function normalizeFamilyName(value) {
    return String(value || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("de")
      .replace(/[.,;:()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function addFamilyNameKey(keys, value) {
    const key = normalizeFamilyName(value);
    if (key) keys.add(key);
  }

  function recordFamilyNameKeys(record) {
    const keys = new Set();
    const name = record["(1) Name"] || {};
    const first = name.Vorname || "";
    const last = name.Nachname || "";
    [fullName(record), name["Unaufgeteilter Name"], first + " " + last, last + " " + first, last + ", " + first]
      .forEach(function (value) { addFamilyNameKey(keys, value); });
    const variants = record["(1*) Namensvarianten"];
    if (Array.isArray(variants)) {
      variants.forEach(function (variant) {
        if (!variant || typeof variant !== "object") return;
        const variantFirst = variant.Vorname || "";
        const variantLast = variant.Nachname || "";
        [
          variant["Unaufgeteilter Name"],
          variantFirst + " " + variantLast,
          variantLast + " " + variantFirst,
          variantLast + ", " + variantFirst
        ].forEach(function (value) { addFamilyNameKey(keys, value); });
      });
    }
    return keys;
  }

  function relationshipNameKeys(value) {
    const text = String(value || "").trim();
    const keys = new Set();
    addFamilyNameKey(keys, text);
    const commaIndex = text.indexOf(",");
    if (commaIndex > 0) addFamilyNameKey(keys, text.slice(0, commaIndex));
    return keys;
  }

  function findFamilyRecordMatches(value, currentIndex) {
    const relationKeys = relationshipNameKeys(value);
    if (!relationKeys.size) return [];
    return records.map(function (record, index) {
      if (index === currentIndex) return -1;
      const names = recordFamilyNameKeys(record);
      return Array.from(relationKeys).some(function (key) { return names.has(key); }) ? index : -1;
    }).filter(function (index) { return index >= 0; });
  }

  function familyRelationGroups(record) {
    const parents = record["(8+9) Eltern"] || {};
    const parentRelations = ["Vater", "Mutter"].map(function (role) {
      return { role: role, name: parents[role], detail: "" };
    }).filter(function (relation) { return typeof relation.name === "string" && relation.name.trim(); });

    const spouseValue = record["(10) Ehepartner"];
    const spouses = Array.isArray(spouseValue) ? spouseValue : spouseValue ? [spouseValue] : [];
    const spouseRelations = spouses.map(function (spouse) {
      if (typeof spouse === "string") return { role: "Ehepartner", name: spouse, detail: "" };
      if (!spouse || typeof spouse !== "object") return null;
      return {
        role: "Ehepartner",
        name: spouse.Name || "",
        detail: spouse.Eheschließung ? "Eheschließung: " + spouse.Eheschließung : ""
      };
    }).filter(function (relation) { return relation && relation.name.trim(); });

    const childValue = record["(10a) Kinder"];
    const children = Array.isArray(childValue) ? childValue : childValue ? [childValue] : [];
    const childRelations = children.map(function (child) {
      if (typeof child === "string") return { role: "Kind", name: child, detail: "" };
      if (!child || typeof child !== "object") return null;
      const childName = child.Name || [child.Vorname, child.Nachname].filter(Boolean).join(" ");
      return childName ? { role: "Kind", name: childName, detail: "" } : null;
    }).filter(Boolean);

    return [
      { title: "Eltern", relations: parentRelations },
      { title: "Ehepartner", relations: spouseRelations },
      { title: "Kinder", relations: childRelations }
    ];
  }

  function familyCandidateLabel(index) {
    const record = records[index];
    const pit = record && record["(1) Name"] && record["(1) Name"].PIT;
    return fullName(record) + (pit ? " · PIT " + pit : "");
  }

  function navigateToFamilyRecord(index) {
    if (!records[index]) return;
    searchInput.value = "";
    issueFilter.value = "all";
    selectedIndex = index;
    renderTable();
    renderFamilyGraph(index);
    const rowPosition = visibleIndices.indexOf(index);
    if (rowPosition >= 0 && recordsBody.children[rowPosition]) {
      recordsBody.children[rowPosition].scrollIntoView({ block: "nearest" });
    }
  }

  function renderFamilyRelation(relation, currentIndex) {
    const card = document.createElement("article");
    card.className = "family-relation";
    const role = document.createElement("span");
    role.className = "family-relation-role";
    role.textContent = relation.role;
    const name = document.createElement("strong");
    name.className = "family-relation-name";
    name.textContent = relation.name;
    card.append(role, name);
    if (relation.detail) {
      const detail = document.createElement("p");
      detail.className = "family-relation-detail";
      detail.textContent = relation.detail;
      card.append(detail);
    }

    const matches = findFamilyRecordMatches(relation.name, currentIndex);
    if (matches.length === 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button button-secondary family-open-button";
      button.textContent = "Eintrag öffnen · " + familyCandidateLabel(matches[0]);
      button.addEventListener("click", function () { navigateToFamilyRecord(matches[0]); });
      card.append(button);
    } else if (matches.length > 1) {
      const prompt = document.createElement("p");
      prompt.className = "family-relation-detail";
      prompt.textContent = "Mehrere passende Einträge; wähle den richtigen aus.";
      const select = document.createElement("select");
      select.className = "family-candidate-select";
      select.setAttribute("aria-label", "Passenden Datensatz für " + relation.role + " auswählen");
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Datensatz auswählen …";
      select.append(placeholder);
      matches.forEach(function (index) {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = familyCandidateLabel(index);
        select.append(option);
      });
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button button-secondary family-open-button";
      button.textContent = "Ausgewählten Datensatz öffnen";
      button.disabled = true;
      select.addEventListener("change", function () { button.disabled = select.value === ""; });
      button.addEventListener("click", function () {
        if (select.value !== "") navigateToFamilyRecord(Number(select.value));
      });
      card.append(prompt, select, button);
    } else {
      const note = document.createElement("p");
      note.className = "family-relation-detail";
      note.textContent = "Kein eindeutiger Namens-Treffer in den geladenen Datensätzen; die Quellangabe bleibt unverknüpft.";
      card.append(note);
    }
    return card;
  }

  function renderFamilyGraph(recordIndex) {
    const record = records[recordIndex];
    if (!record) return;
    familyTitle.textContent = "Verwandtschaft von " + fullName(record);
    familyGraph.replaceChildren();

    const root = document.createElement("article");
    root.className = "family-node family-root-node";
    const rootLabel = document.createElement("span");
    rootLabel.className = "family-relation-role";
    rootLabel.textContent = "Ausgewählte Person";
    const rootName = document.createElement("strong");
    rootName.className = "family-relation-name";
    rootName.textContent = fullName(record);
    root.append(rootLabel, rootName);
    const pit = record["(1) Name"] && record["(1) Name"].PIT;
    if (pit) {
      const rootPit = document.createElement("span");
      rootPit.className = "family-relation-detail";
      rootPit.textContent = "PIT " + pit;
      root.append(rootPit);
    }
    familyGraph.append(root);

    const groups = familyRelationGroups(record);
    const groupContainer = document.createElement("div");
    groupContainer.className = "family-relations";
    let relationCount = 0;
    groups.forEach(function (group) {
      const section = document.createElement("section");
      section.className = "family-group";
      const heading = document.createElement("h3");
      heading.textContent = group.title;
      const cards = document.createElement("div");
      cards.className = "family-relation-list";
      if (!group.relations.length) {
        const empty = document.createElement("p");
        empty.className = "family-empty";
        empty.textContent = "Keine Angabe im Datensatz.";
        cards.append(empty);
      }
      group.relations.forEach(function (relation) {
        relationCount += 1;
        cards.append(renderFamilyRelation(relation, recordIndex));
      });
      section.append(heading, cards);
      groupContainer.append(section);
    });
    familyGraph.append(groupContainer);
    familyStatus.textContent = relationCount
      ? relationCount + " Beziehungsangaben aus dem ausgewählten Datensatz. Nicht geladene oder nicht eindeutig passende Personen bleiben unverknüpft."
      : "Für diese Person sind keine Eltern-, Ehepartner- oder Kinderangaben im Datensatz vorhanden.";
  }

  function openFamilyGraph() {
    if (selectedIndex < 0 || !records[selectedIndex]) return;
    renderFamilyGraph(selectedIndex);
    familyDialog.showModal();
  }

  function analysisText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function hasAnalysisValue(value) {
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return Number.isFinite(value);
    if (Array.isArray(value)) return value.some(hasAnalysisValue);
    if (value && typeof value === "object") return Object.keys(value).some(function (key) {
      return hasAnalysisValue(value[key]);
    });
    return false;
  }

  function exactYear(value) {
    const text = analysisText(value);
    if (!/^\d{3,4}$/.test(text)) return null;
    const year = Number(text);
    return year > 0 ? year : null;
  }

  function leadingYearRange(value) {
    const text = analysisText(value);
    const match = text.match(/^(\d{3,4})(?:\s*[-–/]\s*(\d{2,4}))?/);
    if (!match) return null;
    const start = Number(match[1]);
    if (!start) return null;
    let end = start;
    if (match[2]) {
      const endText = match[2];
      end = Number(endText);
      if (endText.length === 2) {
        end = Math.floor(start / 100) * 100 + end;
        if (end < start) end += 100;
      }
      if (end < start) return null;
    }
    return { start: start, end: end };
  }

  function decadesForRange(range) {
    if (!range || range.end - range.start > 500) return [];
    const first = Math.floor(range.start / 10) * 10;
    const last = Math.floor(range.end / 10) * 10;
    const decades = [];
    for (let decade = first; decade <= last; decade += 10) decades.push(decade);
    return decades;
  }

  function formatYearRange(range) {
    return range.start === range.end ? String(range.start) : range.start + "–" + range.end;
  }

  function recordGender(record) {
    const value = analysisText(record["(011) Geschlecht"]).toLocaleLowerCase("de");
    if (["m", "männlich", "mann", "male"].indexOf(value) !== -1) return "male";
    if (["w", "weiblich", "frau", "female"].indexOf(value) !== -1) return "female";
    return "unknown";
  }

  function getArrayField(record, key) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    return value == null ? [] : [value];
  }

  function facultyEntryName(entry) {
    if (typeof entry === "string") return entry.trim();
    return entry && typeof entry === "object" ? analysisText(entry.Fakultät) : "";
  }

  function collectFacultyData() {
    const assignments = [];
    const faculties = new Map();
    let undated = 0;
    let duplicateCount = 0;
    const assignmentKeys = new Set();
    records.forEach(function (record, recordIndex) {
      getArrayField(record, "(2+3) Fakultätszugehörigkeit").forEach(function (entry) {
        const name = facultyEntryName(entry);
        if (!name) return;
        if (!faculties.has(name)) faculties.set(name, { name: name, members: new Set() });
        faculties.get(name).members.add(recordIndex);
        if (!entry || typeof entry !== "object") {
          undated += 1;
          return;
        }
        const start = exactYear(entry.Anfangsjahr);
        const end = exactYear(entry.Endjahr);
        if (!start) {
          undated += 1;
          return;
        }
        const range = { start: start, end: end && end >= start ? end : start };
        decadesForRange(range).forEach(function (decade) {
          const key = recordIndex + "\u0000" + name + "\u0000" + decade;
          if (assignmentKeys.has(key)) {
            duplicateCount += 1;
            return;
          }
          assignmentKeys.add(key);
          assignments.push({
            recordIndex: recordIndex,
            label: name,
            decade: decade,
            gender: recordGender(record)
          });
        });
      });
    });
    return {
      assignments: assignments,
      faculties: Array.from(faculties.values()).sort(function (a, b) { return a.name.localeCompare(b.name, "de"); }),
      undated: undated,
      duplicateCount: duplicateCount
    };
  }

  function collectPositionData() {
    const assignments = [];
    const labels = new Set();
    const assignmentKeys = new Set();
    let unclassified = 0;
    let undated = 0;
    let duplicateCount = 0;
    records.forEach(function (record, recordIndex) {
      getArrayField(record, "(12) Berufslaufbahn").forEach(function (entry) {
        if (typeof entry !== "string" || !entry.trim()) return;
        const matchedLabels = positionRules.filter(function (rule) {
          return rule.pattern.test(entry);
        }).map(function (rule) { return rule.label; });
        if (!matchedLabels.length) {
          unclassified += 1;
          return;
        }
        const range = leadingYearRange(entry);
        if (!range) {
          undated += 1;
          return;
        }
        const decades = decadesForRange(range);
        if (!decades.length) {
          undated += 1;
          return;
        }
        matchedLabels.forEach(function (label) {
          labels.add(label);
          decades.forEach(function (decade) {
            const key = recordIndex + "\u0000" + label + "\u0000" + decade;
            if (assignmentKeys.has(key)) {
              duplicateCount += 1;
              return;
            }
            assignmentKeys.add(key);
            assignments.push({
              recordIndex: recordIndex,
              label: label,
              decade: decade,
              gender: recordGender(record)
            });
          });
        });
      });
    });
    return {
      assignments: assignments,
      labels: Array.from(labels).sort(function (a, b) { return a.localeCompare(b, "de"); }),
      unclassified: unclassified,
      undated: undated,
      duplicateCount: duplicateCount
    };
  }

  function populateSelect(select, options, placeholder, selectedValue) {
    select.replaceChildren();
    if (!options.length) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = placeholder;
      select.append(empty);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    options.forEach(function (optionData) {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.label;
      select.append(option);
    });
    if (options.some(function (optionData) { return optionData.value === selectedValue; })) {
      select.value = selectedValue;
    }
  }

  function renderEmptyAnalytics(target, message) {
    const empty = document.createElement("p");
    empty.className = "analytics-empty";
    empty.textContent = message;
    target.replaceChildren(empty);
  }

  function renderBarChart(target, items, emptyMessage) {
    target.replaceChildren();
    if (!items.length) {
      renderEmptyAnalytics(target, emptyMessage);
      return;
    }
    const max = Math.max.apply(null, items.map(function (item) { return item.count; }));
    items.forEach(function (item) {
      const row = document.createElement("div");
      row.className = "analytics-bar-row";
      const label = document.createElement("span");
      label.className = "analytics-bar-label";
      label.textContent = item.label;
      const track = document.createElement("span");
      track.className = "analytics-bar-track";
      track.setAttribute("aria-label", item.label + ": " + item.count);
      const fill = document.createElement("span");
      fill.className = "analytics-bar-fill";
      fill.style.width = (item.count / max * 100) + "%";
      track.append(fill);
      const count = document.createElement("span");
      count.className = "analytics-bar-value";
      count.textContent = String(item.count);
      row.append(label, track, count);
      target.append(row);
    });
  }

  function renderCompleteness() {
    const fields = [
      { label: "Geschlecht", get: function (record) { return record["(011) Geschlecht"]; } },
      { label: "Geburtsjahr", get: function (record) { return record["(1) Name"] && record["(1) Name"].Geburtsjahr; } },
      { label: "Sterbejahr", get: function (record) { return record["(1) Name"] && record["(1) Name"].Sterbejahr; } },
      { label: "Geburtsort", get: function (record) { return record["(6+7) Lebensdaten"] && record["(6+7) Lebensdaten"].Geburtsort; } },
      { label: "Sterbeort", get: function (record) { return record["(6+7) Lebensdaten"] && record["(6+7) Lebensdaten"].Sterbeort; } },
      { label: "Fakultätszugehörigkeit", get: function (record) {
        return getArrayField(record, "(2+3) Fakultätszugehörigkeit").map(facultyEntryName).filter(Boolean);
      } },
      { label: "Berufslaufbahn", get: function (record) { return record["(12) Berufslaufbahn"]; } },
      { label: "Bildungsgang", get: function (record) { return record["(11) Bildungsgang"]; } },
      { label: "Eltern, Ehepartner oder Kinder", get: function (record) { return [record["(8+9) Eltern"], record["(10) Ehepartner"], record["(10a) Kinder"]]; } },
      { label: "Quellen oder Nachweise", get: function (record) { return [record["(17) Archivalische-Quellen"], record["(18) Literatur"], record["(18a) Online-Quellen"], record["(24) GND"]]; } }
    ];
    const table = document.createElement("table");
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Datenfeld", "Datensätze mit Angabe", "Anteil"].forEach(function (text) {
      const cell = document.createElement("th");
      cell.textContent = text;
      headerRow.append(cell);
    });
    head.append(headerRow);
    const body = document.createElement("tbody");
    fields.forEach(function (field) {
      const count = records.filter(function (record) { return hasAnalysisValue(field.get(record)); }).length;
      const row = document.createElement("tr");
      const label = document.createElement("td");
      label.textContent = field.label;
      const countCell = document.createElement("td");
      countCell.textContent = count + " / " + records.length;
      const percent = document.createElement("td");
      percent.textContent = records.length ? Math.round(count / records.length * 100) + "%" : "0%";
      row.append(label, countCell, percent);
      body.append(row);
    });
    table.append(head, body);
    completenessChart.replaceChildren(table);
  }

  function renderGenderChart(target, assignments, selectedLabel, emptyMessage, notes) {
    const showCategories = selectedLabel === "__all__";
    const filtered = showCategories
      ? assignments
      : assignments.filter(function (assignment) { return assignment.label === selectedLabel; });
    const byDecade = new Map();
    const seen = new Set();
    filtered.forEach(function (assignment) {
      const key = assignment.decade + (showCategories ? "\u0000" + assignment.label : "") + "\u0000" + assignment.recordIndex;
      if (seen.has(key)) return;
      seen.add(key);
      const decadeKey = assignment.decade + (showCategories ? "\u0000" + assignment.label : "");
      if (!byDecade.has(decadeKey)) byDecade.set(decadeKey, {
        decade: assignment.decade,
        label: showCategories ? assignment.label : "",
        male: 0,
        female: 0,
        unknown: 0
      });
      byDecade.get(decadeKey)[assignment.gender] += 1;
    });
    target.replaceChildren();
    if (!byDecade.size) {
      renderEmptyAnalytics(target, emptyMessage);
      if (notes) {
        const note = document.createElement("p");
        note.className = "analytics-explanation";
        note.textContent = notes;
        target.append(note);
      }
      return;
    }
    const legend = document.createElement("div");
    legend.className = "analytics-legend";
    [["male", "Männer"], ["female", "Frauen"]].forEach(function (item) {
      const entry = document.createElement("span");
      const swatch = document.createElement("i");
      swatch.className = item[0];
      entry.append(swatch, document.createTextNode(item[1]));
      legend.append(entry);
    });
    target.append(legend);
    Array.from(byDecade.values()).sort(function (a, b) {
      return a.decade - b.decade || a.label.localeCompare(b.label, "de");
    }).forEach(function (counts) {
      const known = counts.male + counts.female;
      const row = document.createElement("div");
      row.className = "gender-chart-row";
      const label = document.createElement("span");
      label.className = "gender-chart-label";
      label.textContent = counts.decade + "er" + (counts.label ? " · " + counts.label : "");
      const track = document.createElement("span");
      track.className = "gender-chart-track";
      track.setAttribute("aria-label", label.textContent + ": " + counts.male + " Männer, " + counts.female + " Frauen, " + counts.unknown + " unbekannt");
      const male = document.createElement("span");
      male.className = "gender-chart-male";
      male.style.width = known ? (counts.male / known * 100) + "%" : "0%";
      const female = document.createElement("span");
      female.className = "gender-chart-female";
      female.style.width = known ? (counts.female / known * 100) + "%" : "0%";
      track.append(male, female);
      const detail = document.createElement("span");
      detail.className = "gender-chart-counts";
      detail.textContent = known
        ? "Männer " + counts.male + " (" + Math.round(counts.male / known * 100) + "%) · Frauen " + counts.female + " (" + Math.round(counts.female / known * 100) + "%) · Unbekannt " + counts.unknown
        : "Keine bekannte Geschlechtsangabe · Unbekannt " + counts.unknown;
      row.append(label, track, detail);
      target.append(row);
    });
    if (notes) {
      const note = document.createElement("p");
      note.className = "analytics-explanation";
      note.textContent = notes;
      target.append(note);
    }
  }

  function renderPersonTimeline(recordIndex) {
    const record = records[recordIndex];
    personTimeline.replaceChildren();
    timelineUndated.replaceChildren();
    if (!record) {
      renderEmptyAnalytics(personTimeline, "Keine Person ausgewählt.");
      return;
    }
    const events = [];
    const undated = [];
    const name = record["(1) Name"] || {};
    const birthYear = exactYear(name.Geburtsjahr);
    const deathYear = exactYear(name.Sterbejahr);
    if (birthYear) events.push({ year: birthYear, range: String(birthYear), label: "Geburt", text: "Geburtsjahr laut Namensfeld" });
    if (deathYear) events.push({ year: deathYear, range: String(deathYear), label: "Tod", text: "Sterbejahr laut Namensfeld" });
    [
      { key: "(11) Bildungsgang", label: "Bildungsgang" },
      { key: "(12) Berufslaufbahn", label: "Berufslaufbahn" },
      { key: "(13) Akademische-Ämter", label: "Akademische Ämter" }
    ].forEach(function (source) {
      getArrayField(record, source.key).forEach(function (entry) {
        if (typeof entry !== "string" || !entry.trim()) return;
        const range = leadingYearRange(entry);
        if (!range) {
          undated.push({ label: source.label, text: entry });
          return;
        }
        events.push({
          year: range.start,
          range: formatYearRange(range),
          label: source.label,
          text: entry
        });
      });
    });
    events.sort(function (a, b) { return a.year - b.year || a.label.localeCompare(b.label, "de"); });
    if (!events.length) {
      renderEmptyAnalytics(personTimeline, "Keine explizit datierten Angaben für den Zeitstrahl gefunden.");
    } else {
      const list = document.createElement("div");
      list.className = "timeline-list";
      events.forEach(function (item) {
        const event = document.createElement("article");
        event.className = "timeline-event";
        const years = document.createElement("span");
        years.className = "timeline-years";
        years.textContent = item.range;
        const label = document.createElement("span");
        label.className = "timeline-source-label";
        label.textContent = item.label;
        const text = document.createElement("div");
        text.className = "timeline-source";
        text.textContent = item.text;
        event.append(years, label, text);
        list.append(event);
      });
      personTimeline.replaceChildren(list);
    }
    if (undated.length) {
      const heading = document.createElement("strong");
      heading.textContent = undated.length + " Angabe(n) ohne eindeutig auslesbare Jahreszahl:";
      const list = document.createElement("ul");
      undated.forEach(function (item) {
        const entry = document.createElement("li");
        entry.textContent = item.label + ": " + item.text;
        list.append(entry);
      });
      timelineUndated.append(heading, list);
    }
  }

  function renderFacultyNetwork(faculties, selectedName) {
    facultyNetwork.replaceChildren();
    const faculty = faculties.find(function (item) { return item.name === selectedName; });
    if (!faculty) {
      renderEmptyAnalytics(facultyNetwork, "Keine Fakultätszugehörigkeiten vorhanden.");
      return;
    }
    const hub = document.createElement("div");
    hub.className = "faculty-network-hub";
    hub.textContent = faculty.name + " · " + faculty.members.size + (faculty.members.size === 1 ? " Person" : " Personen");
    const members = document.createElement("div");
    members.className = "faculty-network-members";
    Array.from(faculty.members).sort(function (a, b) {
      return fullName(records[a]).localeCompare(fullName(records[b]), "de");
    }).forEach(function (recordIndex) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "faculty-person-node";
      button.textContent = familyCandidateLabel(recordIndex);
      button.addEventListener("click", function () {
        navigateToFamilyRecord(recordIndex);
        analyticsDialog.close();
      });
      members.append(button);
    });
    facultyNetwork.append(hub, members);
  }

  function renderAnalytics() {
    const total = records.length;
    const genders = records.reduce(function (counts, record) {
      counts[recordGender(record)] += 1;
      return counts;
    }, { male: 0, female: 0, unknown: 0 });
    analyticsSummary.replaceChildren();
    [
      { label: "Geladene Datensätze", value: total },
      { label: "Geschlecht männlich", value: genders.male },
      { label: "Geschlecht weiblich", value: genders.female },
      { label: "Geschlecht unbekannt/anders", value: genders.unknown }
    ].forEach(function (item) {
      const card = document.createElement("div");
      card.className = "analytics-summary-card";
      const label = document.createElement("span");
      label.textContent = item.label;
      const value = document.createElement("strong");
      value.textContent = String(item.value);
      card.append(label, value);
      analyticsSummary.append(card);
    });

    renderCompleteness();
    const births = new Map();
    records.forEach(function (record) {
      const year = exactYear(record["(1) Name"] && record["(1) Name"].Geburtsjahr);
      if (year) {
        const decade = Math.floor(year / 10) * 10;
        births.set(decade, (births.get(decade) || 0) + 1);
      }
    });
    renderBarChart(birthDecadeChart, Array.from(births.entries()).map(function (entry) {
      return { label: entry[0] + "er", count: entry[1] };
    }).sort(function (a, b) { return a.label.localeCompare(b.label, "de"); }), "Keine expliziten Geburtsjahre vorhanden.");

    const positionData = collectPositionData();
    const facultyData = collectFacultyData();
    const facultyDistribution = facultyData.faculties.map(function (faculty) {
      return { label: faculty.name, count: faculty.members.size };
    }).sort(function (a, b) { return b.count - a.count || a.label.localeCompare(b.label, "de"); });
    renderBarChart(facultyDistributionChart, facultyDistribution, "Keine Fakultätsnamen vorhanden.");

    const recordOptions = records.map(function (record, index) {
      return { value: String(index), label: familyCandidateLabel(index) };
    });
    const previousPerson = timelinePersonSelect.value;
    populateSelect(timelinePersonSelect, recordOptions, "Keine Datensätze geladen", previousPerson || String(Math.max(0, selectedIndex)));
    renderPersonTimeline(Number(timelinePersonSelect.value));

    const previousPosition = genderPositionSelect.value;
    populateSelect(genderPositionSelect, [{ value: "__all__", label: "Alle erkannten Positionen" }].concat(
      positionData.labels.map(function (label) { return { value: label, label: label }; })
    ), "Keine erkannten Positionen", previousPosition || "__all__");
    renderGenderChart(
      genderPositionChart,
      positionData.assignments,
      genderPositionSelect.value || "__all__",
      "Keine eindeutig erkannten und datierten Positionen für diese Auswahl.",
      "Nicht zugeordnete Berufslaufbahn-Einträge: " + positionData.unclassified +
        " nicht sicher klassifizierbar, " + positionData.undated + " ohne lesbare Jahresangabe."
    );

    const facultyOptions = facultyData.faculties.map(function (faculty) {
      return { value: faculty.name, label: faculty.name };
    });
    const previousFaculty = genderFacultySelect.value;
    populateSelect(genderFacultySelect, [{ value: "__all__", label: "Alle Fakultäten" }].concat(facultyOptions),
      "Keine Fakultäten vorhanden", previousFaculty || "__all__");
    renderGenderChart(
      genderFacultyChart,
      facultyData.assignments,
      genderFacultySelect.value || "__all__",
      "Keine explizit datierten Fakultätszugehörigkeiten für diese Auswahl.",
      "Fakultätsangaben ohne auswertbares Anfangsjahr: " + facultyData.undated + "."
    );

    const previousNetworkFaculty = facultyNetworkSelect.value;
    populateSelect(facultyNetworkSelect, facultyOptions, "Keine Fakultäten vorhanden",
      previousNetworkFaculty || (facultyOptions[0] && facultyOptions[0].value));
    renderFacultyNetwork(facultyData.faculties, facultyNetworkSelect.value);
  }

  function openAnalytics() {
    if (!records.length) return;
    renderAnalytics();
    analyticsDialog.showModal();
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

  function normalizePlace(value) {
    return String(value || "").replace(/^\s*\(\(o([\s\S]*?)\)\)\s*$/, "$1").replace(/\s+/g, " ").trim();
  }

  function placeKey(value) {
    return normalizePlace(value).normalize("NFC").toLocaleLowerCase("de");
  }

  function addMapPlace(places, value, reference) {
    const place = normalizePlace(value);
    if (!place) return;
    const key = placeKey(place);
    let location = places.get(key);
    if (!location) {
      location = {
        place: place,
        references: [],
        features: [],
        selectedFeature: null,
        matchType: "",
        requiresReview: false,
        marker: null,
        error: ""
      };
      places.set(key, location);
    }
    const referenceKey = [reference.record, reference.person, reference.type, reference.field].join("|");
    if (!location.references.some(function (item) { return item.key === referenceKey; })) {
      location.references.push(Object.assign({ key: referenceKey }, reference));
    }
  }

  function locationFieldLabel(path) {
    return path.map(function (part) {
      return typeof part === "number" ? "Eintrag " + (part + 1) : part;
    }).join(" › ");
  }

  function collectTaggedPlaces(value, path, person, places) {
    if (typeof value === "string") {
      const marker = /\(\(o([\s\S]*?)\)\)/g;
      let match;
      while ((match = marker.exec(value)) !== null) {
        addMapPlace(places, match[1], {
          person: person.person,
          record: person.record,
          type: "Weitere Ortsnennung",
          field: locationFieldLabel(path)
        });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function (item, index) {
        collectTaggedPlaces(item, path.concat(index), person, places);
      });
      return;
    }
    if (value && typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        collectTaggedPlaces(value[key], path.concat(key), person, places);
      });
    }
  }

  function collectMapPlaces(indices) {
    const places = new Map();
    indices.forEach(function (recordIndex) {
      const record = records[recordIndex] || {};
      const person = fullName(record);
      const recordNumber = recordIndex + 1;
      const life = record["(6+7) Lebensdaten"] || {};
      addMapPlace(places, life.Geburtsort, {
        person: person,
        record: recordNumber,
        type: "Geburtsort",
        field: "(6+7) Lebensdaten › Geburtsort"
      });
      addMapPlace(places, life.Sterbeort, {
        person: person,
        record: recordNumber,
        type: "Sterbeort",
        field: "(6+7) Lebensdaten › Sterbeort"
      });
      collectTaggedPlaces(life["(7a) Begräbnisdaten"], ["(6+7) Lebensdaten", "(7a) Begräbnisdaten"], {
        person: person,
        record: recordNumber
      }, places);
      Object.keys(record).forEach(function (key) {
        if (key === "(1) Name" || key === "(1*) Namensvarianten" || key === "(6+7) Lebensdaten") return;
        collectTaggedPlaces(record[key], [key], { person: person, record: recordNumber }, places);
      });
    });
    return Array.from(places.values());
  }

  function normalizePlaceForMatch(value) {
    return normalizePlace(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("de")
      .replace(/[.,/()'’-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizePhotonFeature(feature) {
    const coordinates = feature && (feature.coordinates || feature.geometry && feature.geometry.coordinates);
    if (!Array.isArray(coordinates) || !Number.isFinite(Number(coordinates[0])) ||
        !Number.isFinite(Number(coordinates[1])) || Math.abs(Number(coordinates[0])) > 180 ||
        Math.abs(Number(coordinates[1])) > 90) return null;
    const sourceProperties = feature.properties || {};
    const properties = {};
    ["name", "city", "district", "county", "state", "country", "postcode"].forEach(function (key) {
      if (typeof sourceProperties[key] === "string") properties[key] = sourceProperties[key];
    });
    return {
      coordinates: [Number(coordinates[0]), Number(coordinates[1])],
      properties: properties
    };
  }

  function loadGeocodeCache() {
    if (geocodeCacheLoaded) return;
    geocodeCacheLoaded = true;
    try {
      const saved = window.localStorage.getItem(geocodeCacheKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Der lokale Ortscache hat ein ungültiges Format.");
      }
      Object.keys(parsed).forEach(function (key) {
        const entry = parsed[key];
        if (!entry || !Array.isArray(entry.features)) return;
        const features = entry.features.map(normalizePhotonFeature).filter(Boolean);
        geocodeCache.set(key, features);
      });
    } catch (error) {
      geocodeCacheNotice = "Der lokale Ortscache ist nicht verfügbar; bereits verortete Orte müssen eventuell erneut gesucht werden.";
      console.warn("Geocoding-Cache konnte nicht geladen werden.", error);
    }
  }

  function saveGeocodeCache() {
    if (!geocodeCacheWritable) return;
    try {
      const saved = {};
      geocodeCache.forEach(function (features, key) {
        saved[key] = { features: features };
      });
      window.localStorage.setItem(geocodeCacheKey, JSON.stringify(saved));
    } catch (error) {
      geocodeCacheWritable = false;
      geocodeCacheNotice = "Der lokale Ortscache konnte nicht gespeichert werden; bereits verortete Orte werden nur bis zum Schließen der Seite zwischengespeichert.";
      console.warn("Geocoding-Cache konnte nicht gespeichert werden.", error);
    }
  }

  function leafletLibrary() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletLoadPromise) return leafletLoadPromise;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
    document.head.append(stylesheet);
    leafletLoadPromise = new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
      script.onload = function () {
        if (window.L) resolve(window.L);
        else reject(new Error("Leaflet wurde geladen, ist aber nicht verfügbar."));
      };
      script.onerror = function () {
        leafletLoadPromise = null;
        reject(new Error("Die Kartenbibliothek konnte nicht geladen werden."));
      };
      document.head.append(script);
    });
    return leafletLoadPromise;
  }

  function initializePlaceMap(L) {
    if (!placeMap) {
      placeMap = L.map(mapElement).setView([48.5, 9.5], 5);
      L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a> · Kacheln: <a href="https://tile.openstreetmap.de/">OpenStreetMap Deutschland</a>'
      }).addTo(placeMap);
      placeLayer = L.layerGroup().addTo(placeMap);
    }
    placeLayer.clearLayers();
    window.setTimeout(function () { placeMap.invalidateSize(); }, 50);
  }

  function featureTitle(feature) {
    const properties = feature.properties || {};
    return properties.name || properties.city || properties.county || properties.state || "Unbenannter Ort";
  }

  function featureDescription(feature) {
    const properties = feature.properties || {};
    const title = featureTitle(feature);
    return [properties.city, properties.district, properties.county, properties.state, properties.country]
      .filter(function (part, index, parts) { return part && part !== title && parts.indexOf(part) === index; })
      .join(", ");
  }

  function featureMatchesPlace(feature, place) {
    const expected = normalizePlaceForMatch(place);
    const properties = feature.properties || {};
    return [properties.name, properties.city].some(function (candidate) {
      return candidate && normalizePlaceForMatch(candidate) === expected;
    });
  }

  function fetchPhotonFeatures(place, signal) {
    loadGeocodeCache();
    const key = placeKey(place);
    if (geocodeCache.has(key)) return Promise.resolve(geocodeCache.get(key));
    const wait = Math.max(0, 1000 - (Date.now() - lastGeocodeRequest));
    return new Promise(function (resolve) { window.setTimeout(resolve, wait); })
      .then(function () {
        if (signal.aborted) {
          const error = new Error("Kartensuche abgebrochen.");
          error.name = "AbortError";
          throw error;
        }
        lastGeocodeRequest = Date.now();
        const url = "https://photon.komoot.io/api/?q=" + encodeURIComponent(place) + "&limit=5&lang=de";
        const requestController = new AbortController();
        const abortRequest = function () { requestController.abort(); };
        let timedOut = false;
        const timeout = window.setTimeout(function () {
          timedOut = true;
          requestController.abort();
        }, 15000);
        signal.addEventListener("abort", abortRequest, { once: true });
        return fetch(url, {
          signal: requestController.signal,
          headers: { Accept: "application/geo+json, application/json" }
        }).catch(function (error) {
          if (timedOut) throw new Error("Zeitüberschreitung beim Ortsdienst.");
          throw error;
        }).finally(function () {
          window.clearTimeout(timeout);
          signal.removeEventListener("abort", abortRequest);
        });
      })
      .then(function (response) {
        if (!response.ok) throw new Error("Ortsdienst antwortete mit HTTP " + response.status + ".");
        return response.json();
      })
      .then(function (payload) {
        const features = Array.isArray(payload.features)
          ? payload.features.map(normalizePhotonFeature).filter(Boolean)
          : [];
        geocodeCache.set(key, features);
        saveGeocodeCache();
        return features;
      });
  }

  function createMapPopup(location, matchType) {
    const popup = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = location.place;
    const note = document.createElement("p");
    if (matchType === "manual") {
      note.textContent = "Von dir ausgewählter Photon-Treffer; Koordinaten nicht in den Quelldaten bestätigt.";
    } else if (matchType === "suggestion") {
      note.textContent = "Einziger Photon-Treffer (unbestätigter Vorschlag); das Quellfeld belegt keinen Wohnort.";
    } else if (matchType === "ambiguous") {
      note.textContent = "Erster von mehreren gleichlautenden Photon-Treffern (unbestätigt); bitte prüfe die Auswahl rechts.";
    } else {
      note.textContent = "Photon-Treffer mit übereinstimmendem Namen (nicht geprüft); das Quellfeld belegt keinen Wohnort.";
    }
    const references = document.createElement("ul");
    location.references.forEach(function (reference) {
      const item = document.createElement("li");
      item.textContent = reference.person + " (Datensatz " + reference.record + ") · " + reference.type + " · " + reference.field;
      references.append(item);
    });
    popup.append(title, note, references);
    return popup;
  }

  function plotMapLocation(location, feature, matchType) {
    const L = window.L;
    const categories = new Set(location.references.map(function (reference) { return reference.type; }));
    const color = categories.size === 1 && categories.has("Geburtsort")
      ? "#398357"
      : categories.size === 1 && categories.has("Sterbeort") ? "#b35345" : "#607ca0";
    if (location.marker) placeLayer.removeLayer(location.marker);
    const markerOptions = {
      radius: 7,
      color: color,
      fillColor: color,
      fillOpacity: matchType === "ambiguous" ? 0.55 : 0.85,
      weight: 1.5
    };
    if (matchType === "ambiguous") markerOptions.dashArray = "2 3";
    const marker = L.circleMarker([feature.coordinates[1], feature.coordinates[0]], markerOptions).addTo(placeLayer);
    marker.bindPopup(createMapPopup(location, matchType));
    location.marker = marker;
    location.selectedFeature = feature;
    location.matchType = matchType;
    location.requiresReview = matchType === "ambiguous";
  }

  function renderUnresolvedLocations(locations) {
    mapUnresolved.replaceChildren();
    const unresolved = locations.filter(function (location) {
      return !location.selectedFeature || location.requiresReview;
    });
    if (!unresolved.length) {
      const empty = document.createElement("p");
      empty.className = "map-empty";
      empty.textContent = "Alle eindeutigen Treffer sind als Vorschläge eingezeichnet oder wurden von dir ausgewählt.";
      mapUnresolved.append(empty);
      return;
    }
    unresolved.forEach(function (location) {
      const card = document.createElement("article");
      card.className = "map-location-review";
      const title = document.createElement("strong");
      title.textContent = location.place;
      const detail = document.createElement("p");
      const sourceLabels = Array.from(new Set(location.references.map(function (reference) {
        return reference.person + " (Datensatz " + reference.record + ") · " +
          reference.type + " · " + reference.field;
      })));
      detail.textContent = location.references.length + (location.references.length === 1 ? " Nennung: " : " Nennungen: ") +
        sourceLabels.join("; ") + (location.error ? " · " + location.error : "");
      card.append(title, detail);
      if (location.features.length) {
        const select = document.createElement("select");
        select.setAttribute("aria-label", "Passenden Kartenort für " + location.place + " auswählen");
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Treffer auswählen …";
        select.append(placeholder);
        location.features.forEach(function (feature, index) {
          const option = document.createElement("option");
          option.value = String(index);
          option.textContent = [featureTitle(feature), featureDescription(feature)].filter(Boolean).join(" — ");
          select.append(option);
        });
        const applyButton = document.createElement("button");
        applyButton.type = "button";
        applyButton.className = "button button-secondary";
        applyButton.textContent = "Ausgewählten Treffer einzeichnen";
        applyButton.disabled = true;
        select.addEventListener("change", function () { applyButton.disabled = select.value === ""; });
        applyButton.addEventListener("click", function () {
          if (select.value === "") return;
          plotMapLocation(location, location.features[Number(select.value)], "manual");
          renderUnresolvedLocations(locations);
          fitPlaceMap(locations);
          updateMapSummary(locations);
        });
        card.append(select, applyButton);
      } else if (!location.error) {
        const noResult = document.createElement("p");
        noResult.textContent = "Kein Treffer gefunden; dieser Ort wird nicht automatisch verortet.";
        card.append(noResult);
      }
      mapUnresolved.append(card);
    });
  }

  function fitPlaceMap(locations) {
    const plotted = locations.filter(function (location) { return location.selectedFeature; });
    if (!plotted.length || !placeMap) return;
    const points = plotted.map(function (location) {
      return [location.selectedFeature.coordinates[1], location.selectedFeature.coordinates[0]];
    });
    if (points.length === 1) placeMap.setView(points[0], 8);
    else placeMap.fitBounds(window.L.latLngBounds(points).pad(0.12), { maxZoom: 10 });
  }

  function updateMapSummary(locations, serviceError) {
    const exactMatches = locations.filter(function (location) { return location.matchType === "exact"; }).length;
    const suggestions = locations.filter(function (location) { return location.matchType === "suggestion"; }).length;
    const ambiguousSuggestions = locations.filter(function (location) { return location.matchType === "ambiguous"; }).length;
    const manualMatches = locations.filter(function (location) { return location.matchType === "manual"; }).length;
    const unresolved = locations.filter(function (location) { return !location.selectedFeature; }).length;
    mapStatus.textContent = locations.length + " eindeutige Ortsnamen · " + exactMatches +
      " Namens-Treffer · " + suggestions + " einzelne Vorschläge · " + ambiguousSuggestions +
      " mehrdeutige Vorschläge (bitte prüfen) · " +
      manualMatches + " manuell zugeordnet · " + unresolved +
      " ohne Treffer. Koordinaten sind externe Vorschläge, keine Quelldaten." +
      (serviceError ? " Ortsdienst-Fehler: " + serviceError : "") +
      (geocodeCacheNotice ? " " + geocodeCacheNotice : "");
  }

  async function createPlacesMap(indices, title) {
    if (!indices.length) return;
    if (mapRequestController) mapRequestController.abort();
    const controller = new AbortController();
    mapRequestController = controller;
    const generation = ++mapGeneration;
    mapTitle.textContent = title;
    mapDialog.showModal();
    mapStatus.textContent = "Ortsangaben werden vorbereitet …";
    mapUnresolved.replaceChildren();
    const locations = collectMapPlaces(indices);
    if (!locations.length) {
      mapStatus.textContent = "Für diese Auswahl wurden keine markierten Ortsnennungen und keine Geburts- oder Sterbeorte gefunden.";
      mapRequestController = null;
      return;
    }

    try {
      const L = await leafletLibrary();
      if (generation !== mapGeneration) return;
      initializePlaceMap(L);
      let completed = 0;
      let serviceError = "";
      for (const location of locations) {
        if (controller.signal.aborted || generation !== mapGeneration) return;
        if (serviceError) {
          location.error = "Ortsdienst nicht erreichbar; Suche wurde abgebrochen.";
          completed += 1;
          continue;
        }
        try {
          location.features = await fetchPhotonFeatures(location.place, controller.signal);
          const exactMatches = location.features.filter(function (feature) {
            return featureMatchesPlace(feature, location.place);
          });
          if (exactMatches.length === 1) {
            plotMapLocation(location, exactMatches[0], "exact");
          } else if (exactMatches.length > 1) {
            plotMapLocation(location, exactMatches[0], "ambiguous");
          } else if (exactMatches.length === 0 && location.features.length === 1) {
            plotMapLocation(location, location.features[0], "suggestion");
          }
        } catch (error) {
          if (controller.signal.aborted && error.name === "AbortError") return;
          location.error = error.message || "Ortsdienst nicht erreichbar.";
          if (error.name === "TypeError" || /Zeitüberschreitung|HTTP (429|5\d\d)/.test(error.message)) {
            serviceError = location.error;
          }
          console.error("Ort konnte nicht verortet werden: " + location.place, error);
        }
        completed += 1;
        mapStatus.textContent = "Orte geprüft: " + completed + " / " + locations.length +
          (geocodeCacheNotice ? " · " + geocodeCacheNotice : "");
      }
      renderUnresolvedLocations(locations);
      fitPlaceMap(locations);
      updateMapSummary(locations, serviceError);
    } catch (error) {
      if (error.name === "AbortError" || generation !== mapGeneration) return;
      mapStatus.textContent = "Karte konnte nicht erstellt werden: " + error.message +
        " Prüfe die Internetverbindung und versuche es erneut.";
    } finally {
      if (mapRequestController === controller) mapRequestController = null;
    }
  }

  function closePlacesMap() {
    mapGeneration += 1;
    if (mapRequestController) mapRequestController.abort();
    mapRequestController = null;
    if (mapDialog.open) mapDialog.close();
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
    createMapButton.disabled = visibleIndices.length === 0;
    openAnalyticsButton.disabled = records.length === 0;
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
    renderPortrait(record);
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

  function digitalResourceArray(record, createIfMissing) {
    const value = record[digitalResourceKey];
    if (value == null && createIfMissing) {
      record[digitalResourceKey] = [];
      return record[digitalResourceKey];
    }
    if (value == null) return [];
    if (!Array.isArray(value)) throw new Error("Das Feld „" + digitalResourceKey + "“ muss ein Array sein. Prüfe den Datensatz im JSON-Editor.");
    return value;
  }

  function safeWebUrl(value) {
    try {
      const parsed = new URL(String(value || "").trim());
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
    } catch (error) {
      return "";
    }
  }

  function setDigitalResourceStatus(message, isError) {
    digitalResourceStatus.textContent = message;
    digitalResourceStatus.classList.toggle("is-error", Boolean(isError));
  }

  function setDigitalResourceStatusForRecord(record, message, isError) {
    if (records[selectedIndex] === record) setDigitalResourceStatus(message, isError);
    else if (message) setRecordsNotice(fullName(record) + ": " + message);
  }

  function resourceAction(label, action, accessibleLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-secondary array-action";
    button.textContent = label;
    if (accessibleLabel) button.setAttribute("aria-label", accessibleLabel);
    button.addEventListener("click", action);
    return button;
  }

  function formatDigitalFileSize(value) {
    const size = Number(value);
    if (!Number.isFinite(size) || size < 0) return "";
    if (size < 1024) return size + " B";
    const units = ["KB", "MB", "GB", "TB"];
    let amount = size;
    let unitIndex = -1;
    do {
      amount /= 1024;
      unitIndex += 1;
    } while (amount >= 1024 && unitIndex < units.length - 1);
    return amount.toFixed(amount < 10 ? 1 : 0) + " " + units[unitIndex];
  }

  function isPortraitResource(resource) {
    return resource && typeof resource === "object" && !Array.isArray(resource) &&
      resource.Typ === "Datei" && resource.Verwendung === "Profilbild";
  }

  function portraitMediaType(file) {
    const mediaType = String(file.type || "").toLowerCase();
    if (mediaType === "image/jpg") return "image/jpeg";
    if (portraitMimeTypes.has(mediaType)) return mediaType;
    if (mediaType && mediaType !== "application/octet-stream") return "";
    const extension = String(file.name || "").split(".").pop().toLowerCase();
    return portraitExtensions[extension] || "";
  }

  function setPortraitStatusForRecord(record, message, isError) {
    if (records[selectedIndex] === record) {
      portraitStatus.textContent = message;
      portraitStatus.classList.toggle("is-error", Boolean(isError));
    } else if (message) {
      setRecordsNotice(fullName(record) + ": " + message);
    }
  }

  function clearPortraitObjectUrl() {
    if (!portraitObjectUrl) return;
    URL.revokeObjectURL(portraitObjectUrl);
    portraitObjectUrl = "";
  }

  function showPortraitPlaceholder(caption, hasPortrait) {
    portraitImage.onload = null;
    portraitImage.onerror = null;
    portraitImage.removeAttribute("src");
    portraitImage.alt = "";
    clearPortraitObjectUrl();
    portraitImage.hidden = true;
    portraitPlaceholder.hidden = false;
    removePortraitButton.hidden = !hasPortrait;
    choosePortraitButton.textContent = hasPortrait ? "Foto ersetzen" : "Foto auswählen";
    photoCaption.textContent = caption;
    photoCaption.title = caption;
    dummyPhoto.setAttribute("aria-label", caption);
  }

  function renderPortrait(record) {
    let resource = null;
    try {
      resource = digitalResourceArray(record, false).find(isPortraitResource) || null;
    } catch (error) {
      if (displayedPortraitRecord !== record || displayedPortraitResource !== null) {
        displayedPortraitRecord = record;
        displayedPortraitResource = null;
        showPortraitPlaceholder("Dummy-Foto · " + (record["(011) Geschlecht"] || "keine Angabe"), false);
      }
      setPortraitStatusForRecord(record, "Personenfoto kann nicht geladen werden: " + error.message, true);
      return;
    }
    if (displayedPortraitRecord === record && displayedPortraitResource === resource) {
      if (resource) {
        portraitImage.alt = "Personenfoto von " + fullName(record);
        dummyPhoto.setAttribute("aria-label", "Personenfoto von " + fullName(record));
      } else {
        const caption = "Dummy-Foto · " + (record["(011) Geschlecht"] || "keine Angabe");
        photoCaption.textContent = caption;
        photoCaption.title = caption;
        dummyPhoto.setAttribute("aria-label", caption);
      }
      return;
    }

    displayedPortraitRecord = record;
    displayedPortraitResource = resource;
    showPortraitPlaceholder(
      resource ? "Foto wird geladen …" : "Dummy-Foto · " + (record["(011) Geschlecht"] || "keine Angabe"),
      Boolean(resource)
    );
    if (!resource) {
      setPortraitStatusForRecord(record, "", false);
      return;
    }

    try {
      const mediaType = String(resource.Medientyp || "").toLowerCase();
      if (!portraitMimeTypes.has(mediaType)) throw new Error("Der Medientyp ist kein unterstütztes Bildformat.");
      const blob = new Blob([digitalResourceBytes(resource)], { type: mediaType });
      const objectUrl = URL.createObjectURL(blob);
      portraitObjectUrl = objectUrl;
      portraitImage.alt = "Personenfoto von " + fullName(record);
      portraitImage.onerror = function () {
        if (portraitObjectUrl !== objectUrl) return;
        showPortraitPlaceholder("Foto nicht verfügbar", true);
        setPortraitStatusForRecord(record, "Das gespeicherte Personenfoto kann nicht angezeigt werden.", true);
      };
      portraitImage.src = objectUrl;
      portraitImage.hidden = false;
      portraitPlaceholder.hidden = true;
      photoCaption.textContent = resource.Dateiname || resource.Titel || "Personenfoto";
      photoCaption.title = photoCaption.textContent;
      dummyPhoto.setAttribute("aria-label", "Personenfoto von " + fullName(record));
      setPortraitStatusForRecord(record, "", false);
    } catch (error) {
      photoCaption.textContent = "Foto nicht verfügbar";
      photoCaption.title = photoCaption.textContent;
      dummyPhoto.setAttribute("aria-label", "Personenfoto nicht verfügbar");
      setPortraitStatusForRecord(record, "Gespeichertes Personenfoto kann nicht angezeigt werden: " + error.message, true);
    }
  }

  function digitalResourceBytes(resource) {
    const base64 = resource && resource.InhaltBase64;
    const emptyFile = resource && resource.GroesseBytes === 0 && base64 === "";
    if (typeof base64 !== "string" || (!base64 && !emptyFile) || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      throw new Error("Der eingebettete Dateiinhalt fehlt oder ist ungültig.");
    }
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function removeDigitalResource(record, resourceIndex) {
    let resources;
    try {
      resources = digitalResourceArray(record, false);
    } catch (error) {
      setDigitalResourceStatus(error.message, true);
      return;
    }
    resources.splice(resourceIndex, 1);
    commitDigitalResourceChange(record, "Digitale Ressource entfernt.");
  }

  function downloadDigitalResource(resource) {
    try {
      const blob = new Blob([digitalResourceBytes(resource)], { type: "application/octet-stream" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = safeFileName(resource.Dateiname || resource.Titel || "digitale-ressource");
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 1000);
      setDigitalResourceStatus("Download für „" + (resource.Dateiname || resource.Titel || "Datei") + "“ gestartet.", false);
    } catch (error) {
      setDigitalResourceStatus("Datei konnte nicht heruntergeladen werden: " + error.message, true);
    }
  }

  function renderDigitalResources(record) {
    digitalResourceList.replaceChildren();
    setDigitalResourceStatus("", false);
    let resources;
    try {
      resources = digitalResourceArray(record, false);
    } catch (error) {
      const note = document.createElement("p");
      note.className = "digital-resource-empty is-error";
      note.textContent = error.message;
      digitalResourceList.append(note);
      setDigitalResourceStatus(error.message, true);
      return;
    }
    if (!resources.length) {
      const empty = document.createElement("p");
      empty.className = "digital-resource-empty";
      empty.textContent = "Noch keine digitalen Ressourcen verknüpft.";
      digitalResourceList.append(empty);
      return;
    }
    resources.forEach(function (resource, index) {
      const card = document.createElement("article");
      card.className = "digital-resource-item";
      const details = document.createElement("div");
      details.className = "digital-resource-details";
      const title = document.createElement("strong");
      title.className = "digital-resource-title";
      const actions = document.createElement("div");
      actions.className = "digital-resource-actions";
      const removeButton = resourceAction("Entfernen", function () {
        removeDigitalResource(record, index);
      }, "Digitale Ressource " + (index + 1) + " entfernen");

      if (!resource || typeof resource !== "object" || Array.isArray(resource)) {
        title.textContent = "Ungültiger Ressourceneintrag";
        const note = document.createElement("span");
        note.className = "digital-resource-meta is-error";
        note.textContent = "Bitte den Eintrag im JSON-Editor prüfen.";
        details.append(title, note);
      } else if (resource.Typ === "Link") {
        const url = safeWebUrl(resource.URL);
        title.textContent = analysisText(resource.Titel) || analysisText(resource.URL) || "Weblink";
        if (url) {
          const anchor = document.createElement("a");
          anchor.className = "digital-resource-link";
          anchor.href = url;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.textContent = url;
          details.append(title, anchor);
        } else {
          const note = document.createElement("span");
          note.className = "digital-resource-meta is-error";
          note.textContent = "Ungültige Adresse. Nur HTTP- und HTTPS-Links werden geöffnet.";
          details.append(title, note);
        }
      } else if (resource.Typ === "Datei") {
        const fileName = analysisText(resource.Dateiname) || analysisText(resource.Titel) || "Datei ohne Namen";
        title.textContent = analysisText(resource.Titel) || fileName;
        const meta = document.createElement("span");
        meta.className = "digital-resource-meta";
        meta.textContent = fileName + (formatDigitalFileSize(resource.GroesseBytes)
          ? " · " + formatDigitalFileSize(resource.GroesseBytes)
          : "") + (isPortraitResource(resource) ? " · Personenfoto" : "");
        details.append(title, meta);
        actions.append(resourceAction("Herunterladen", function () {
          downloadDigitalResource(resource);
        }, "Anhang " + fileName + " herunterladen"));
      } else {
        title.textContent = analysisText(resource.Titel) || "Unbekannte Ressource";
        const note = document.createElement("span");
        note.className = "digital-resource-meta is-error";
        note.textContent = "Unbekannter Ressourcentyp. Bitte den Eintrag im JSON-Editor prüfen.";
        details.append(title, note);
      }
      actions.append(removeButton);
      card.append(details, actions);
      digitalResourceList.append(card);
    });
  }

  function commitDigitalResourceChange(record, statusMessage) {
    try {
      refreshEditedRecord(record);
    } catch (error) {
      if (records[selectedIndex] === record) renderDigitalResources(record);
      setDigitalResourceStatusForRecord(record, "Änderung konnte nicht übernommen werden: " + error.message, true);
      return false;
    }
    if (records[selectedIndex] === record) renderDigitalResources(record);
    setDigitalResourceStatusForRecord(record, statusMessage, false);
    return true;
  }

  function addDigitalLink() {
    const record = records[selectedIndex];
    if (!record) return;
    const url = safeWebUrl(digitalLinkUrl.value);
    if (!url) {
      setDigitalResourceStatus("Bitte eine gültige HTTP- oder HTTPS-Adresse eingeben.", true);
      digitalLinkUrl.focus();
      return;
    }
    let resources;
    try {
      resources = digitalResourceArray(record, true);
    } catch (error) {
      setDigitalResourceStatus(error.message, true);
      return;
    }
    resources.push({
      Typ: "Link",
      Titel: digitalLinkTitle.value.trim() || url,
      URL: url
    });
    digitalLinkTitle.value = "";
    digitalLinkUrl.value = "";
    commitDigitalResourceChange(record, "Weblink hinzugefügt.");
  }

  function readDigitalFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.addEventListener("load", function () {
        if (typeof reader.result !== "string") {
          reject(new Error("Der Browser hat keinen Dateiinhalt zurückgegeben."));
          return;
        }
        const separator = reader.result.indexOf(",");
        if (separator < 0 || !reader.result.slice(0, separator).endsWith(";base64")) {
          reject(new Error("Der Browser konnte die Datei nicht als Base64 kodieren."));
          return;
        }
        resolve(reader.result.slice(separator + 1));
      });
      reader.addEventListener("error", function () {
        reject(reader.error || new Error("Unbekannter Lesefehler."));
      });
      reader.addEventListener("abort", function () {
        reject(new Error("Der Lesevorgang wurde abgebrochen."));
      });
      reader.readAsDataURL(file);
    });
  }

  function validatePortraitFile(file) {
    return new Promise(function (resolve, reject) {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.addEventListener("load", function () {
        URL.revokeObjectURL(objectUrl);
        resolve();
      }, { once: true });
      image.addEventListener("error", function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Die Datei enthält kein lesbares Bild."));
      }, { once: true });
      image.src = objectUrl;
    });
  }

  async function attachPortraitFile(file) {
    const record = records[selectedIndex];
    if (!record || !file) return;
    const mediaType = portraitMediaType(file);
    if (!mediaType) {
      setPortraitStatusForRecord(record, "Bitte wähle ein JPEG-, PNG-, GIF-, WebP-, AVIF- oder BMP-Bild aus.", true);
      return;
    }
    setPortraitStatusForRecord(record, "Personenfoto wird gelesen …", false);
    try {
      await validatePortraitFile(file);
      const content = await readDigitalFile(file);
      const resources = digitalResourceArray(record, true);
      const portrait = {
        Typ: "Datei",
        Verwendung: "Profilbild",
        Titel: file.name,
        Dateiname: file.name,
        Medientyp: mediaType,
        GroesseBytes: file.size,
        InhaltBase64: content
      };
      for (let index = resources.length - 1; index >= 0; index -= 1) {
        if (isPortraitResource(resources[index])) resources.splice(index, 1);
      }
      resources.push(portrait);
      if (!commitDigitalResourceChange(record, "Personenfoto gespeichert.")) {
        setPortraitStatusForRecord(record, "Personenfoto konnte nicht gespeichert werden. Prüfe den JSON-Datensatz.", true);
        return;
      }
      setPortraitStatusForRecord(record, "Personenfoto gespeichert.", false);
    } catch (error) {
      setPortraitStatusForRecord(record, "Personenfoto konnte nicht hinzugefügt werden: " + error.message, true);
    }
  }

  function removePortrait(record) {
    let resources;
    try {
      resources = digitalResourceArray(record, false);
    } catch (error) {
      setPortraitStatusForRecord(record, error.message, true);
      return;
    }
    let removed = false;
    for (let index = resources.length - 1; index >= 0; index -= 1) {
      if (isPortraitResource(resources[index])) {
        resources.splice(index, 1);
        removed = true;
      }
    }
    if (!removed) return;
    if (commitDigitalResourceChange(record, "Personenfoto entfernt.")) {
      setPortraitStatusForRecord(record, "Personenfoto entfernt.", false);
    }
  }

  async function attachDigitalFiles(files) {
    const record = records[selectedIndex];
    if (!record || !files.length) return;
    let resources;
    try {
      resources = digitalResourceArray(record, true);
    } catch (error) {
      setDigitalResourceStatus(error.message, true);
      return;
    }
    const added = [];
    const failures = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (records[selectedIndex] === record) {
        setDigitalResourceStatus("Datei " + (index + 1) + " von " + files.length + " wird gelesen …", false);
      }
      try {
        const content = await readDigitalFile(file);
        added.push({
          Typ: "Datei",
          Titel: file.name,
          Dateiname: file.name,
          Medientyp: file.type || "application/octet-stream",
          GroesseBytes: file.size,
          InhaltBase64: content
        });
      } catch (error) {
        failures.push(file.name + ": " + error.message);
      }
    }
    if (added.length) {
      resources.push.apply(resources, added);
      const committed = commitDigitalResourceChange(record, added.length + (added.length === 1 ? " Datei eingebettet." : " Dateien eingebettet."));
      if (!committed) return;
    }
    if (failures.length) {
      const failedMessage = "Datei(en) konnten nicht eingebettet werden: " + failures.join(" · ");
      setDigitalResourceStatusForRecord(record, added.length
        ? digitalResourceStatus.textContent + " " + failedMessage
        : failedMessage, true);
    }
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
      if (knownGroupKeys.has(key) || groupedKeys.has(key) || appManagedFields.has(key)) return;
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
      displayedPortraitRecord = null;
      displayedPortraitResource = null;
      clearPortraitObjectUrl();
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
    renderPortrait(record);
    const birthDeath = [life.Geburtsdatum, life.Geburtsort, life.Sterbedatum, life.Sterbeort].filter(Boolean).join(" · ");
    detailYears.title = birthDeath;
    renderIssues(problems);
    renderForm(record, problems);
    renderAdditional(record);
    renderDigitalResources(record);
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
      try {
        window.opener.postMessage({
          type: "prokat-records-updated",
          channel: channel,
          records: records,
          warnings: sourceWarnings
        }, messageTargetOrigin());
      } catch (error) {
        setRecordsNotice("Aktualisierung der Konverter-Ansicht fehlgeschlagen: " + error.message + " Die Daten bleiben in der Übersicht bearbeitbar; exportiere sie hier als JSON.");
      }
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
    try {
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
    } catch (error) {
      setRecordsNotice("JSON-Export fehlgeschlagen: " + error.message);
    }
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
  createMapButton.addEventListener("click", function () {
    createPlacesMap(visibleIndices, "Orte aus sichtbaren Einträgen");
  });
  createPersonMapButton.addEventListener("click", function () {
    if (selectedIndex < 0 || !records[selectedIndex]) return;
    createPlacesMap([selectedIndex], "Orte von " + fullName(records[selectedIndex]));
  });
  showFamilyGraphButton.addEventListener("click", openFamilyGraph);
  openAnalyticsButton.addEventListener("click", openAnalytics);
  closeMapButton.addEventListener("click", closePlacesMap);
  closeFamilyButton.addEventListener("click", function () { familyDialog.close(); });
  closeAnalyticsButton.addEventListener("click", function () { analyticsDialog.close(); });
  addDigitalLinkButton.addEventListener("click", addDigitalLink);
  chooseDigitalFilesButton.addEventListener("click", function () { digitalFileInput.click(); });
  choosePortraitButton.addEventListener("click", function () { portraitFileInput.click(); });
  removePortraitButton.addEventListener("click", function () {
    const record = records[selectedIndex];
    if (record) removePortrait(record);
  });
  portraitFileInput.addEventListener("change", function () {
    const file = portraitFileInput.files && portraitFileInput.files[0];
    portraitFileInput.value = "";
    if (file) attachPortraitFile(file);
  });
  digitalFileInput.addEventListener("change", function () {
    const files = Array.from(digitalFileInput.files || []);
    digitalFileInput.value = "";
    attachDigitalFiles(files);
  });
  timelinePersonSelect.addEventListener("change", function () {
    renderPersonTimeline(Number(timelinePersonSelect.value));
  });
  genderPositionSelect.addEventListener("change", function () {
    const data = collectPositionData();
    renderGenderChart(
      genderPositionChart,
      data.assignments,
      genderPositionSelect.value || "__all__",
      "Keine eindeutig erkannten und datierten Positionen für diese Auswahl.",
      "Nicht zugeordnete Berufslaufbahn-Einträge: " + data.unclassified +
        " nicht sicher klassifizierbar, " + data.undated + " ohne lesbare Jahresangabe."
    );
  });
  genderFacultySelect.addEventListener("change", function () {
    const data = collectFacultyData();
    renderGenderChart(
      genderFacultyChart,
      data.assignments,
      genderFacultySelect.value || "__all__",
      "Keine explizit datierten Fakultätszugehörigkeiten für diese Auswahl.",
      "Fakultätsangaben ohne auswertbares Anfangsjahr: " + data.undated + "."
    );
  });
  facultyNetworkSelect.addEventListener("change", function () {
    renderFacultyNetwork(collectFacultyData().faculties, facultyNetworkSelect.value);
  });
  mapDialog.addEventListener("click", function (event) {
    if (event.target === mapDialog) closePlacesMap();
  });
  familyDialog.addEventListener("click", function (event) {
    if (event.target === familyDialog) familyDialog.close();
  });
  analyticsDialog.addEventListener("click", function (event) {
    if (event.target === analyticsDialog) analyticsDialog.close();
  });
  mapDialog.addEventListener("cancel", function () {
    mapGeneration += 1;
    if (mapRequestController) mapRequestController.abort();
    mapRequestController = null;
  });
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
