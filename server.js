import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const profiles = {
  rd: {
    id: "brscrap.rd",
    name: "Brazuca + Real-Debrid",
    config: { rd: true, torbox: false, stremthru: false }
  },
  torbox: {
    id: "brscrap.torbox",
    name: "Brazuca + Torbox",
    config: { rd: false, torbox: true, stremthru: false }
  },
  stremthru: {
    id: "brscrap.stremthru",
    name: "Brazuca + StremThru",
    config: { rd: false, torbox: false, stremthru: true }
  }
};

app.get("/manifest/:profile.json", (req, res) => {
  const profile = req.params.profile;
  const selected = profiles[profile];

  if (!selected) return res.status(404).json({ error: "Perfil inválido" });

  const manifest = {
    id: selected.id,
    version: "1.0.0",
    name: selected.name,
    description: "Addon Brazuca Torrents com Debrid",
    catalogs: [
      { type: "movie", id: "brazuca-movies", name: "Brazuca Movies" },
      { type: "series", id: "brazuca-series", name: "Brazuca Series" }
    ],
    resources: ["catalog", "stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"],
    behaviorHints: {
      config: selected.config
    }
  };

  res.json(manifest);
});

app.get("/catalog/:type/:id.json", (req, res) => {
  res.json({ metas: [] });
});

app.get("/stream/:type/:id.json", (req, res) => {
  res.json({ streams: [] });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

export default app;
