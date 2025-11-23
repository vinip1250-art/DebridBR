import express from "express";
import fetch from "node-fetch";

const app = express();

// Servir arquivos estáticos da pasta public
app.use(express.static("public"));

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

app.get("/catalog/:type/:id.json", async (req, res) => {
  res.json({ metas: [] });
});

app.get("/stream/:type/:id.json", async (req, res) => {
  res.json({ streams: [] });
});

// Rota fallback para servir index.html em "/"
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Addon rodando na porta ${port}`));
