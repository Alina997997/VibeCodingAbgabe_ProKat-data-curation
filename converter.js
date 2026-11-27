(function (root) {
  "use strict";

  const FIELD_NAMES = {
    "0": "(0) PK",
    "0a": "(012) Uni-Angehörigkeit",
    "011": "(011) Geschlecht",
    "012": "(012) Uni-Angehörigkeit",
    "1": "(1) Name",
    "1*": "(1*) Namensvarianten",
    "1a": "(1a) Kurzcharakterisierung",
    "1b": "(1b) Studium-in-Tübingen",
    "1c": "(1c) Biogramme",
    "1d": "(1d) Würdigung",
    "2": "(2+3) Fakultätszugehörigkeit",
    "3": "(2+3) Fakultätszugehörigkeit",
    "4": "(4) Lehrfach",
    "5": "(5) Konfession",
    "6": "(6+7) Lebensdaten",
    "7": "(6+7) Lebensdaten",
    "7a": "(7a) Begräbnisdaten",
    "8": "(8+9) Eltern",
    "9": "(8+9) Eltern",
    "10": "(10) Ehepartner",
    "10a": "(10a) Kinder",
    "11": "(11) Bildungsgang",
    "12": "(12) Berufslaufbahn",
    "13": "(13) Akademische-Ämter",
    "14": "(14) Titel",
    "15": "(15) Mitgliedschaft Wissenschaft",
    "15a": "(15a) Mitgliedschaft Studium",
    "17c": "(17) Archivalische-Quellen",
    "17d": "(17) Archivalische-Quellen",
    "18": "(18) Literatur",
    "18a": "(18a) Online-Quellen",
    "19": "(19) Bildnachweise",
    "20": "(20) Bemerkungen",
    "21": "(21) Bearbeiter",
    "23": "(23) BIB",
    "24": "(24) GND"
  };

  function normalizeTag(number, star, suffix) {
    const digits = number === "011" || number === "012" ? number : String(parseInt(number, 10));
    return digits + (star ? "*" + (suffix || "") : (suffix || ""));
  }

  function splitTaggedLine(line) {
    const marker = /#(\d{1,3})(\*)?([a-z])?/gi;
    const matches = [];
    let match;
    while ((match = marker.exec(line)) !== null) {
      matches.push({
        index: match.index,
        end: marker.lastIndex,
        tag: normalizeTag(match[1], match[2], match[3])
      });
    }
    if (!matches.length || line.slice(0, matches[0].index).trim()) return null;

    return matches.map(function (item, index) {
      const end = index + 1 < matches.length ? matches[index + 1].index : line.length;
      return { tag: item.tag, value: line.slice(item.end, end).trim() };
    });
  }

  function splitList(value) {
    return value.split(";").map(function (item) { return item.trim(); }).filter(Boolean);
  }

  function cleanText(value) {
    return value.replace(/\{[^}]*\}/g, "").trim().replace(/\s+/g, " ");
  }

  function cleanPlace(value) {
    return value.replace(/\(\(o([\s\S]*?)\)\)/g, "$1").trim();
  }

  function parseName(value, warnings, recordNumber) {
    const result = { PIT: "", Nachname: "", Vorname: "", Geburtsjahr: "", Sterbejahr: "" };
    const pitMatch = value.match(/^PIT\s+(\S+)\s*%\s*(.*)$/i);
    let nameText = value;
    if (pitMatch) {
      result.PIT = pitMatch[1];
      nameText = pitMatch[2];
    } else {
      warnings.push({ record: recordNumber, message: "Namensfeld ohne PIT-Kennung; Name wurde soweit möglich übernommen." });
    }

    const yearsMatch = nameText.match(/\((\d{3,4})\s*-\s*(\d{0,4})\)\s*$/);
    if (yearsMatch) {
      result.Geburtsjahr = yearsMatch[1];
      result.Sterbejahr = yearsMatch[2];
      nameText = nameText.slice(0, yearsMatch.index).trim();
    }

    const comma = nameText.indexOf(",");
    if (comma < 0) {
      const unparsedName = nameText.trim();
      if (unparsedName) result["Unaufgeteilter Name"] = unparsedName;
      warnings.push({ record: recordNumber, message: "Name ohne Komma: Nach- und Vorname konnten nicht getrennt werden." });
    } else {
      result.Nachname = nameText.slice(0, comma).trim();
      result.Vorname = nameText.slice(comma + 1).trim();
    }
    return result;
  }

  function parseDatePlace(value, tag, recordNumber, warnings) {
    const parts = value.trim().match(/^(\S+)?(?:\s+([\s\S]*))?$/);
    if (!parts) return { date: "", place: "" };
    const date = parts[1] || "";
    const dateMatch = date.match(/^(\d{1,2})\.(\d{1,2})\.(\d{3,4})$/);
    if (date && !dateMatch) {
      warnings.push({ record: recordNumber, message: "Datum in #" + tag + " ist nicht eindeutig lesbar; erwartet wird T.M.JJJJ." });
    } else if (dateMatch) {
      const day = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const year = Number(dateMatch[3]);
      const checked = new Date(Date.UTC(year, month - 1, day));
      if (checked.getUTCFullYear() !== year || checked.getUTCMonth() !== month - 1 || checked.getUTCDate() !== day) {
        warnings.push({ record: recordNumber, message: "Ungültiges Kalenderdatum in #" + tag + ": „" + date + "“." });
      }
    }
    const place = parts[2] || "";
    if (/\(\(o/.test(place) && !/\(\(o[^)]*\)\)/.test(place)) {
      warnings.push({ record: recordNumber, message: "Ortsmarkierung in #" + tag + " ist nicht vollständig geschlossen." });
    }
    return {
      date: date,
      place: cleanPlace(place)
    };
  }

  function parseSpouses(value) {
    return value
      .replace(/;\s*(?=[a-z]\)\s*)/gi, "\n")
      .split("\n")
      .map(function (entry) {
        let text = entry.trim().replace(/^[a-z]\)\s*/i, "");
        if (!text) return null;
        const spouse = {};
        const year = text.match(/^(\d{3,4})\s+/);
        if (year) {
          spouse.Eheschließung = year[1];
          text = text.slice(year[0].length).trim();
        }

        const widowIndex = text.search(/,\s*Witwe des\s+/i);
        if (widowIndex >= 0) {
          spouse.Bemerkung = text.slice(widowIndex + 2).trim();
          text = text.slice(0, widowIndex).trim();
        }
        const daughter = text.match(/,\s*Tochter des\s+([\s\S]*)$/i);
        if (daughter) {
          spouse.Name = text.slice(0, daughter.index).trim();
          spouse.Vater = daughter[1].trim();
        } else {
          spouse.Name = text;
        }
        return spouse;
      })
      .filter(Boolean);
  }

  function splitReferences(value) {
    const chunks = value.split(/(?=\*{1,2}(?:ao|nz)\b)/i);
    return chunks.map(function (chunk) {
      return chunk.replace(/^\*{1,2}(?:ao|nz)\s*/i, "").trim().replace(/\.\s*$/, "");
    }).filter(Boolean);
  }

  function addWarningsForDuplicates(fields, recordNumber, warnings) {
    Object.keys(fields).forEach(function (tag) {
      if (fields[tag].length > 1 && tag !== "0a" && tag !== "012" && tag !== "1*" && tag !== "2" && tag !== "3" && tag !== "17c" && tag !== "17d" && tag !== "18" && tag !== "18a" && tag !== "19") {
        warnings.push({
          record: recordNumber,
          message: "Feld #" + tag + " kommt mehrfach vor; alle Werte wurden zusammengeführt oder der erste Wert verwendet."
        });
      }
    });
  }

  function convertRecord(fields, recordNumber, warnings) {
    addWarningsForDuplicates(fields, recordNumber, warnings);
    const first = function (tag) { return fields[tag] && fields[tag].length ? fields[tag][0] : ""; };
    const result = {
      "(0) PK": first("0").replace(/\s+\.$/, "").trim(),
      "(011) Geschlecht": first("011"),
      "(012) Uni-Angehörigkeit": (fields["012"] || []).concat(fields["0a"] || []).map(function (value) {
        return value.replace(/^UNIANG:\s*/i, "").trim();
      }).filter(Boolean),
      "(1) Name": { PIT: "", Nachname: "", Vorname: "", Geburtsjahr: "", Sterbejahr: "" },
      "(1*) Namensvarianten": (fields["1*"] || []).map(function (value) {
        return parseName(value, warnings, recordNumber);
      }),
      "(1a) Kurzcharakterisierung": cleanText(first("1a")).replace(/\.$/, ""),
      "(1b) Studium-in-Tübingen": cleanText(first("1b")).replace(/\.$/, ""),
      "(1c) Biogramme": cleanText(first("1c")).replace(/\.$/, ""),
      "(1d) Würdigung": cleanText(first("1d")),
      "(2+3) Fakultätszugehörigkeit": [],
      "(4) Lehrfach": splitList(first("4")),
      "(5) Konfession": first("5"),
      "(6+7) Lebensdaten": {
        Geburtsdatum: "",
        Geburtsort: "",
        Sterbedatum: "",
        Sterbeort: "",
        "(7a) Begräbnisdaten": cleanPlace(first("7a"))
      },
      "(8+9) Eltern": { Vater: first("8"), Mutter: first("9") },
      "(10) Ehepartner": parseSpouses(first("10")),
      "(10a) Kinder": splitList(first("10a")),
      "(11) Bildungsgang": splitList(first("11")),
      "(12) Berufslaufbahn": splitList(first("12")),
      "(13) Akademische-Ämter": splitList(first("13")),
      "(14) Titel": splitList(first("14")),
      "(15) Mitgliedschaft Wissenschaft": splitList(first("15")),
      "(15a) Mitgliedschaft Studium": splitList(first("15a")),
      "(17) Archivalische-Quellen": { UAT: [], Andere: [] },
      "(18) Literatur": splitReferences((fields["18"] || []).join(" ")),
      "(18a) Online-Quellen": splitReferences((fields["18a"] || []).join(" ")),
      "(19) Bildnachweise": splitReferences((fields["19"] || []).join(" ")),
      "(20) Bemerkungen": splitList(first("20")),
      "(21) Bearbeiter": first("21"),
      "(23) BIB": first("23").replace(/\s+/g, ""),
      "(24) GND": splitList(first("24")).map(function (value) {
        return value.replace(/^GND\s*/i, "");
      })
    };

    if (fields["1"] && fields["1"].length) {
      result["(1) Name"] = parseName(first("1"), warnings, recordNumber);
    } else {
      warnings.push({ record: recordNumber, message: "Datensatz ohne #1-Namen." });
    }

    const years = (fields["2"] || []).reduce(function (all, value) { return all.concat(splitList(value)); }, []);
    const faculties = (fields["3"] || []).reduce(function (all, value) { return all.concat(splitList(value)); }, []);
    const facultyCount = Math.max(years.length, faculties.length);
    for (let index = 0; index < facultyCount; index += 1) {
      const period = (years[index] || "").match(/^(\d{3,4})\s*[-–]\s*(\d{0,4})$/);
      if (years[index] && !period) {
        warnings.push({ record: recordNumber, message: "Zeitraum in #2 nicht eindeutig lesbar: „" + years[index] + "“." });
      }
      result["(2+3) Fakultätszugehörigkeit"].push({
        Anfangsjahr: period ? period[1] : "",
        Endjahr: period ? period[2] : "",
        Fakultät: faculties[index] || ""
      });
    }
    if (years.length !== faculties.length && (years.length || faculties.length)) {
      warnings.push({ record: recordNumber, message: "#2-Zeiträume und #3-Fakultäten haben unterschiedliche Anzahlen." });
    }

    const birth = parseDatePlace(first("6"), "6", recordNumber, warnings);
    const death = parseDatePlace(first("7"), "7", recordNumber, warnings);
    result["(6+7) Lebensdaten"].Geburtsdatum = birth.date;
    result["(6+7) Lebensdaten"].Geburtsort = birth.place;
    result["(6+7) Lebensdaten"].Sterbedatum = death.date;
    result["(6+7) Lebensdaten"].Sterbeort = death.place;

    (fields["17c"] || []).concat(fields["17d"] || []).forEach(function (value) {
      splitReferences(value).forEach(function (reference) {
        const key = /^UAT\b/i.test(reference) ? "UAT" : "Andere";
        result["(17) Archivalische-Quellen"][key].push(reference);
      });
    });

    return result;
  }

  function parse(source) {
    const records = [];
    const warnings = [];
    const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
    let currentLines = [];
    let currentStart = 1;

    function finishRecord() {
      if (!currentLines.length) return;
      const fields = Object.create(null);
      const recordWarnings = [];
      currentLines.forEach(function (item) {
        const entries = splitTaggedLine(item.text);
        if (!entries) {
          recordWarnings.push({ record: records.length + 1, line: item.line, message: "Zeile ohne erkennbares Feldkennzeichen wurde übersprungen." });
          return;
        }
        entries.forEach(function (entry) {
          if (!Object.prototype.hasOwnProperty.call(FIELD_NAMES, entry.tag)) {
            recordWarnings.push({ record: records.length + 1, line: item.line, message: "Unbekanntes Feld #" + entry.tag + " wurde nicht in das JSON übernommen." });
            return;
          }
          if (!fields[entry.tag]) fields[entry.tag] = [];
          fields[entry.tag].push(entry.value);
        });
      });
      const hasData = Object.keys(fields).some(function (tag) {
        return fields[tag].some(function (value) { return Boolean(value.trim()); });
      });
      if (!hasData) {
        recordWarnings.forEach(function (warning) { warning.record = 0; });
        warnings.push.apply(warnings, recordWarnings);
        warnings.push({
          record: 0,
          line: currentStart,
          message: "Quellblock enthält keine unterstützten Daten und wurde nicht als Datensatz übernommen."
        });
      } else {
        records.push(convertRecord(fields, records.length + 1, recordWarnings));
        warnings.push.apply(warnings, recordWarnings);
      }
      currentLines = [];
    }

    lines.forEach(function (line, index) {
      const trimmed = line.trim();
      if (trimmed === "##") {
        finishRecord();
        currentStart = index + 2;
      } else if (trimmed) {
        if (!currentLines.length) currentStart = index + 1;
        currentLines.push({ text: line, line: index + 1 });
      }
    });
    finishRecord();

    if (!records.length && source.trim()) {
      warnings.push({ record: 0, message: "Keine TUSTEP-Datensätze erkannt. Prüfe Feldkennzeichen wie #0 und #1." });
    }
    return { records: records, warnings: warnings };
  }

  const converter = { parse: parse };
  if (typeof module !== "undefined" && module.exports) module.exports = converter;
  else root.TustepConverter = converter;
})(typeof globalThis !== "undefined" ? globalThis : this);
