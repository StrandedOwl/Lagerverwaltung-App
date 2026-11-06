require("dotenv").config();
const express = require("express");
const path = require("path");
const statistikRouter = require("./routes/statistik");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "statistik" });
});

app.use("/api/statistik", statistikRouter);

// Testdaten anstelle der echten Benutzer-/Produktverwaltung (nur für die Entwicklung).
if (process.env.MOCK_DATEN === "true") {
  app.use("/api", require("./mock/testdaten"));
  console.log("Hinweis: Testdaten für /api/benutzer und /api/produkte sind aktiv.");
}

app.listen(PORT, () => {
  console.log(`Statistik-Service läuft auf http://localhost:${PORT}`);
});
