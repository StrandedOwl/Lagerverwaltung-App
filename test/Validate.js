/**
 * Validierung der Produktdaten (Produkt-/Lagerverwaltung)
 *
 * Reine Funktionen ohne Abhängigkeiten (kein Express, kein Dateizugriff).
 * Dadurch lassen sich die Regeln direkt als Unit Tests prüfen (validate.test.js).
 *
 * Datenmodell: { id, name, beschreibung, preis, lagerbestand, kategorie }
 */

// Felder, die der Client setzen darf. Die id vergibt immer der Server.
const FIELDS = ['name', 'beschreibung', 'preis', 'lagerbestand', 'kategorie'];

// Höchstlänge des Produktnamens in Zeichen
const NAME_MAX = 100;

/**
 * Prüft den Request-Body eines Produkts.
 * @param {object} body Request-Body
 * @param {{partial?: boolean}} options
 *        partial = false (POST): name, preis und lagerbestand sind Pflicht.
 *        partial = true  (PUT):  nur die mitgesendeten Felder werden geprüft.
 * @returns {string[]} Liste der Fehlermeldungen (leer = alles gültig)
 */
function validate(body, { partial = false } = {}) {
  const errors = [];
  const has = (k) => body[k] !== undefined; // wurde das Feld mitgesendet?

  // name: nicht leer, höchstens NAME_MAX Zeichen
  if (!partial || has('name')) {
    if (typeof body.name !== 'string' || !body.name.trim()) errors.push('name muss ein nicht-leerer Text sein');
    else if (body.name.length > NAME_MAX) errors.push(`name darf maximal ${NAME_MAX} Zeichen lang sein`);
  }
  // beschreibung und kategorie: optional, aber wenn vorhanden ein Text
  if (has('beschreibung') && typeof body.beschreibung !== 'string') errors.push('beschreibung muss ein Text sein');
  if (has('kategorie') && typeof body.kategorie !== 'string') errors.push('kategorie muss ein Text sein');
  // preis: endliche Zahl >= 0 (NaN und Infinity werden abgelehnt)
  if (!partial || has('preis')) {
    if (typeof body.preis !== 'number' || !Number.isFinite(body.preis) || body.preis < 0) {
      errors.push('preis muss eine Zahl >= 0 sein');
    }
  }
  // lagerbestand: ganze Zahl >= 0, der Bestand kann also nie negativ werden
  if (!partial || has('lagerbestand')) {
    if (!Number.isInteger(body.lagerbestand) || body.lagerbestand < 0) {
      errors.push('lagerbestand muss eine ganze Zahl >= 0 sein');
    }
  }
  return errors;
}

module.exports = { validate, FIELDS, NAME_MAX };