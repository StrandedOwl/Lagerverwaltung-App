# Produkt-/Lagerverwaltung

## Übersicht

Die Produkt-/Lagerverwaltung ist eine eigenständige Systemkomponente des verteilten Lagerverwaltungssystems. Sie ist für die Verwaltung der Produkte und deren Lagerbestände zuständig.

Die Komponente wird unabhängig von den anderen Systemkomponenten entwickelt und kommuniziert über definierte Schnittstellen mit diesen.

## Aufgaben

Die Produkt-/Lagerverwaltung übernimmt folgende Aufgaben:

- Produkte erstellen
- Produkte abrufen
- Produktinformationen bearbeiten
- Produkte löschen
- Lagerbestände verwalten
- Lagerbestände erhöhen oder reduzieren
- Verfügbarkeit von Produkten prüfen
- Produkt- und Lagerdaten für andere Komponenten bereitstellen

## Produktdaten

Ein Produkt enthält die für die Verwaltung benötigten Informationen.

| Attribut | Beschreibung |
|---|---|
| `id` | Eindeutige ID des Produkts |
| `name` | Name des Produkts |
| `description` | Beschreibung des Produkts |
| `price` | Preis des Produkts |
| `stock` | Aktueller Lagerbestand |

Die genaue Struktur der Produktdaten kann während der Entwicklung angepasst werden.

## REST-Schnittstelle

Die Kommunikation mit der Produkt-/Lagerverwaltung erfolgt über eine REST-API.

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/products` | Alle Produkte abrufen |
| `GET` | `/products/:id` | Ein bestimmtes Produkt abrufen |
| `POST` | `/products` | Neues Produkt erstellen |
| `PUT` | `/products/:id` | Produkt aktualisieren |
| `DELETE` | `/products/:id` | Produkt löschen |
| `PATCH` | `/products/:id/stock` | Lagerbestand ändern |

### Beispiel: Produkt erstellen

```http
POST /products
Content-Type: application/json