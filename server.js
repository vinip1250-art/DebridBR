app.get("/manifest.json", (req, res) => {
  let config = {};
  if (req.query.config) {
    try {
      config = JSON.parse(Buffer.from(req.query.config, "base64").toString("utf8"));
    } catch (e) {
      console.error("Erro ao decodificar config", e);
    }
  }

  const manifest = {
    id: "brscrap.brazuca.debrid",
    version: "1.0.0",
    name: "Brazuca + Debrid",
    description: "Addon Brazuca com Real-Debrid/Torbox",
    catalogs: [
      { type: "movie", id: "brazuca-movies", name: "Brazuca Movies" },
      { type: "series", id: "brazuca-series", name: "Brazuca Series" }
    ],
    resources: ["catalog", "stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"],
    // opcional: incluir info de config para debug
    config
  };

  res.json(manifest);
});
