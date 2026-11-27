
# ProfKat Datenaufarbeitung

Um den ProKat Datensatz für die weitere Analyse vorzubereiten, wird in diesem Repository eine grafische Benutzeroberfläche bereitgestellt. 
Diese dienen der Überprüfung, Bereinigung, und Transformation der Daten und zu ihrem Export im anvisierten Datenformat.

Da es sich bei diesem Datensatz um einen **personenbezogenen** Datensatz handelt, werden Import, Umwandlung, Bearbeitung und Export lokal im Browser durchgeführt. Der **Datensatz selbst ist nicht in diesem Repository** enthalten und wird nicht als Ganzes an externe Dienste übertragen. An eine Person angehängte Dateien werden in der lokalen JSON-Datei eingebettet und nicht an einen Server übertragen.
Die optionale Kartenfunktion ist eine begrenzte Ausnahme: Für die Ortsverortung werden einzelne Ortsnamen an einen externen Geocodierungsdienst gesendet; Personen- und Biografiedaten werden dabei nicht übertragen. Weitere Hinweise dazu stehen im Abschnitt „Orte kartografisch darstellen“.
Der Datensatz darf nicht durch Anwendungen von Drittanbietern, insbesondere durch KI-gestützte Tools, verarbeitet werden, da dies ein Risiko für die Privatsphäre der betroffenen Personen darstellen könnte.

Haupziel dieses Repository ist es, ein benutzerfreundliches Werkzeug bereitzustellen, das es ermöglicht, den ProKat Datensatz (oder Teile davon) effizient und sicher zu verarbeiten und in einem standardisierten Format für die weitere Analyse bereitzustellen.

## Erste Schritte

Bevor Sie mit der Datenaufarbeitung beginnen, müssen Sie erst ihre eigene Kopie des Repository erstellen und auf Ihren lokalen Rechner herunterladen.
Hierzu führen sie bitte die folgenden Schritte aus:

- Dies ist ein "Template Repository", das bedeutet, dass Sie zunächst eine eigene Kopie des Repositorys erstellen müssen.
  - Klicken Sie hierzu auf die Schaltfläche "Use this template" (oben rechts) und wählen Sie "Create a new repository".
  - Geben Sie einen Namen für Ihr neues Repository ein und klicken Sie auf "Create repository from template".
- Nun sollten sie in ihrem eigenen GitHub Account eine Kopie des Repositorys haben.
- Klonen Sie nun das (online) Repository auf ihren lokalen Rechner mit Hilfe von Visual Studio Code oder einem anderen Git-Client.
  - in VScode können Sie dies über die folgenden Schaltflächen tun:
    - Klicken Sie auf das Symbol "Source Control" (links in der Seitenleiste).
    - Klicken Sie auf die Schaltfläche "Clone Repository" und geben Sie die URL ihres Repositorys ein.
    - Wählen Sie einen lokalen Ordner aus, in dem das Repository geklont werden soll.


## Anforderungen

Die Anforderungen für die Umsetzung der Datenaufarbeitung sind in der Datei `task-description.md` dokumentiert. 

- Das ursprüngliche Datenformat ist in der Datei `import-data-format.md` beschrieben.
- Ein Beispieldatensatz ist in der Datei `import-data-example.txt` enthalten.
- Das anvisierte Zieldateiformat ist in der Datei `export-data-format.md` beschrieben.

## TUSTEP-Dateien in JSON umwandeln

Die lokale WebApp liest TUSTEP-Textdateien ein und wandelt die erkannten Datensätze in das in `export-data-format.md` beschriebene JSON-Format um:

1. Starte den lokalen Webserver wie unten beschrieben und öffne `http://localhost:8000`.
2. Lade eine `.txt`-Datei hoch, ziehe sie in das Dateifeld oder füge TUSTEP-Code direkt in das Quelltextfeld ein. Mit **Beispieldaten laden** kannst du den mitgelieferten Beispieldatensatz öffnen.
3. Erzeuge die Vorschau. Bei erfolgreichem Import öffnet sich die Eintragsübersicht in einem neuen Fenster. Falls der Browser das Pop-up blockiert, erlaube Pop-ups für die lokale Website und klicke auf **Einträge im neuen Fenster öffnen**. Dort kannst du Datensätze suchen und filtern, Hinweise prüfen und Einträge im Formular bearbeiten. Die vollständigen JSON-Daten eines Eintrags lassen sich bei Bedarf einblenden und bearbeiten.
4. Mit **Datensätze zur Übersicht hinzufügen** kannst du ein weiteres TUSTEP-Ergebnis an eine bereits geöffnete Übersicht anhängen. In der Übersicht kannst du außerdem über **JSON-Datei hinzufügen** ein einzelnes JSON-Objekt oder ein JSON-Array importieren. Die Schaltfläche **Zum TUSTEP-Konverter** führt zurück zur Importseite.
5. Exportiere aus der Übersicht die gerade sichtbaren Datensätze als JSON. Der Konverter bietet zusätzlich den Export des vollständigen JSON-Arrays.

Import, Umwandlung, Bearbeitung und Backup laufen im Browser. TUSTEP- und JSON-Daten werden nicht an einen Server übertragen. Die Beispieldatei wird vom lokalen Webserver geladen.

### Orte kartografisch darstellen

In der Eintragsübersicht erstellt **Karte erstellen** eine Karte aus den aktuell sichtbaren Datensätzen. In der Detailansicht einer ausgewählten Person erstellt **Karte für diese Person erstellen** dagegen eine Karte nur für diesen Datensatz. Dafür werden Geburts- und Sterbeorte sowie Ortsmarkierungen `((o...))` aus den übrigen Feldern ausgewertet. Namensgleiche Treffer werden als gestrichelte, unbestätigte Vorschläge eingezeichnet und bleiben zur manuellen Auswahl markiert; einzelne alternative Suchtreffer erscheinen ebenfalls unbestätigt. Weitere Ortsnennungen werden mit ihrem Quellfeld beschriftet und nicht automatisch als Wohnorte interpretiert.

Die Karte benötigt eine Internetverbindung. Für die Ortssuche wird [Photon](https://photon.komoot.io/) mit OpenStreetMap-Daten verwendet; die Kartenkacheln liefert [OpenStreetMap Deutschland](https://tile.openstreetmap.de/) auf Grundlage von [OpenStreetMap-Daten](https://www.openstreetmap.org/copyright). An den Ortsdienst werden nur eindeutige Ortsnamen gesendet, keine Namen von Personen, PITs oder Biografietexte. Die Anfragen erfolgen einzeln und höchstens einmal pro Sekunde; Suchergebnisse werden lokal im Browser zwischengespeichert. Eindeutige Namens-Treffer erscheinen als Vorschläge; mehrdeutige Treffer müssen ausgewählt werden, nicht gefundene Orte bleiben unverortet. Koordinaten sind externe Vorschläge und werden nicht in die JSON-Datensätze übernommen.

### Verwandtschaftsgrafik

In der Detailansicht öffnet **Verwandtschaft anzeigen** eine schreibgeschützte Ansicht zu den im Datensatz genannten Eltern, Ehepartnern und Kindern. Ein anderer Eintrag wird nur dann automatisch verknüpft, wenn sein Name oder eine Namensvariante eindeutig passt. Bei mehreren passenden Einträgen ist eine manuelle Auswahl nötig; fehlende oder nicht eindeutig passende Personen bleiben unverknüpft. Die Grafik ändert keine Datensatzangaben.

### Auswertungen und Visualisierungen

Über **Auswertungen** in der Eintragsübersicht stehen Kennzahlen zur Datenvollständigkeit, Geburtsjahrzehnte und Fakultätsverteilungen, ein auswählbarer Lebens- und Karriere-Zeitstrahl pro Person sowie ein akademisches Netzwerk nach Fakultät zur Verfügung. Personen im Netzwerk lassen sich anklicken, um ihren Datensatz in der Übersicht aufzurufen.

Die Geschlechterverteilungen für Arbeitspositionen und Fakultäten werden getrennt nach Jahrzehnten dargestellt. Sie beziehen sich auf alle geladenen Datensätze, nicht nur auf aktuell sichtbare oder gefilterte Einträge. Positionen werden ausschließlich aus klar erkennbaren Titeln in „(12) Berufslaufbahn“ gruppiert; nicht erkannte und nicht datierbare Einträge werden gezählt, aber nicht einer Position oder einem Zeitraum zugeordnet. Die Originalangaben bleiben unverändert. Ausdrücklich angegebene Zeiträume werden jedem überlappenden Jahrzehnt zugeordnet; pro Datensatz, Kategorie und Jahrzehnt wird höchstens einmal gezählt. Fakultäten werden nicht mit Positionen verknüpft, da die Daten diese Zuordnung nicht durchgehend belegen. Unbekannte oder andere Geschlechtsangaben erscheinen separat und gehen nicht in die Prozentwerte für Männer und Frauen ein.

Alle Visualisierungen sind lesende Auswertungen: Sie ändern weder die Quelldatensätze noch ergänzen sie fehlende Angaben. Nicht auswertbare Jahreszahlen und Zuordnungen werden nicht geschätzt.

### Digitale Ressourcen pro Person

Im Detailbereich eines Datensatzes lassen sich Weblinks und lokale Dateien mit der ausgewählten Person verknüpfen. Links müssen mit HTTP oder HTTPS beginnen. Anhänge werden in den Datensatz eingebettet und beim JSON-Export sowie im Backup mitgespeichert; sie werden nicht an einen Server übertragen. Die Dateien werden Base64-kodiert und vergrößern dadurch JSON-Exporte und Backups. Eine anwendungsseitige Dateigrößenbegrenzung gibt es nicht, aber sehr große Dateien können den Browser verlangsamen oder dessen Speichergrenzen erreichen. Behandle Anhänge und Backups als personenbezogene, nicht verschlüsselte Daten.

Die optionalen Einträge stehen im Datensatz unter `Digitale Ressourcen`. Das Format ist im Abschnitt „Optionale digitale Ressourcen in der Eintragsübersicht“ in `export-data-format.md` beschrieben.

### Lokales Backup für einen Rechnerwechsel

1. Erzeuge eine gültige JSON-Vorschau und klicke auf **Backup herunterladen**. Die `.prokat-backup.json`-Datei enthält sowohl den TUSTEP-Quelltext als auch das aktuelle JSON einschließlich eingebetteter Dateien.
2. Übertrage die Datei bei Bedarf auf den anderen Rechner und wähle sie dort in der WebApp aus.
3. Klicke auf **Backup laden**, um Quelltext und JSON wiederherzustellen.

Das Backup ist **nicht verschlüsselt** und enthält personenbezogene Daten. Lege es nur auf einem geschützten Gerät ab und übertrage es ausschließlich über einen dafür zugelassenen, sicheren Weg. Nicht ins GitHub-Repository oder in einen nicht freigegebenen Cloudspeicher legen. `.prokat-backup.json`-Dateien werden von Git ignoriert. Die Übertragung ist manuell; eine automatische Synchronisierung gibt es nicht.

## Lokale Ausführung

Da ein Webseiten-basiertes Interface zu erstellen ist, muss der Inhalt (die Webseite) des Repositorys lokal auf dem Rechner ausgeführt werden.
Hierzu kann ein lokaler Webserver verwendet werden, was am einfachsten mit Python realisiert werden kann.

### Schritt 1 - Clonen des Repositorys

Um die Webseite lokal auszuführen, muss das Repository zunächst auf den lokalen Rechner geklont werden.
Dies kann entweder via git oder durch Herunterladen der ZIP-Datei erfolgen.

### Schritt 2 - Lokaler Webserver mit Python

Damit die Webseite im vollen Funktionsumfang lokal ausgeführt werden kann, muss ein lokaler Webserver gestartet werden.
Hierzu kann Python verwendet werden, das auf den meisten Systemen bereits vorinstalliert ist oder leicht installiert werden kann.

Die Fähigkeit, einen lokalen Webserver zu starten, ist im Basispaket von Python 3 bereits integriert und benötigt keine zusätzlichen Pakete.

Um den lokalen Webserver zu starten, navigieren Sie in das Verzeichnis, in dem sich die geklonten Dateien befinden, und führen Sie den folgenden Befehl aus:

```bash
# Für Python 3.x
python -m http.server 8000 --bind 127.0.0.1
```

Durch `--bind 127.0.0.1` ist der Webserver nur auf diesem Rechner erreichbar und nicht für andere Geräte im Netzwerk freigegeben.

### Schritt 3 - Zugriff auf die Webseite

Nachdem der lokale Webserver gestartet wurde, können Sie die Webseite in Ihrem Webbrowser aufrufen, indem Sie die folgende URL eingeben/verwenden:

- [http://localhost:8000](http://localhost:8000)

Hiermit greift der Browser direkt auf den eigenen Rechner zu und kommuniziert mit dem gestarteten lokalen Webserver, wodurch die Webseite im vollen Funktionsumfang ausgeführt werden kann.

Ein direktes Öffnen von `index.html` funktioniert auch ohne Python für Datei-Upload, Umwandlung, Vorschau und Export. Aus Sicherheitsgründen kann der Browser dabei die Beispieldatei nicht automatisch laden. Wähle in diesem Fall `import-data-example.txt` manuell über **Datei auswählen** aus. Für den automatischen Beispieldaten-Button empfiehlt sich der lokale Webserver.


### Schritt 4 - Beenden des lokalen Webservers

Um den lokalen Webserver zu beenden, können Sie im Terminal, in dem der Server gestartet wurde, die Tastenkombination `Strg + C` verwenden.

Alternativ können Sie das Terminal-Fenster schließen, in dem der Server läuft.


### Webseiten-Aktualisierung bei live Änderungen

Sie können während der Webserver-Ausführung Änderungen an den Dateien vornehmen und die Webseite im Browser aktualisieren, um die Änderungen zu sehen.
Hierzu ist *kein Neustart des Webservers erforderlich*. 
Dieser wird automatisch die Änderungen erkennen und die aktualisierten Dateien bereitstellen.

Hierzu müssen Sie lediglich die **Seite im Browser neu laden** (z.B. durch Drücken der Taste `F5` oder durch Klicken auf die Schaltfläche "Aktualisieren" im Browser).
Beachten sie dabei, dass die meisten Browser die Dateien zwischenspeichern (Caching), sodass Änderungen an den Dateien nicht sofort sichtbar sind.

Sie können das **Caching umgehen**, indem Sie die Seite mit der Tastenkombination `Strg + F5` (Windows) oder `Cmd + Shift + R` (Mac) neu laden.


