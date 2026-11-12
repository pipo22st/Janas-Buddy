# Buddy – mit Buchhaltung

Die Buddy-App (Gewohnheiten, Geld, Körper, Essen, Wissen), bei der statt des Trainingsbereichs eine **Buchhaltung für Selbständige** eingebaut ist.

**Buchhaltung** (Tab unten):
- Einnahmen und Ausgaben mit Datum, Betrag, Ordner, Kontakt, Rechnungsnummer und Status (bezahlt/offen)
- Rechnungen und Zahlungsbestätigungen als Foto oder PDF anhängen
- Ordner (Kategorien) frei anlegen und umbenennen
- Steuer-Übersicht pro Jahr: Summen, Quartale, Ordner, fehlende Belege, Kleinunternehmergrenze
- Export als Excel-Tabelle (.xlsx), CSV oder ZIP mit allen Belegen
- Auf der Startseite: Jahresübersicht und schnelles Eintragen

Die Daten liegen **nur auf dem jeweiligen Gerät** (im Browser-Speicher). Sie werden nicht in dieses Repository und auf keinen Server hochgeladen.

## Online stellen (GitHub Pages)

1. Auf github.com ein neues Repository anlegen, z. B. `buddy`. Mit einem Gratis-Konto muss es **öffentlich** sein, damit GitHub Pages funktioniert. Öffentlich ist nur der Programmcode – die Einträge und Belege sind nie im Repository.
2. Im Repository auf **Add file → Upload files** gehen und den **Inhalt** dieses Ordners hineinziehen (`index.html` muss direkt im Hauptverzeichnis liegen). Die Ordner `icons` und `vendor` mit hochladen. Dann **Commit changes**.
3. **Settings → Pages**: bei *Source* „Deploy from a branch“, Branch `main`, Ordner `/ (root)`, **Save**.
4. Nach ein bis zwei Minuten ist die App erreichbar unter
   `https://<github-name>.github.io/<repository-name>/`

## Als App installieren

**Wichtig:** Zuerst installieren, dann eintragen. Am iPhone hat die App am Homescreen einen eigenen Speicher, getrennt von Safari.

- **iPhone/iPad:** Adresse in **Safari** öffnen → Teilen-Symbol → **Zum Home-Bildschirm**.
- **Android:** Adresse in **Chrome** öffnen → Menü (⋮) → **App installieren** bzw. **Zum Startbildschirm hinzufügen**.
- **Laptop:** In Chrome oder Edge rechts in der Adressleiste auf das Installieren-Symbol klicken – oder als Lesezeichen verwenden.

## Daten vom Handy auf den Laptop übertragen

1. Am Handy: **Mehr → Komplett-Sicherung**. Im Teilen-Menü z. B. AirDrop, Mail, „In Dateien sichern“ oder Google Drive wählen.
2. Die Datei `buddy-sicherung-JJJJ-MM-TT.zip` auf den Laptop bringen.
3. Am Laptop: **Mehr → Abgleich → Sicherung wählen** → Vorschau prüfen → **Übernehmen**.

Das funktioniert in beide Richtungen. Die Sicherung enthält alles, auch alle Belege.
- **Buchhaltung:** Neue Buchungen kommen dazu, bei geänderten gewinnt die zuletzt bearbeitete Fassung, und was auf einem Gerät gelöscht wurde, wird auch auf dem anderen entfernt.
- **Übrige Bereiche** (Gewohnheiten, Geld, Gewicht …): Neue Einträge werden ergänzt, Bestehendes wird nicht verändert.

Eine Sicherung aus der eigenständigen App „Buddy Atelier“ (`Atelier-Sicherung_….zip`) lässt sich ebenfalls über den Abgleich einspielen.

Die Komplett-Sicherung ist auch die **Datensicherung**: Geht das Handy verloren oder wird der Browser-Speicher gelöscht, sind die Daten sonst weg.

## Updates

Werden Dateien im Repository ersetzt, lädt die App beim nächsten Öffnen mit Internet automatisch die neue Fassung. Die gespeicherten Daten bleiben erhalten.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die App |
| `adapter.js` | Speicher auf dem Gerät, Dateien speichern/teilen |
| `sw.js` | Offline-Betrieb |
| `manifest.webmanifest` | Name und Symbol für die Installation |
| `icons/` | App-Symbole |
| `vendor/` | JSZip (ZIP) und SheetJS (Excel), Lizenzen in `vendor/LIZENZEN.md` |

## Hinweise

- In dieser Fassung gibt es keine Funktionen, die Claude brauchen (z. B. Belege oder Essen aus Fotos auslesen, Begriffe nachschlagen).
- Die Daten liegen in einem eigenen Speicher namens `buddy-buchhaltung`. Läuft eine andere Buddy-Fassung unter demselben GitHub-Konto, vermischen sich die Daten deshalb nicht.
- Die Buchhaltung ist eine Ordnungshilfe. Sie berechnet keine Steuer und ersetzt keine Steuerberatung. Originalbelege zusätzlich aufbewahren.
