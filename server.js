import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/manifest.json", (req, res) => {
  let config = {};
  if (req.query.config) {
    try {
      config = JSON.parse(Buffer.from(req.query.config, "base64").toString("utf8"));
    } catch (e) {
      console.error("Erro ao decodificar config:", e);
    }
  }

  const manifest = {
    id: "brscrap.brazuca.debrid",
    version: "1.0.0",
    name: "Brazuca + Debrid",
    description: "Addon Brazuca Torrents com Real-Debrid, Torbox e StremThru",
    catalogs: [
      { type: "movie", id: "brazuca-movies", name: "Brazuca Movies" },
      { type: "series", id: "brazuca-series", name: "Brazuca Series" }
    ],
    resources: ["catalog", "stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"],
    behaviorHints: {
      config
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
