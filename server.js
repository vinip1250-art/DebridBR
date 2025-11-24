// server.js - Brazuca Direct (torbox+real-debrid) - versão enxuta (sem morgan/helmet)
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const { addonBuilder } = require('stremio-addon-sdk');

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
    // Não reiniciamos automaticamente aqui; o provedor fará restart
});
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason && reason.stack ? reason.stack : reason);
});

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONFIG / MANIFEST
// ============================================================
const manifest = {
    id: 'community.brazuca.pro.direct.v22',
    version: '22.0.0',
    name: 'Brazuca',
    description: 'Brazuca Direct (TorBox URL Hunter) - v22 (light)',
    resources: ['stream'],
    types: ['movie', 'series'],
    catalogs: [],
    idPrefixes: ['tt'],
    behaviorHints: { configurable: true, configurationRequired: true },
    logo: "https://i.imgur.com/Q61eP9V.png"
};

const BRAZUCA_UPSTREAM = process.env.BRAZUCA_UPSTREAM || "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";

const AXIOS_CONFIG = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    timeout: 15000
};
const axiosInstance = axios.create({ timeout: 20000, headers: { ...AXIOS_CONFIG.headers } });

// ============================================================
// UTIL helpers
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function isValidInfoHash(h) { if (!h) return false; const hh = (''+h).toLowerCase(); return /^[a-f0-9]{40}$/.test(hh); }
function escapeHtml(str) { if (!str) return ''; return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]); }

// simple in-memory cache
const resolveCache = new Map();
function cachePut(key, value, ttlMs = 60*1000) { resolveCache.set(key, { value, expire: Date.now() + ttlMs }); }
function cacheGet(key) { const e = resolveCache.get(key); if (!e) return null; if (Date.now() > e.expire) { resolveCache.delete(key); return null; } return e.value; }

// ============================================================
// REAL-DEBRID (melhorias básicas)
// ============================================================
async function resolveRealDebrid(infoHash, apiKey) {
    const cacheKey = `rd:${apiKey}:${infoHash}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    try {
        const magnet = `magnet:?xt=urn:btih:${infoHash}`;
        const addUrl = 'https://api.real-debrid.com/rest/1.0/torrents/addMagnet';
        const params = new URLSearchParams(); params.append('magnet', magnet);

        const addResp = await axiosInstance.post(addUrl, params, {
            headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` }
        });

        const torrentId = addResp.data?.id;
        if (!torrentId) return { url: null, error: 'RD: sem torrent id' };

        const infoUrl = `https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`;
        let finalInfo = null;
        for (let i = 0; i < 12; i++) {
            const infoResp = await axiosInstance.get(infoUrl, { headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` } });
            finalInfo = infoResp.data;
            if (finalInfo.status === 'waiting_files_selection') {
                const sel = new URLSearchParams(); sel.append('files', 'all');
                await axiosInstance.post(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, sel, {
                    headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` }
                });
            }
            if (finalInfo.status === 'downloaded' || (finalInfo.links && finalInfo.links.length > 0)) break;
            await sleep(750);
        }

        if (finalInfo?.links && finalInfo.links.length > 0) {
            try {
                const linkParams = new URLSearchParams();
                linkParams.append('link', finalInfo.links[0]);
                const unrestrictResp = await axiosInstance.post('https://api.real-debrid.com/rest/1.0/unrestrict/link', linkParams, {
                    headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` }
                });
                const resultUrl = unrestrictResp.data?.download || unrestrictResp.data?.link || null;
                const ok = { url: resultUrl, error: null };
                cachePut(cacheKey, ok, 5*60*1000);
                return ok;
            } catch (e) {
                // segue para retorno condicional abaixo
            }
        }

        return { url: null, error: "RD: Download iniciado (status: " + (finalInfo?.status || 'unknown') + ")" };
    } catch (e) {
        if (e.response && e.response.status === 403) return { url: null, error: "ERRO 403: IP banido pelo Real-Debrid." };
        return { url: null, error: "RD Error: " + (e.response?.data?.error || e.message || e) };
    }
}

async function checkRealDebridCache(hashes, apiKey) {
    if (!hashes || !hashes.length) return {};
    try {
        const path = `https://api.real-debrid.com/rest/1.0/torrents/instantAvailability/${hashes.slice(0,50).join('/')}`;
        const resp = await axiosInstance.get(path, { headers: { ...AXIOS_CONFIG.headers, 'Authorization': `Bearer ${apiKey}` } });
        const results = {};
        for (const k in resp.data) {
            const val = resp.data[k];
            results[k.toLowerCase()] = Boolean(val && val.rd && Array.isArray(val.rd) && val.rd.length > 0);
        }
        hashes.forEach(h => { if (results[h.toLowerCase()] === undefined) results[h.toLowerCase()] = false; });
        return results;
    } catch (e) {
        return {};
    }
}

// ============================================================
// TORBOX (API atualizada)
// ============================================================
async function resolveTorBox(infoHash, apiKey) {
    const cacheKey = `tb:${apiKey}:${infoHash}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
    if (!apiKey) return { url: null, error: 'TorBox: chave ausente' };

    try {
        const magnet = `magnet:?xt=urn:btih:${infoHash}`;
        const form = new FormData();
        form.append('magnet', magnet);
        form.append('seed', '1');
        form.append('allow_zip', 'false');

        let createResp;
        try {
            createResp = await axiosInstance.post('https://api.torbox.app/v1/torrents/create', form, {
                headers: { ...form.getHeaders(), 'Authorization': `Bearer ${apiKey}`, 'User-Agent': AXIOS_CONFIG.headers['User-Agent'] }
            });
        } catch (e) {
            const status = e.response?.status || 'N/A';
            const detail = e.response?.data?.detail || e.response?.data || e.message;
            return { url: null, error: `TorBox: criação falhou (${status}) - ${detail}` };
        }

        if (!createResp.data?.success) return { url: null, error: 'TorBox: resposta inesperada ao criar torrent' };
        const torrentId = createResp.data.data?.torrent_id;
        if (!torrentId) return { url: null, error: 'TorBox: torrent id ausente' };

        let chosenFile = null;
        for (let i = 0; i < 12; i++) {
            await sleep(1500);
            try {
                const listResp = await axiosInstance.get(`https://api.torbox.app/v1/torrents/${torrentId}`, {
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': AXIOS_CONFIG.headers['User-Agent'] }
                });
                const files = listResp.data?.data?.files || [];
                if (files.length > 0) {
                    chosenFile = files.reduce((a,b) => a.size > b.size ? a : b);
                    break;
                }
            } catch (e) {
                // ignora e repete
            }
        }

        if (!chosenFile) return { url: null, error: 'TorBox: timeout listagem de arquivos' };

        try {
            const dlResp = await axiosInstance.get(`https://api.torbox.app/v1/torrents/${torrentId}/files/${chosenFile.id}/download`, {
                headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': AXIOS_CONFIG.headers['User-Agent'] }
            });
            if (dlResp.data?.success) {
                const out = { url: dlResp.data.data, error: null };
                cachePut(cacheKey, out, 5*60*1000);
                return out;
            } else {
                return { url: null, error: 'TorBox: falha ao gerar link de download' };
            }
        } catch (e) {
            return { url: null, error: 'TorBox: erro ao gerar link - ' + (e.response?.data?.detail || e.message) };
        }
    } catch (e) {
        return { url: null, error: 'TorBox ERRO: ' + (e.response?.data?.detail || e.message) };
    }
}

async function checkTorBoxCache(hashes, apiKey) {
    if (!hashes || !hashes.length) return {};
    try {
        const url = `https://api.torbox.app/v1/torrents/check?hash=${hashes.slice(0,40).join(',')}`;
        const resp = await axiosInstance.get(url, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': AXIOS_CONFIG.headers['User-Agent'] }
        });
        const out = {};
        hashes.forEach(h => out[h.toLowerCase()] = false);
        if (resp.data?.data) {
            Object.keys(resp.data.data).forEach(k => { out[k.toLowerCase()] = Boolean(resp.data.data[k]); });
        }
        return out;
    } catch (e) {
        return {};
    }
}

// ============================================================
// CONFIG PAGE (mantive o seu html)
// ============================================================
const configureHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brazuca Config</title><script src="https://cdn.tailwindcss.com"></script></head><body style="background:#0b0c10;color:#c5c6c7;font-family:Segoe UI, sans-serif;"><div style="max-width:760px;margin:32px auto;padding:20px;background:#1f2833;border-radius:12px;"><h1 style="color:#66fcf1">Brazuca Direct v22</h1><p style="color:#aaa">Configure RD e TorBox e clique em INSTALAR</p></div></body></html>`;

// ============================================================
// ROUTES
// ============================================================
app.get('/', (req, res) => res.send(configureHtml));
app.get('/configure', (req, res) => res.send(configureHtml));

app.get('/:config/manifest.json', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const m = { ...manifest };
    try { if (req.params.config && req.params.config.length > 5) m.behaviorHints = { configurable: true, configurationRequired: false }; } catch(e){}
    res.json(m);
});

app.get('/:config/stream/:type/:id.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let cfg;
    try { cfg = JSON.parse(Buffer.from(decodeURIComponent(req.params.config), 'base64').toString()); } catch(e) { return res.json({ streams: [] }); }
    const rdKey = cfg.rd, tbKey = cfg.tb;
    if (!rdKey && !tbKey) return res.json({ streams: [] });

    let streams = [];
    try {
        const resp = await axiosInstance.get(`${BRAZUCA_UPSTREAM}/stream/${req.params.type}/${req.params.id}.json`, { timeout: 8000 });
        streams = resp.data.streams || [];
    } catch (e) { return res.json({ streams: [] }); }

    if (!streams.length) return res.json({ streams: [] });

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
                s.infoHash = h; hashList.push(h);
            }
        }
    });

    let rdCache = {}, tbCache = {};
    if (rdKey && hashList.length) rdCache = await checkRealDebridCache(hashList, rdKey);
    if (tbKey && hashList.length) tbCache = await checkTorBoxCache(hashList, tbKey);

    const finalStreams = [];
    streams.forEach(s => {
        const h = s.infoHash; if (!h) return;
        const cleanTitle = (s.title || 'video').replace(/\n/g,' ').trim();

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

    finalStreams.sort((a,b) => (b.title.includes('⚡')?1:0) - (a.title.includes('⚡')?1:0));
    res.json({ streams: finalStreams });
});

app.get('/resolve/:service/:key/:hash', async (req, res) => {
    const { service, key, hash } = req.params;
    if (!key || !hash || !isValidInfoHash(hash)) return res.status(400).send('Parâmetros inválidos');
    let result = null;
    try {
        if (service === 'realdebrid') result = await resolveRealDebrid(hash, key);
        else if (service === 'torbox') result = await resolveTorBox(hash, key);
        else result = { url: null, error: 'Serviço desconhecido' };
    } catch (e) { result = { url: null, error: 'Erro interno: ' + (e && e.message ? e.message : e) }; }

    if (result && result.url) return res.redirect(result.url);
    const errorMsg = result ? result.error : 'Erro desconhecido';
    res.status(404).send(`<html><body style="background:#111;color:#fff;font-family:sans-serif"><div style="max-width:600px;margin:60px auto;padding:20px;border-radius:8px"><h2 style="color:#e74c3c">⚠️ Diagnóstico</h2><p>${escapeHtml(errorMsg)}</p><p style="color:#888">Veja logs do serviço para mais detalhes.</p></div></body></html>`);
});

app.use((req,res) => { console.error('404:', req.method, req.originalUrl); res.status(404).json({ error: 'Not found', path: req.originalUrl }); });

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Addon rodando na porta ${PORT} (light)`));
