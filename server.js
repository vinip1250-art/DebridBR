const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { addonBuilder } = require('stremio-addon-sdk');

const app = express();
app.use(cors());

// ============================================================
// 1. MANIFESTO (v11.0 - TorBox Strict Fix)
// ============================================================
const manifest = {
    id: 'community.brazuca.pro.direct.v11',
    version: '11.0.0',
    name: 'Brazuca',
    description: 'Brazuca Direct (TorBox Strict Fix & Debug)',
    resources: ['stream'],
    types: ['movie', 'series'],
    catalogs: [],
    idPrefixes: ['tt'],
    behaviorHints: {
        configurable: true,
        configurationRequired: true
    },
    logo: "https://i.imgur.com/Q61eP9V.png"
};

const builder = new addonBuilder(manifest);
const BRAZUCA_UPSTREAM = "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";

// Headers globais para evitar bloqueios simples
const AXIOS_CONFIG = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

// ============================================================
// 2. FUNÇÕES DE DEBRID
// ============================================================

// --- REAL-DEBRID ---
async function resolveRealDebrid(infoHash, apiKey) {
    try {
        // RD aceita trackers, ajuda na velocidade
        const magnet = `magnet:?xt=urn:btih:${infoHash}&tr=udp://tracker.opentrackr.org:1337/announce`;
        
        const addUrl = 'https://api.real-debrid.com/rest/1.0/torrents/addMagnet';
        const addResp = await axios.post(addUrl, `magnet=${encodeURIComponent(magnet)}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const torrentId = addResp.data.id;

        const infoUrl = `https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`;
        let attempts = 0;
        // Polling de seleção (RD demora para processar magnet)
        while (attempts < 10) {
            const infoResp = await axios.get(infoUrl, { headers: { 'Authorization': `Bearer ${apiKey}` } });
            if (infoResp.data.status === 'waiting_files_selection') {
                await axios.post(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, `files=all`, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                break;
            }
            if (infoResp.data.status === 'downloaded') break;
            await new Promise(r => setTimeout(r, 500));
            attempts++;
        }

        const finalInfo = await axios.get(infoUrl, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        if (finalInfo.data.links && finalInfo.data.links.length > 0) {
            const unrestrictResp = await axios.post('https://api.real-debrid.com/rest/1.0/unrestrict/link', `link=${finalInfo.data.links[0]}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            return { url: unrestrictResp.data.download, error: null };
        }
        return { url: null, error: "Aguardando download no RD..." };
    } catch (e) { 
        return { url: null, error: e.response?.data?.error || e.message };
    }
}

async function checkRealDebridCache(hashes, apiKey) {
    if (!hashes.length) return {};
    const validHashes = hashes.slice(0, 50);
    try {
        const url = `https://api.real-debrid.com/rest/1.0/torrents/instantAvailability/${validHashes.join('/')}`;
        const resp = await axios.get(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        const results = {};
        
        // Normalização total para evitar mismatch de Case
        const mapLower = {};
        Object.keys(resp.data).forEach(k => mapLower[k.toLowerCase()] = resp.data[k]);

        validHashes.forEach(h => {
            const data = mapLower[h.toLowerCase()];
            // Lógica estrita RD
            if (data && data.rd && Array.isArray(data.rd) && data.rd.length > 0) {
                results[h] = true;
            } else {
                results[h] = false;
            }
        });
        return results;
    } catch (e) { return {}; }
}

// --- TORBOX (MODO ESTRITO) ---
async function resolveTorBox(infoHash, apiKey) {
    try {
        // TorBox ODEIA trackers extras no magnet via API. Envia limpo.
        const magnet = `magnet:?xt=urn:btih:${infoHash}`;
        
        // 1. Create
        const params = new URLSearchParams();
        params.append('magnet', magnet);
        params.append('seed', '1');
        params.append('allow_zip', 'false');

        // Tenta criar
        const createResp = await axios.post('https://api.torbox.app/v1/api/torrents/create', params, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!createResp.data.success) {
            // Se falhar, retorna o erro exato da API
            return { url: null, error: `TorBox: ${createResp.data.detail || createResp.data.error || 'Falha ao adicionar'}` };
        }

        const torrentId = createResp.data.data.torrent_id;

        // 2. Listar (Wait Loop)
        // TorBox precisa de tempo. Se pedir rápido demais, retorna vazio.
        let foundFile = null;
        for(let i=0; i<5; i++) { // Tenta por 10s
            await new Promise(r => setTimeout(r, 2000));
            
            try {
                const listResp = await axios.get(`https://api.torbox.app/v1/api/torrents/mylist?bypass_cache=true&id=${torrentId}`, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                
                const data = listResp.data.data;
                if (data && data.files && data.files.length > 0) {
                    // Pega o maior arquivo
                    foundFile = data.files.reduce((prev, curr) => (prev.size > curr.size) ? prev : curr);
                    break;
                }
            } catch(e) {}
        }
        
        if (foundFile) {
            const reqUrl = `https://api.torbox.app/v1/api/torrents/requestdl?token=${apiKey}&torrent_id=${torrentId}&file_id=${foundFile.id}&zip_link=false`;
            const reqResp = await axios.get(reqUrl, { headers: { 'Authorization': `Bearer ${apiKey}` } });
            
            if (reqResp.data.success) return { url: reqResp.data.data, error: null };
        }
        
        return { url: null, error: "Download iniciado. Arquivos ainda não processados pelo TorBox." };

    } catch (e) { 
        // Captura erro HTTP exato
        const errMsg = e.response?.data?.detail || e.message;
        console.error("TorBox Fatal:", errMsg);
        return { url: null, error: `Erro TorBox: ${errMsg}` };
    }
}

async function checkTorBoxCache(hashes, apiKey) {
    if (!hashes.length) return {};
    // TorBox aceita lista separada por vírgula na query
    const hStr = hashes.slice(0, 40).join(',');

    try {
        const url = `https://api.torbox.app/v1/api/torrents/checkcached?hash=${hStr}&format=list&list_files=false`;
        const resp = await axios.get(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        
        const results = {};
        hashes.forEach(h => results[h.toLowerCase()] = false);
        
        const data = resp.data.data;
        if (Array.isArray(data)) {
            data.forEach(h => { if(h) results[h.toLowerCase()] = true; });
        } else if (typeof data === 'object') {
            Object.keys(data).forEach(k => { if(data[k]) results[k.toLowerCase()] = true; });
        }
        return results;
    } catch (e) { return {}; }
}

// ============================================================
// 3. HTML CONFIG
// ============================================================
const configureHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brazuca Config</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background-color: #0b0c10; color: #c5c6c7; font-family: 'Segoe UI', sans-serif; }
        .card { background-color: #1f2833; border: 1px solid #45a29e; box-shadow: 0 0 20px rgba(102, 252, 241, 0.15); }
        .input-dark { background-color: #0b0c10; border: 1px solid #45a29e; color: #fff; }
        .input-dark:focus { box-shadow: 0 0 8px #66fcf1; outline: none; }
        .btn-action { background: linear-gradient(90deg, #45a29e 0%, #66fcf1 100%); color: #0b0c10; font-weight: bold; }
        .btn-ref-rd { background-color: #2563eb; color: white; font-size: 0.8rem; padding: 10px; border-radius: 8px; display: block; text-align: center; font-weight: bold; }
        .btn-ref-tb { background-color: #9333ea; color: white; font-size: 0.8rem; padding: 10px; border-radius: 8px; display: block; text-align: center; font-weight: bold; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black to-gray-900">
    <div class="w-full max-w-md card rounded-2xl p-8 relative">
        <div class="text-center mb-8">
            <h1 class="text-4xl font-extrabold text-[#66fcf1] mb-2">Brazuca <span class="text-white">Direct</span></h1>
            <p class="text-gray-400 text-xs">V11.0 FINAL</p>
        </div>
        <form id="configForm" class="space-y-6">
            <div class="bg-[#0b0c10] p-4 rounded-xl border border-gray-800 hover:border-blue-500 transition-colors">
                <label class="flex items-center gap-3 cursor-pointer mb-3">
                    <input type="checkbox" id="use_rd" class="w-5 h-5 accent-[#66fcf1]" onchange="validate()">
                    <span class="text-lg font-bold text-white">Real-Debrid</span>
                </label>
                <input type="text" id="rd_key" placeholder="API Key (F...)" class="w-full input-dark p-3 rounded-lg text-sm text-gray-300 mb-3" disabled>
                <a href="http://real-debrid.com/?id=6684575" target="_blank" class="btn-ref-rd">💎 Assinar Real-Debrid</a>
            </div>
            <div class="bg-[#0b0c10] p-4 rounded-xl border border-gray-800 hover:border-purple-500 transition-colors">
                <label class="flex items-center gap-3 cursor-pointer mb-3">
                    <input type="checkbox" id="use_tb" class="w-5 h-5 accent-[#66fcf1]" onchange="validate()">
                    <span class="text-lg font-bold text-white">TorBox</span>
                </label>
                <input type="text" id="tb_key" placeholder="API Key TorBox" class="w-full input-dark p-3 rounded-lg text-sm text-gray-300 mb-3" disabled>
                <a href="https://torbox.app/subscription?referral=b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96" target="_blank" class="btn-ref-tb">⚡ Assinar TorBox</a>
            </div>
            <div class="grid grid-cols-4 gap-2 pt-2">
                <button type="button" onclick="copyLink()" id="btnCopy" class="col-span-1 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl opacity-50 pointer-events-none flex items-center justify-center"><i class="fas fa-copy"></i></button>
                <a id="installBtn" href="#" class="col-span-3 block btn-action py-4 rounded-xl text-lg text-center font-bold uppercase tracking-widest opacity-50 pointer-events-none">INSTALAR</a>
            </div>
            <input type="text" id="finalLink" class="hidden">
        </form>
    </div>
    <div id="toast" class="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg hidden">Link Copiado!</div>
    <script>
        function validate() {
            const rd = document.getElementById('use_rd').checked;
            const tb = document.getElementById('use_tb').checked;
            const rdKey = document.getElementById('rd_key');
            const tbKey = document.getElementById('tb_key');
            const btnInstall = document.getElementById('installBtn');
            const btnCopy = document.getElementById('btnCopy');

            rdKey.disabled = !rd; tbKey.disabled = !tb;
            if(!rd) rdKey.value = ''; if(!tb) tbKey.value = '';
            rdKey.parentElement.style.opacity = rd ? '1' : '0.6';
            tbKey.parentElement.style.opacity = tb ? '1' : '0.6';

            if ((rd && rdKey.value.length > 5) || (tb && tbKey.value.length > 5)) {
                btnInstall.classList.remove('opacity-50', 'pointer-events-none');
                btnCopy.classList.remove('opacity-50', 'pointer-events-none');
                generateLink();
            } else {
                btnInstall.classList.add('opacity-50', 'pointer-events-none');
                btnCopy.classList.add('opacity-50', 'pointer-events-none');
            }
        }
        document.getElementById('rd_key').addEventListener('input', validate);
        document.getElementById('tb_key').addEventListener('input', validate);

        function generateLink() {
            const rd = document.getElementById('use_rd').checked;
            const tb = document.getElementById('use_tb').checked;
            const config = {
                s: 'multi',
                rd: rd ? document.getElementById('rd_key').value.trim() : null,
                tb: tb ? document.getElementById('tb_key').value.trim() : null
            };
            const b64 = btoa(JSON.stringify(config));
            const encoded = encodeURIComponent(b64);
            const host = window.location.host;
            document.getElementById('installBtn').href = 'stremio://' + host + '/' + encoded + '/manifest.json';
            document.getElementById('finalLink').value = 'https://' + host + '/' + encoded + '/manifest.json';
        }
        function copyLink() {
            const link = document.getElementById('finalLink').value;
            navigator.clipboard.writeText(link).then(() => {
                document.getElementById('toast').classList.remove('hidden');
                setTimeout(() => document.getElementById('toast').classList.add('hidden'), 2000);
            });
        }
    </script>
</body>
</html>
`;

// ============================================================
// 4. ROTAS
// ============================================================

app.get('/', (req, res) => res.send(configureHtml));
app.get('/configure', (req, res) => res.send(configureHtml));

app.get('/:config/manifest.json', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const m = { ...manifest };
    try { if(req.params.config.length > 5) m.behaviorHints = { configurable: true, configurationRequired: false }; } catch(e){}
    res.json(m);
});

app.get('/:config/stream/:type/:id.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let cfg;
    try { cfg = JSON.parse(Buffer.from(decodeURIComponent(req.params.config), 'base64').toString()); } catch(e) { return res.json({ streams: [] }); }

    const rdKey = cfg.rd;
    const tbKey = cfg.tb;

    if (!rdKey && !tbKey) return res.json({ streams: [] });

    let streams = [];
    try {
        const resp = await axios.get(`${BRAZUCA_UPSTREAM}/stream/${req.params.type}/${req.params.id}.json`, { timeout: 6000 });
        streams = resp.data.streams || [];
    } catch(e) { return res.json({ streams: [] }); }

    if (!streams.length) return res.json({ streams: [] });

    // Hashes
    const hashList = [];
    streams.forEach(s => {
        let h = s.infoHash;
        if (!h && s.url && s.url.startsWith('magnet:')) {
            const m = s.url.match(/xt=urn:btih:([a-zA-Z0-9]{40})/);
            if (m) h = m[1];
        }
        if (h) { s.infoHash = h.toLowerCase(); if(!hashList.includes(s.infoHash)) hashList.push(s.infoHash); }
    });

    // Cache Check
    let rdCache = {}, tbCache = {};
    if (hashList.length > 0) {
        if (cfg.rd) rdCache = await checkRealDebridCache(hashList, cfg.rd);
        if (cfg.tb) tbCache = await checkTorBoxCache(hashList, cfg.tb);
    }

    const finalStreams = [];
    streams.forEach(s => {
        const h = s.infoHash;
        if (!h) return;
        const cleanTitle = (s.title || 'video').replace(/\n/g, ' ').trim();

        if (cfg.rd) {
            const isCached = rdCache[h] === true;
            const icon = isCached ? '⚡' : '📥';
            finalStreams.push({
                name: 'Brazuca [RD]',
                title: `${icon} ${cleanTitle}`,
                url: `${req.protocol}://${req.get('host')}/resolve/realdebrid/${encodeURIComponent(cfg.rd)}/${h}`,
                behaviorHints: { notWebReady: !isCached }
            });
        }
        if (cfg.tb) {
            const isCached = tbCache[h] === true;
            const icon = isCached ? '⚡' : '📥';
            finalStreams.push({
                name: 'Brazuca [TB]',
                title: `${icon} ${cleanTitle}`,
                url: `${req.protocol}://${req.get('host')}/resolve/torbox/${encodeURIComponent(cfg.tb)}/${h}`,
                behaviorHints: { notWebReady: !isCached }
            });
        }
    });

    finalStreams.sort((a, b) => b.title.includes('⚡') - a.title.includes('⚡'));
    res.json({ streams: finalStreams });
});

// RESOLVE HANDLER (Agora mostra o ERRO REAL)
app.get('/resolve/:service/:key/:hash', async (req, res) => {
    const { service, key, hash } = req.params;
    let result = null;
    
    if (service === 'realdebrid') result = await resolveRealDebrid(hash, key);
    else if (service === 'torbox') result = await resolveTorBox(hash, key);

    if (result && result.url) {
        res.redirect(result.url);
    } else {
        const errorMsg = result ? result.error : "Erro desconhecido";
        // Mostra página com o erro EXATO para debug
        res.status(404).send(`
            <html>
                <body style="background:#111; color:#fff; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; text-align:center;">
                    <div style="max-width:500px; padding:20px; border:1px solid #333; border-radius:10px;">
                        <h1 style="color:#e74c3c;">⚠️ Falha no Stream</h1>
                        <p style="font-size:1.1rem; margin:20px 0;">Não foi possível iniciar o stream instantâneo.</p>
                        <div style="background:#222; padding:15px; border-radius:5px; font-family:monospace; color:#f1c40f;">
                            ${errorMsg}
                        </div>
                        <p style="margin-top:20px; color:#888;">Se o erro for "Download iniciado", verifique sua nuvem.</p>
                        <button onclick="history.back()" style="background:#45a29e; color:#000; border:none; padding:10px 20px; margin-top:20px; cursor:pointer; border-radius:5px;">Voltar</button>
                    </div>
                </body>
            </html>
        `);
    }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Brazuca v11 rodando na porta ${PORT}`);
});
