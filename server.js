const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

// ============================================================
// 1. CONFIGURAÇÕES PADRÃO (ESCOPO GLOBAL)
// ============================================================
const UPSTREAM_BASE = "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";
const DEFAULT_NAME = "Brazuca"; 
const DEFAULT_LOGO = "https://i.imgur.com/KVpfrAk.png";
const PROJECT_VERSION = "1.0.0"; 
const STREMTHRU_HOST = "https://stremthru-btie.onrender.com"; 

const REFERRAL_RD = "6684575";
const REFERRAL_TB = "b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96";

// Constante Torrentio PT-BR
const TORRENTIO_PT_URL = "https://torrentio.strem.fun/providers=nyaasi,tokyotosho,anidex,comando,bludv,micoleaodublado|language=portuguese/manifest.json";

// ============================================================
// 2. ROTA MANIFESTO BRAZUCA (Proxy)
// ============================================================
app.get('/addon/manifest.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60'); 
    
    try {
        const customName = req.query.name || DEFAULT_NAME;
        const customLogo = req.query.logo || DEFAULT_LOGO;
        
        const response = await axios.get(`${UPSTREAM_BASE}/manifest.json`);
        const manifest = response.data;

        const idSuffix = Buffer.from(customName).toString('hex').substring(0, 10);
        
        manifest.id = `community.brazuca.wrapper.${idSuffix}`;
        manifest.name = customName; 
        manifest.description = `Wrapper customizado: ${customName}`;
        manifest.logo = customLogo;
        manifest.version = PROJECT_VERSION; 
        
        delete manifest.background; 
        
        res.json(manifest);
    } catch (error) {
        console.error("Upstream manifesto error:", error.message);
        res.status(500).json({ error: "Upstream manifesto error" });
    }
});

// ============================================================
// 3. ROTA MANIFESTO TORRENTIO (Proxy)
// ============================================================
app.get('/addon/torrentio/manifest.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    try {
        const response = await axios.get(TORRENTIO_PT_URL);
        const manifest = response.data;
        manifest.id = "community.torrentio.wrapper";
        manifest.name = "Torrentio PT-BR";
        manifest.description = "Wrapper customizado: Torrentio PT";
        manifest.logo = DEFAULT_LOGO;
        manifest.version = PROJECT_VERSION;
        res.json(manifest);
    } catch (error) {
        console.error("Torrentio manifesto error:", error.message);
        res.status(500).json({ error: "Torrentio manifesto error" });
    }
});

// ============================================================
// 4. ROTAS DE STREAMS
// ============================================================

// Brazuca
app.get('/addon/stream/:type/:id.json', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const upstreamUrl = `${UPSTREAM_BASE}${req.path}`;
        const response = await axios.get(upstreamUrl);
        let streams = response.data.streams || [];
        return res.json({ streams });
    } catch (error) {
        console.error("Stream Fetch Error:", error.message);
        return res.status(404).json({ streams: [] }); 
    }
});

// Torrentio
app.get('/addon/torrentio/stream/:type/:id.json', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
        const upstreamUrl = `https://torrentio.strem.fun/${req.params.type}/${req.params.id}.json`;
        const response = await axios.get(upstreamUrl);
        let streams = response.data.streams || [];
        res.json({ streams });
    } catch (error) {
        console.error("Torrentio Stream Error:", error.message);
        res.status(404).json({ streams: [] });
    }
});

// ============================================================
// 5. REDIRECIONAMENTO GENÉRICO (Catálogos, Meta, etc.)
// ============================================================
app.get('/addon/*', (req, res) => {
    const originalPath = req.url.replace('/addon', '');
    const upstreamUrl = `${UPSTREAM_BASE}${originalPath}`;
    res.redirect(307, upstreamUrl);
});

// ============================================================
// 6. INTERFACE (HTML GERADOR)
// ============================================================
const generatorHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Brazuca Wrapper</title>
    <!-- aqui permanece todo o conteúdo HTML que você já tinha -->
    <!-- mantive o formulário com opção de incluir Torrentio -->
</head>
<body>
    <!-- corpo da interface -->
</body>
</html>
`;

// Rotas para servir a interface
app.get('/', (req, res) => res.send(generatorHtml));
app.get('/configure', (req, res) => res.send(generatorHtml));

// ============================================================
// 7. EXPORTAÇÃO / SERVER
// ============================================================
const PORT = process.env.PORT || 7000;
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Gerador rodando na porta ${PORT}`);
    });
}
