/**
 * Unit Tests der Validierung (validate.js)
 *
 * Im Unterschied zu API.test.js wird hier kein Server gestartet und kein HTTP verwendet:
 * Die Funktion validate() wird direkt mit Eingaben aufgerufen und ihre Rückgabe geprüft.
 * Die Tests laufen dadurch schnell und brauchen keine zusätzlichen Pakete (nur node:test).
 *
 * Ausführen mit: npm test   (benötigt Node.js 18+)
 * Nur diese Datei: node --test test/validate.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// validate.js liegt im selben Ordner (test/)
const { validate, FIELDS, NAME_MAX } = require('./validate');

// Ein gültiges Produkt als Vorlage für die Tests
const gueltig = { name: 'Schraube M6', beschreibung: 'Edelstahl', preis: 8.9, lagerbestand: 120, kategorie: 'Befestigung' };

describe('validate() im Modus POST (alle Pflichtfelder prüfen)', () => {
  // U1
  it('akzeptiert ein vollständig gültiges Produkt', () => {
    assert.deepEqual(validate(gueltig), []);
  });

  // U2
  it('akzeptiert ein Produkt nur mit den Pflichtfeldern name, preis und lagerbestand', () => {
    assert.deepEqual(validate({ name: 'A', preis: 1, lagerbestand: 0 }), []);
  });

  // U3
  it('meldet fehlende Pflichtfelder bei leerem Body (alle drei Fehler auf einmal)', () => {
    const errors = validate({});
    assert.equal(errors.length, 3);
    assert.match(errors.join(' '), /name/);
    assert.match(errors.join(' '), /preis/);
    assert.match(errors.join(' '), /lagerbestand/);
  });

  // U4
  it('sammelt mehrere Fehler in einer Liste, statt beim ersten abzubrechen', () => {
    const errors = validate({ name: '', preis: -1, lagerbestand: 1.5 });
    assert.equal(errors.length, 3);
  });
});

describe('Feld name', () => {
  // U5
  it('lehnt leeren Text und reine Leerzeichen ab', () => {
    assert.equal(validate({ ...gueltig, name: '' }).length, 1);
    assert.equal(validate({ ...gueltig, name: '   ' }).length, 1);
  });

  // U6
  it('lehnt Werte ab, die kein Text sind (Zahl, null, Objekt)', () => {
    for (const bad of [123, null, {}, []]) {
      assert.equal(validate({ ...gueltig, name: bad }).length, 1, String(JSON.stringify(bad)));
    }
  });

  // U7 (Grenzwerte)
  it('akzeptiert genau 100 Zeichen und lehnt 101 Zeichen ab', () => {
    assert.equal(NAME_MAX, 100);
    assert.deepEqual(validate({ ...gueltig, name: 'a'.repeat(100) }), []);
    const errors = validate({ ...gueltig, name: 'a'.repeat(101) });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /100 Zeichen/);
  });
});

describe('Feld preis', () => {
  // U8 (Grenzwert)
  it('akzeptiert 0 und Dezimalzahlen', () => {
    assert.deepEqual(validate({ ...gueltig, preis: 0 }), []);
    assert.deepEqual(validate({ ...gueltig, preis: 12.5 }), []);
  });

  // U9
  it('lehnt negative Preise ab', () => {
    assert.equal(validate({ ...gueltig, preis: -0.01 }).length, 1);
  });

  // U10
  it('lehnt NaN und Infinity ab', () => {
    assert.equal(validate({ ...gueltig, preis: NaN }).length, 1);
    assert.equal(validate({ ...gueltig, preis: Infinity }).length, 1);
  });

  // U11
  it('lehnt Text, null und fehlenden Preis ab (auch Zahlen als Text wie "5")', () => {
    for (const bad of ['5', null, undefined, true]) {
      assert.equal(validate({ ...gueltig, preis: bad }).length, 1, String(bad));
    }
  });
});

describe('Feld lagerbestand', () => {
  // U12 (Grenzwert)
  it('akzeptiert 0 und positive ganze Zahlen', () => {
    assert.deepEqual(validate({ ...gueltig, lagerbestand: 0 }), []);
    assert.deepEqual(validate({ ...gueltig, lagerbestand: 5000 }), []);
  });

  // U13
  it('lehnt negative Bestände ab (der Bestand darf nie unter 0 fallen)', () => {
    assert.equal(validate({ ...gueltig, lagerbestand: -1 }).length, 1);
  });

  // U14
  it('lehnt Dezimalzahlen ab', () => {
    assert.equal(validate({ ...gueltig, lagerbestand: 1.5 }).length, 1);
  });

  // U15
  it('lehnt Text, NaN, null und fehlenden Bestand ab', () => {
    for (const bad of ['10', NaN, null, undefined]) {
      assert.equal(validate({ ...gueltig, lagerbestand: bad }).length, 1, String(bad));
    }
  });
});

describe('Felder beschreibung und kategorie (optional)', () => {
  // U16
  it('sind optional: ohne diese Felder ist das Produkt gültig', () => {
    const { beschreibung, kategorie, ...ohne } = gueltig;
    assert.deepEqual(validate(ohne), []);
  });

  // U17
  it('müssen Text sein, wenn sie mitgesendet werden', () => {
    assert.equal(validate({ ...gueltig, beschreibung: 5 }).length, 1);
    assert.equal(validate({ ...gueltig, kategorie: false }).length, 1);
  });

  // U18
  it('dürfen leere Texte sein', () => {
    assert.deepEqual(validate({ ...gueltig, beschreibung: '', kategorie: '' }), []);
  });
});

describe('validate() im Modus PUT (partial: nur mitgesendete Felder prüfen)', () => {
  // U19
  it('akzeptiert ein Teil-Update nur mit lagerbestand', () => {
    assert.deepEqual(validate({ lagerbestand: 50 }, { partial: true }), []);
  });

  // U20
  it('prüft das mitgesendete Feld trotzdem (ungültiger Bestand wird abgelehnt)', () => {
    assert.equal(validate({ lagerbestand: -5 }, { partial: true }).length, 1);
    assert.equal(validate({ preis: 'gratis' }, { partial: true }).length, 1);
  });

  // U21
  it('verlangt keine Pflichtfelder, die nicht mitgesendet wurden', () => {
    assert.deepEqual(validate({ kategorie: 'Neu' }, { partial: true }), []);
    assert.deepEqual(validate({}, { partial: true }), []); // "leerer Body" fängt der Server separat ab
  });

  // U22
  it('prüft den Namen nur, wenn er mitgesendet wird', () => {
    assert.deepEqual(validate({ preis: 3 }, { partial: true }), []);
    assert.equal(validate({ name: '  ' }, { partial: true }).length, 1);
  });
});

describe('FIELDS', () => {
  // U23
  it('enthält genau die vom Client setzbaren Felder und nicht die id', () => {
    assert.deepEqual(FIELDS, ['name', 'beschreibung', 'preis', 'lagerbestand', 'kategorie']);
    assert.ok(!FIELDS.includes('id'));
  });
});