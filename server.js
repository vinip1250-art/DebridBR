// server.js - Brazuca Direct (TorBox + Real-Debrid) - v22.0.0
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const morgan = require('morgan');
const helmet = require('helmet');
const { addonBuilder } = require('stremio-addon-sdk');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ============================================================
// CONFIG
// ============================================================
const manifest = {
    id: 'community.brazuca.pro.direct.v22',
    version: '22.0.0',
    name: 'Brazuca',
    description: 'Brazuca Direct (TorBox URL Hunter) - v22',
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

// Upstream Brazuca (onde buscamos streams brutos)
const BRAZUCA_UPSTREAM = process.env.BRAZUCA_UPSTREAM || "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";

// Axios instance with sensible defaults
const AXIOS_CONFIG = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    },
    timeout: 15000
};

const axiosInstance = axios.create({
    timeout: 20000,
    headers: { ...AXIOS_CONFIG.headers }
});

// ============================================================
// UTILS
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function safeLog(...args) {
    // evita logar chaves inteiras (apenas show prefix)
    const filtered = args.map(a => {
        if (typeof a === 'string' && (a.match(/[A-Za-z0-9_-]{30,}/))) {
            return a.slice(0,8) + '...[REDACTED]';
        }
        return a;
    });
    console.log(...filtered);
}

function isValidInfoHash(h) {
    if (!h) return false;
    const hh = ('' + h).toLowerCase();
    return /^[a-f0-9]{40}$/.test(hh);
}

// Simple in-memory cache to reduce repeated resolve calls (keyed by service:key:hash)
const resolveCache = new Map();
function cachePut(key, value, ttlMs = 60 * 1000) {
    resolveCache.set(key, { value, expire: Date.now() + ttlMs });
}
function cacheGet(key) {
    const entry = resolveCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expire) { resolveCache.delete(key); return null; }
    return entry.value;
}

// ============================================================
// REAL-DEBRID
// ============================================================
async function resolveRealDebrid(infoHash, apiKey) {
    const cacheKey = `rd:${apiKey}:${infoHash}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    try {
        const magnet = `magnet:?xt=urn:btih:${infoHash}`;

        // 1) Add magnet
        const addUrl = 'https://api.real-debrid.com/rest/1.0/torrents/addMagnet';
        const params = new URLSearchParams();
        params.append('magnet', magnet);

        const addResp = await axiosInstance.post(addUrl, params, {
            headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` }
        });

        const torrentId = addResp.data.id;
        if (!torrentId) {
            const err = { url: null, error: 'RD: Não foi possível obter torrent id' };
            cachePut(cacheKey, err, 5000);
            return err;
        }

        // 2) Aguarda até que arquivos estejam prontos (ou download pronto)
        const infoUrl = `https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`;
        let attempts = 0;
        let finalInfo = null;
        while (attempts < 12) { // ~12 * 0.75s = ~9s max wait
            const infoResp = await axiosInstance.get(infoUrl, { headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` } });
            finalInfo = infoResp.data;
            if (finalInfo.status === 'waiting_files_selection') {
                // selecionar todos os arquivos
                const selParams = new URLSearchParams();
                selParams.append('files', 'all');
                await axiosInstance.post(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, selParams, {
                    headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` }
                });
            }
            if (finalInfo.status === 'downloaded' || (finalInfo.links && finalInfo.links.length > 0)) {
                break;
            }
            await sleep(750);
            attempts++;
        }

        if (!finalInfo) {
            const err = { url: null, error: 'RD: timeout obtendo informações do torrent' };
            cachePut(cacheKey, err, 3000);
            return err;
        }

        // Se já existir link direto (rd cached), entender e retornar
        if (finalInfo.links && finalInfo.links.length > 0) {
            // Unrestrict the first link if needed
            try {
                const linkParams = new URLSearchParams();
                // Em alguns casos a API retorna 'links' com URL direta ou id
                const candidate = finalInfo.links[0];
                // Se candidate for uma url direta, faz unrestrict/link para transformar em download RD
                linkParams.append('link', candidate);
                const unrestrictResp = await axiosInstance.post('https://api.real-debrid.com/rest/1.0/unrestrict/link', linkParams, {
                    headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` }
                });
                const resultUrl = unrestrictResp.data.download || unrestrictResp.data.link || unrestrictResp.data?.files?.[0]?.download;
                const ok = { url: resultUrl, error: null };
                cachePut(cacheKey, ok, 1000 * 60 * 5);
                return ok;
            } catch (e) {
                // continua e tenta checar se há 'links' no finalInfo
            }
        }

        // Se chegou aqui mas não tem link pronto
        const err = { url: null, error: "RD: Download iniciado (Status: " + (finalInfo.status || 'unknown') + ")" };
        cachePut(cacheKey, err, 5000);
        return err;
    } catch (e) {
        if (e.response && e.response.status === 403) {
            return { url: null, error: "ERRO 403: IP Banido pelo Real-Debrid." };
        }
        const msg = e.response?.data?.error_description || e.response?.data?.error || e.message;
        return { url: null, error: "RD Error: " + msg };
    }
}

async function checkRealDebridCache(hashes, apiKey) {
    if (!hashes.length) return {};
    const validHashes = hashes.slice(0, 50);
    try {
        const url = `https://api.real-debrid.com/rest/1.0/torrents/instantAvailability/${validHashes.join('/')}`;
        const resp = await axiosInstance.get(url, { headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` } });
        const results = {};
        // normalize keys lower-case
        for (const k in resp.data) {
            const val = resp.data[k];
            const present = Boolean(val && val.rd && Array.isArray(val.rd) && val.rd.length > 0);
            results[k.toLowerCase()] = present;
        }
        // ensure all requested keys exist (default false)
        validHashes.forEach(h => { if (results[h.toLowerCase()] === undefined) results[h.toLowerCase()] = false; });
        return results;
    } catch (e) {
        return {};
    }
}

// ============================================================
// TORBOX (HUNTER MODE) - Atualizado para API 2025
// ============================================================
async function resolveTorBox(infoHash, apiKey) {
    const cacheKey = `tb:${apiKey}:${infoHash}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    if (!apiKey) return { url: null, error: 'TorBox: chave ausente' };

    try {
        const magnet = `magnet:?xt=urn:btih:${infoHash}`;

        // 1) Criar torrent (API v1 padronizada)
        const form = new FormData();
        form.append('magnet', magnet);
        form.append('seed', '1');
        form.append('allow_zip', 'false');

        let createResp;
        try {
            createResp = await axiosInstance.post(
                'https://api.torbox.app/v1/torrents/create',
                form,
                { headers: { ...form.getHeaders(), 'Authorization': `Bearer ${apiKey}`, 'User-Agent': AXIOS_CONFIG.headers['User-Agent'] } }
            );
        } catch (e) {
            // se resposta com status e body, retorna erro amigável
            const status = e.response?.status;
            const detail = e.response?.data?.detail || e.response?.data || e.message;
            return { url: null, error: `TorBox: falha ao criar torrent (${status || 'N/A'}): ${detail}` };
        }

        if (!createResp.data?.success) {
            return { url: null, error: 'TorBox: resposta inesperada ao criar torrent.' };
        }

        const torrentId = createResp.data.data.torrent_id;
        if (!torrentId) return { url: null, error: 'TorBox: torrent id não retornado.' };

        // 2) Poll para obter lista de arquivos
        let chosenFile = null;
        const maxAttempts = 12;
        for (let i = 0; i < maxAttempts; i++) {
            await sleep(1500);
            try {
                const listResp = await axiosInstance.get(`https://api.torbox.app/v1/torrents/${torrentId}`, {
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': AXIOS_CONFIG.headers['User-Agent'] }
                });
                const files = listResp.data?.data?.files || [];
                if (files.length > 0) {
                    // escolhe o maior arquivo (provável o vídeo)
                    chosenFile = files.reduce((a, b) => a.size > b.size ? a : b);
                    break;
                }
            } catch (err) {
                // ignora e repete (timeout/500 intermitente)
            }
        }

        if (!chosenFile) {
            return { url: null, error: 'TorBox: timeout aguardando lista de arquivos.' };
        }

        // 3) Request download link (rota moderna)
        try {
            const dlResp = await axiosInstance.get(
                `https://api.torbox.app/v1/torrents/${torrentId}/files/${chosenFile.id}/download`,
                { headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': AXIOS_CONFIG.headers['User-Agent'] } }
            );

            if (dlResp.data?.success) {
                const result = { url: dlResp.data.data, error: null };
                cachePut(cacheKey, result, 1000 * 60 * 5); // cache 5min
                return result;
            } else {
                return { url: null, error: 'TorBox: falha ao gerar link de download.' };
            }
        } catch (e) {
            return { url: null, error: 'TorBox: erro gerando link - ' + (e.response?.data?.detail || e.message) };
        }

    } catch (e) {
        return { url: null, error: 'TorBox ERRO: ' + (e.response?.data?.detail || e.message) };
    }
}

async function checkTorBoxCache(hashes, apiKey) {
    if (!hashes.length) return {};
    const hStr = hashes.slice(0, 40).join(',');
    try {
        const url = `https://api.torbox.app/v1/torrents/check?hash=${hStr}`;
        const resp = await axiosInstance.get(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': AXIOS_CONFIG.headers['User-Agent'] } });
        const results = {};
        hashes.forEach(h => results[h.toLowerCase()] = false);
        if (resp.data?.data) {
            // resp.data.data costuma ser um objeto com hash => true/false
            Object.keys(resp.data.data).forEach(k => {
                results[k.toLowerCase()] = Boolean(resp.data.data[k]);
            });
        }
        return results;
    } catch (e) {
        return {};
    }
}

// ============================================================
// CONFIG PAGE HTML (mantive seu design, sem alterações funcionais)
// ============================================================
const configureHtml = `<!DOCTYPE html>
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
            <p class="text-gray-400 text-xs">V22.0 (URL HUNTER)</p>
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
</html>`;

// ============================================================
// ROTAS
// ============================================================
app.get('/', (req, res) => res.send(configureHtml));
app.get('/configure', (req, res) => res.send(configureHtml));

// Manifest route (config encoded in path)
app.get('/:config/manifest.json', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const m = { ...manifest };
    try {
        if (req.params.config && req.params.config.length > 5) {
            m.behaviorHints = { configurable: true, configurationRequired: false };
        }
    } catch (e) {}
    res.json(m);
});

// Stream listing - wraps upstream Brazuca stream list and exposes RD/TB resolve links
app.get('/:config/stream/:type/:id.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    let cfg;
    try {
        cfg = JSON.parse(Buffer.from(decodeURIComponent(req.params.config), 'base64').toString());
    } catch (e) {
        return res.json({ streams: [] });
    }

    const rdKey = cfg.rd;
    const tbKey = cfg.tb;
    if (!rdKey && !tbKey) return res.json({ streams: [] });

    let streams = [];
    try {
        const resp = await axiosInstance.get(`${BRAZUCA_UPSTREAM}/stream/${req.params.type}/${req.params.id}.json`, { timeout: 8000 });
        streams = resp.data.streams || [];
    } catch (e) {
        return res.json({ streams: [] });
    }

    if (!streams.length) return res.json({ streams: [] });

    // collect hashes and normalize
    const hashList = [];
    streams.forEach(s => {
        let h = s.infoHash;
        if (!h && s.url && s.url.startsWith('magnet:')) {
            const m = s.url.match(/xt=urn:btih:([a-zA-Z0-9]{40})/);
            if (m) h = m[1];
        }
        if (h) {
            h = h.toLowerCase();
            if (isValidInfoHash(h) && !hashList.includes(h)) {
                s.infoHash = h;
                hashList.push(h);
            }
        }
    });

    let rdCache = {}, tbCache = {};
    if (rdKey && hashList.length > 0) rdCache = await checkRealDebridCache(hashList, rdKey);
    if (tbKey && hashList.length > 0) tbCache = await checkTorBoxCache(hashList, tbKey);

    const finalStreams = [];
    streams.forEach(s => {
        const h = s.infoHash;
        if (!h) return;
        const cleanTitle = (s.title || 'video').replace(/\n/g, ' ').trim();

        if (rdKey) {
            const isCached = rdCache[h] === true || rdCache[h.toLowerCase()] === true;
            const icon = isCached ? '⚡' : '📥';
            finalStreams.push({
                name: 'Brazuca [RD]',
                title: `${icon} ${cleanTitle}`,
                url: `${req.protocol}://${req.get('host')}/resolve/realdebrid/${encodeURIComponent(cfg.rd)}/${h}`,
                behaviorHints: { notWebReady: !isCached }
            });
        }
        if (tbKey) {
            const isCached = tbCache[h] === true || tbCache[h.toLowerCase()] === true;
            const icon = isCached ? '⚡' : '📥';
            finalStreams.push({
                name: 'Brazuca [TB]',
                title: `${icon} ${cleanTitle}`,
                url: `${req.protocol}://${req.get('host')}/resolve/torbox/${encodeURIComponent(cfg.tb)}/${h}`,
                behaviorHints: { notWebReady: !isCached }
            });
        }
    });

    finalStreams.sort((a, b) => (b.title.includes('⚡') ? 1 : 0) - (a.title.includes('⚡') ? 1 : 0));
    res.json({ streams: finalStreams });
});

// Resolve handler - redirects to final URL or shows diagnostic
app.get('/resolve/:service/:key/:hash', async (req, res) => {
    const { service, key, hash } = req.params;

    // basic validation
    if (!key || !hash || !isValidInfoHash(hash)) {
        return res.status(400).send('Parâmetros inválidos');
    }

    let result = null;
    try {
        if (service === 'realdebrid') result = await resolveRealDebrid(hash, key);
        else if (service === 'torbox') result = await resolveTorBox(hash, key);
        else result = { url: null, error: 'Serviço desconhecido' };
    } catch (e) {
        result = { url: null, error: 'Erro interno: ' + (e.message || e) };
    }

    if (result && result.url) {
        // redirect para URL (pode ser link RD ou TorBox direto)
        return res.redirect(result.url);
    } else {
        const errorMsg = result ? result.error : "Erro desconhecido";
        // show diagnostic page
        return res.status(404).send(`
            <html>
                <body style="background:#111; color:#fff; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; text-align:center;">
                    <div style="max-width:600px; padding:24px; border:1px solid #333; border-radius:10px;">
                        <h1 style="color:#e74c3c;">⚠️ Diagnóstico</h1>
                        <p style="font-size:1.05rem; margin:18px 0;">${escapeHtml(errorMsg)}</p>
                        <p style="margin-top:12px; color:#888;">Se for erro de API ou IP, verifique as chaves e se o servidor tem IP público não bloqueado.</p>
                        <p style="margin-top:6px; color:#888;">Logs: confira console do Render / provedor para ver detalhes de erro.</p>
                        <button onclick="history.back()" style="background:#45a29e; color:#000; border:none; padding:10px 20px; margin-top:20px; cursor:pointer; border-radius:5px;">Voltar</button>
                    </div>
                </body>
            </html>
        `);
    }
});

// fallback 404 logger
app.use((req, res) => {
    console.error('404 for path:', req.method, req.originalUrl);
    res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => {
        const map = { '&': '&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#39;' };
        return map[s] || s;
    });
}

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Addon rodando na porta ${PORT} - Brazuca v22`);
});
