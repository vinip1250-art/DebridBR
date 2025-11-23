import express from "express";
import fetch from "node-fetch";

const app = express();

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

// Catálogo (placeholder)
app.get("/catalog/:type/:id.json", async (req, res) => {
  res.json({ metas: [] });
});

// Stream resolver
app.get("/stream/:type/:id.json", async (req, res) => {
  const { type, id } = req.params;

  // TODO: Scraping Brazuca Torrents
  const candidates = await scrapeBrazuca({ type, id });

  // TODO: Selecionar melhor torrent
  const chosen = candidates[0];

  // Configuração (via env ou stremthru)
  const useRD = process.env.USE_RD === "true";
  const useTorbox = process.env.USE_TORBOX === "true";
  const useStremThru = process.env.USE_STREMTHRU === "true";

  let streamUrl = null;
  if (useRD) streamUrl = await resolveWithRD(chosen);
  if (!streamUrl && useTorbox) streamUrl = await resolveWithTorbox(chosen);
  if (!streamUrl && useStremThru) streamUrl = await resolveWithStremThru(chosen);

  res.json({
    streams: streamUrl
      ? [{ name: "Debrid", title: chosen.title, url: streamUrl }]
      : []
  });
});

// --- Funções auxiliares ---
async function scrapeBrazuca({ type, id }) {
  // TODO: implementar scraping/consulta API Brazuca Torrents
  return [];
}

async function resolveWithRD(item) {
  // TODO: chamada à API Real-Debrid
  return null;
}

async function resolveWithTorbox(item) {
  // TODO: chamada à API Torbox
  return null;
}

async function resolveWithStremThru(item) {
  // TODO: chamada à API StremThru
  return null;
}

// Servir página única
app.use(express.static("public"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Addon rodando na porta ${port}`));
