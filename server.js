import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// Manifesto Stremio
const manifest = {
  id: "brscrap.brazuca.debrid",
  version: "1.0.0",
  name: "Brazuca + Debrid",
  description: "Addon que envolve Brazuca Torrents com Real-Debrid/Torbox",
  catalogs: [
    { type: "movie", id: "brazuca-movies", name: "Brazuca Movies" },
    { type: "series", id: "brazuca-series", name: "Brazuca Series" }
  ],
  resources: ["catalog", "stream"],
  types: ["movie", "series"],
  idPrefixes: ["tt"]
};

app.get("/manifest.json", (req, res) => res.json(manifest));

app.get("/catalog/:type/:id.json", (req, res) => {
  res.json({ metas: [] });
});

app.get("/stream/:type/:id.json", (req, res) => {
  res.json({ streams: [] });
});

// Fallback para servir index.html em qualquer rota não reconhecida
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Addon rodando na porta ${port}`));
