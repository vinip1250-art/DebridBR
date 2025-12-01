const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

// ============================================================
// 1. CONFIGURAÇÕES GLOBAIS
// ============================================================
const UPSTREAM_BASE = "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";
const DEFAULT_NAME = "Brazuca"; 
const DEFAULT_LOGO = "https://i.imgur.com/KVpfrAk.png";
const PROJECT_VERSION = "2.0.0"; 
const STREMTHRU_HOST = "https://stremthru.atbphosting.com"; 

const REFERRAL_RD = "6684575";
const REFERRAL_TB = "b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96";

const TORRENTIO_PT_URL = "https://torrentio.strem.fun/providers=nyaasi,tokyotosho,anidex,comando,bludv,micoleaodublado|language=portuguese/manifest.json";

// ============================================================
// 2. AIOSTREAMS CONFIG (TEMPLATE)
// ============================================================
const AIO_CONFIG_JSON = {
  "services": [
    { "id": "torbox", "enabled": false, "credentials": {} },
    { "id": "realdebrid", "enabled": false, "credentials": {} },
    { "id": "alldebrid", "enabled": false, "credentials": {} },
    { "id": "premiumize", "enabled": false, "credentials": {} },
    { "id": "debridlink", "enabled": false, "credentials": {} },
    { "id": "stremio_nntp", "enabled": false, "credentials": {} },
    { "id": "nzbdav", "enabled": false, "credentials": {} },
    { "id": "altmount", "enabled": false, "credentials": {} },
    { "id": "offcloud", "enabled": false, "credentials": {} },
    { "id": "putio", "enabled": false, "credentials": {} },
    { "id": "easynews", "enabled": false, "credentials": {} },
    { "id": "easydebrid", "enabled": false, "credentials": {} },
    { "id": "debrider", "enabled": false, "credentials": {} },
    { "id": "pikpak", "enabled": false, "credentials": {} },
    { "id": "seedr", "enabled": false, "credentials": {} }
  ],
  "presets": [
    {
      "type": "stremthruTorz",
      "instanceId": "52c",
      "enabled": true,
      "options": {
        "name": "StremThru Torz",
        "timeout": 15000,
        "resources": ["stream"],
        "mediaTypes": [],
        "services": ["torbox"], // RD será adicionado via script se necessário
        "includeP2P": false,
        "useMultipleInstances": false
      }
    },
    {
      "type": "torbox-search",
      "instanceId": "f7a",
      "enabled": true,
      "options": {
        "name": "TorBox Search",
        "timeout": 15000,
        "sources": ["torrent"],
        "services": ["torbox"],
        "mediaTypes": [],
        "userSearchEngines": false,
        "onlyShowUserSearchResults": false,
        "useMultipleInstances": false
      }
    },
    {
      "type": "bitmagnet",
      "instanceId": "437",
      "enabled": true,
      "options": {
        "name": "Bitmagnet",
        "timeout": 15000,
        "mediaTypes": [],
        "services": ["torbox"],
        "useMultipleInstances": false,
        "paginate": false
      }
    },
    {
      "type": "tmdb-addon",
      "instanceId": "6d5",
      "enabled": true,
      "options": {
        "name": "The Movie Database",
        "timeout": 15000,
        "resources": ["catalog", "meta"],
        "url": "https://tmdb.elfhosted.com/N4IgTgDgJgRg1gUwJ4gFwgC4AYC0AzMBBHSWEAGhAjAHsA3ASygQEkBbWFqNTMAVwQVwCDHzAA7dp27oM-QZQA2AQ3EBzPsrWD0EDDgBCAJSEBnOQmVsG6tAG0Q4vAA8hACxhshUcRCFW-SgBjfiEINkCQZQxItRo-AF1g6OVFGjVTe1AmHgwOGAA6DHihDCQIHRA2egYFRytKgAV4vhUwMzcaAHcWcQAJGjYdOQEAX3JsmUx8opLKMoqeUwQwWszKcQaeZohW5XbKU06e-sHh+XHJ3JmLcSgbNVLyyurGOs2hngAVQjuHju6vQGn1QIwQlxAOVkN1+91s82eSxWayEH0qPwQf3hICOgNOILBEKhOIsVgeBScrgRi3Qr1qqK26AAciI8IoGFScccgWc0ISJpCpuZCGT1BSXE8aTjkQh1vUQSAWRg2RyASdgecxgLicLLNYxR4vNSXjV3oyQH0DAB5AAEAFllJzcereaCLtqhaT9WoCobJZVlqtZQyFZbbQ6ndz8ZrwR6ll7yT5IgsTW8Q5UACIMUziZAAajVPIJ7qu6F1op9Sf9SKDcrRPCzOfzhejfJLgvjIu9BQC1dppvT21WQxtADUmAgaC2NW2taWSV3yb3jTWURtzY1hwgxxOp4cozO3XOO2WE2LwsnEf20+uFY19lYaHxxBgC-u8Yf+fPy92L33pbWg7oPeYCPs+r7Tq6X4nguepLjE-50maCoAIIQBAijbl8o5vlyH5Qe2Opnj60SXlKgZrvKlRoRhWE4ZBxbHkRi5inEZGpvSt6VAA4mkMDxCoKDvi6jGxt+xEFCEfCIQOXE8AAwvw4hBG4SC0IoigMTGRKeixPpsf+FHBnJ6C8TQ-EYcoQl4SJ2lxqeemSaEK5ljKdbmopz4qWpNAaVps7gkkUTaEY0T-OgJjJOY8lPi+aAAKzCShIVheovTcZihCZLI8hCJiygwJhyUIKFGDhSAeCpMsarFaVDwAOoMBgbhSDAdW2OglWKNVoxAA/manifest.json",
        "Enable Adult Content": false,
        "hideEpisodeThumbnails": false,
        "provideImdbId": true,
        "ageRating": "R",
        "language": "pt-BR"
      }
    },
    {
      "type": "anime-kitsu",
      "instanceId": "3ac",
      "enabled": true,
      "options": {
        "name": "Anime Kitsu",
        "timeout": 15000,
        "resources": ["catalog", "meta"]
      }
    }
  ],
  "formatter": {
    "id": "custom",
    "definition": {
      "name": "{stream.resolution::=2160p[\"🎞️ 4K\"||\"\"]}{stream.resolution::=1440p[\"🎞️ 2K\"||\"\"]}{stream.resolution::=1080p[\"🎞️ FHD\"||\"\"]}{stream.resolution::=720p[\"💿 HD\"||\"\"]}{stream.resolution::=576p[\"📼 576P\"||\"\"]}{stream.resolution::=480p[\"📼 480P\"||\"\"]}{stream.resolution::exists[\"\"||\"❔ Unkown Resolution\"]}\n{stream.quality::~REMUX[\"📀 Remux\"||\"\"]}{stream.quality::=BluRay[\"💿 BluRay\"||\"\"]}{stream.quality::~DL[\"🌐 WEBDL\"||\"\"]}{stream.quality::=WEBRIP[\"🖥 WEBRip\"||\"\"]}{stream.quality::=HDRIP[\"💾 HDRip\"||\"\"]}{stream.quality::~HC[\"💾 HC\"||\"\"]}{stream.quality::=DVDRip[\"💾 DVDRip\"||\"\"]}{stream.quality::=HDTV[\"💾 HDTV\"||\"\"]}{stream.quality::=TS[\"💾 TS\"||\"\"]}{stream.quality::=TC[\"💾 TC\"||\"\"]}",
      "description": "{stream.network::exists[\" 🍿 {stream.network}\"||\"\"]}\n🧩{addon.name} 🫆 {service.shortName}{service.cached::istrue[\"⚡\"||\"\"]}{service.cached::isfalse[\"⏳\"||\"\"]} {stream.proxied::istrue[\"👻\"||\"\"]}{stream.seeders::>0[\"🌱{stream.seeders}  \"||\"\"]}\n{stream.visualTags::exists[\"📺{stream.visualTags::join(' · ')} \"||\"\"]}{stream.audioTags::exists[\"🔊 {stream.audioTags::join(' 🎧 ')}\"||\"\"]} \n{stream.size::>0[\"📁 {stream.size::bytes} \"||\"\"]}{stream.folderSize::>0[\"📦 {stream.folderSize::bytes}\"||\"\"]}{stream.duration::>0[\"⏱️ {stream.duration::time} \"||\"\"]}\n{stream.languages::exists[\"🗣 {stream.uLanguageEmojis::join(' / ')}\"||\"\"]}{stream.title::~brazilian::or::stream.filename::~brazilian::or::stream.title::~dublado::or::stream.filename::~dublado::or::stream.title::~'pt-br'::or::stream.filename::~'pt-br'::or::stream.title::~'multi-audio'::or::stream.filename::~'multi-audio'::or::stream.releaseGroup::=100real::or::stream.releaseGroup::=3lton::or::stream.releaseGroup::=aconduta::or::stream.releaseGroup::=adamantium::or::stream.releaseGroup::=alfahd::or::stream.releaseGroup::=amantedoharpia::or::stream.releaseGroup::=anonimo::or::stream.releaseGroup::=anonymous07::or::stream.releaseGroup::=asm::or::stream.releaseGroup::=asy::or::stream.releaseGroup::=azx::or::stream.releaseGroup::=bad::or::stream.releaseGroup::=bdc::or::stream.releaseGroup::=big::or::stream.releaseGroup::=bioma::or::stream.releaseGroup::=bnd::or::stream.releaseGroup::=brhd::or::stream.releaseGroup::=byoutou::or::stream.releaseGroup::=c.a.a::or::stream.releaseGroup::=c0ral::or::stream.releaseGroup::=c76::or::stream.releaseGroup::=cbr::or::stream.releaseGroup::=cory::or::stream.releaseGroup::=cza::or::stream.releaseGroup::=dalmaciojr::or::stream.releaseGroup::=dks::or::stream.releaseGroup::=dm::or::stream.releaseGroup::=elm4g0::or::stream.releaseGroup::=emmid::or::stream.releaseGroup::=eri::or::stream.releaseGroup::=estagiario::or::stream.releaseGroup::=extr3muss::or::stream.releaseGroup::=fantasma223::or::stream.releaseGroup::=ff::or::stream.releaseGroup::=fido::or::stream.releaseGroup::=filehd::or::stream.releaseGroup::=fly::or::stream.releaseGroup::=foxx::or::stream.releaseGroup::=franzopl::or::stream.releaseGroup::=freddiegellar::or::stream.releaseGroup::=freedomhd::or::stream.releaseGroup::=g4ris::or::stream.releaseGroup::=gmn::or::stream.releaseGroup::=got::or::stream.releaseGroup::=gris::or::stream.releaseGroup::=gueira::or::stream.releaseGroup::=izards::or::stream.releaseGroup::=jk::or::stream.releaseGroup::=joekerr::or::stream.releaseGroup::=jus::or::stream.releaseGroup::=kallango::or::stream.releaseGroup::=lapumia::or::stream.releaseGroup::=lcd::or::stream.releaseGroup::=lmb::or::stream.releaseGroup::=ltda::or::stream.releaseGroup::=lucano22::or::stream.releaseGroup::=lukas::or::stream.releaseGroup::=madruga::or::stream.releaseGroup::=master::or::stream.releaseGroup::=mdg::or::stream.releaseGroup::=mlh::or::stream.releaseGroup::=n3g4n::or::stream.releaseGroup::=nex::or::stream.releaseGroup::=nous3r::or::stream.releaseGroup::=ntz::or::stream.releaseGroup::=olympus::or::stream.releaseGroup::=oscarniemeyer::or::stream.releaseGroup::=pd::or::stream.releaseGroup::=pia::or::stream.releaseGroup::=piratadigital::or::stream.releaseGroup::=plushd::or::stream.releaseGroup::=potatin::or::stream.releaseGroup::=princeputt20::or::stream.releaseGroup::=professor_x::or::stream.releaseGroup::=rarbr::or::stream.releaseGroup::=riper::or::stream.releaseGroup::=rk::or::stream.releaseGroup::=rlee::or::stream.releaseGroup::=rq::or::stream.releaseGroup::=sacerdoti::or::stream.releaseGroup::=sgf::or::stream.releaseGroup::=sh4down::or::stream.releaseGroup::=shaka::or::stream.releaseGroup::=shelby::or::stream.releaseGroup::=sherlock::or::stream.releaseGroup::=sigla::or::stream.releaseGroup::=spaghettimancer::or::stream.releaseGroup::=tars::or::stream.releaseGroup::=thr::or::stream.releaseGroup::=tijuco::or::stream.releaseGroup::=tossato::or::stream.releaseGroup::=troidex::or::stream.releaseGroup::=tupac::or::stream.releaseGroup::=upd::or::stream.releaseGroup::=vnlls::or::stream.releaseGroup::=witchhunter::or::stream.releaseGroup::=wtv::or::stream.releaseGroup::=wyrm::or::stream.releaseGroup::=xiquexique::or::stream.releaseGroup::=xprince00::or::stream.releaseGroup::=yatogam1::or::stream.releaseGroup::=zmg::or::stream.releaseGroup::=znm[\" / 🇧🇷\"||\"\"]}\n{stream.indexer::exists[\"📌 {stream.indexer}\"||\"\"]}{stream.releaseGroup::exists[\" 🏷️{stream.releaseGroup}\"||\"\"]}\n{stream.filename::exists[\"{stream.filename}\"||\"\"]}"
    }
  },
  "preferredQualities": ["BluRay", "WEB-DL", "WEBRip", "HDRip", "HC HD-Rip", "DVDRip", "HDTV", "CAM", "TS", "TC", "SCR", "Unknown", "BluRay REMUX"],
  "preferredResolutions": ["2160p", "1440p", "1080p", "720p", "Unknown", "576p", "480p"],
  "excludedQualities": ["CAM"],
  "addonName": "AIO PT-BR",
  "addonDescription": "AIOStreams configurado para priorizar conteudo dublado em PT-BR.",
  "requiredLanguages": ["Portuguese", "Multi", "Dual Audio", "Dubbed", "Unknown"],
  "preferredLanguages": ["Portuguese", "Multi", "Dubbed", "Dual Audio", "Unknown"],
  "excludedStreamTypes": ["p2p"],
  "preferredStreamTypes": ["debrid", "http"],
  "preferredKeywords": ["riper", "bioma", "alfahd", "c76", "pia", "sigla", "madruga", "ff", "pd", "yatogam1", "asy", "g4ris", "sh4down", "kallango", "upd", "100real", "wtv", "tars", "mdg", "cza", "tupac", "eck", "fly", "mlh", "amantedoharpia", "potatin", "lukas", "lucano22", "witchhunter", "c0ral"],
  "preferredStreamExpressions": [
    "indexer(streams, 'BluDV', 'Comando', 'DarkMahou', 'EraiRaws', 'Keroseed', 'NyaaSi', 'RedeTorrent', 'TorrentDosFilmes', 'VacaTorrent', 'RedeTorrent', 'ApacheTorrent', 'Stark' )",
    "releaseGroup(streams, '100real', '3lton', 'aconduta', 'adamantium', 'alfahd', 'AndreTPF', 'amantedoharpia', 'anonimo', 'anonymous07', 'asm', 'asy', 'azx', 'bad', 'bdc', 'big', 'BiOMA', 'bnd', 'brhd', 'byoutou', 'C.A.A', 'c0ral', 'c76', 'cbr', 'cory', 'cza', 'dalmaciojr', 'DKS', 'dm', 'elm4g0', 'emmid', 'eri', 'estagiario', 'extr3muss', 'fantasma223', 'ff', 'fido', 'filehd', 'fly', 'foxx', 'franzopl', 'freddiegellar', 'FreedomHD', 'g4ris', 'gmn', 'got', 'gris', 'gueira', 'izards', 'jk', 'joekerr', 'jus', 'kallango', 'lapumia', 'lcd', 'lmb', 'ltda', 'lucano22', 'lukas', 'madruga', 'master', 'mdg', 'mlh', 'n3g4n', 'nex', 'nous3r', 'ntz', 'olympus', 'oscarniemeyer', 'pd', 'pia', 'piratadigital', 'plushd', 'potatin', 'princeputt20', 'Professor_X', 'RARBR', 'riper', 'rk', 'rlee', 'sacerdoti', 'sgf', 'sh4down', 'shaka', 'shelby', 'sherlock', 'sigla', 'spaghettimancer', 'tars', 'thr', 'tijuco', 'tossato', 'troidex', 'tupac', 'upd', 'vnlls', 'witchhunter', 'WTV', 'WYRM', 'xiquexique', 'xprince00', 'yatogam1', 'zmg', 'znm' )"
  ],
  "resultLimits": { "addon": 6 },
  "size": { "global": { "movies": [0, 100000000000], "series": [0, 100000000000] } },
  "hideErrors": true,
  "statistics": { "enabled": true, "position": "bottom", "statsToShow": ["addon"] },
  "autoPlay": { "enabled": true, "attributes": ["service", "proxied", "resolution", "quality", "encode", "audioTags", "visualTags", "languages", "releaseGroup"] },
  "precacheNextEpisode": true,
  "alwaysPrecache": true,
  "catalogModifications": [
    { "id": "6d5e3b0.tmdb.top", "name": "Popular", "type": "movie", "enabled": true },
    { "id": "6d5e3b0.tmdb.top", "name": "Popular", "type": "series", "enabled": true },
    { "id": "6d5e3b0.tmdb.trending", "name": "Tendências", "type": "movie", "enabled": true },
    { "id": "6d5e3b0.streaming.nfx", "name": "Netflix", "type": "movie", "enabled": true },
    { "id": "6d5e3b0.streaming.amp", "name": "Prime Video", "type": "series", "enabled": true }
  ]
};

// ============================================================
// 3. ROTA DOWNLOAD AIOSTREAMS (Fallback Estático)
// ============================================================
app.get('/download/aiostreams-config.json', (req, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename="aiostreams-config-PT-BR.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(AIO_CONFIG_JSON, null, 2));
});

// ============================================================
// 4. ROTA MANIFESTO (Proxy)
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
// 5. ROTA REDIRECIONADORA (FIX 404)
// ============================================================

// Captura TODAS as rotas /addon/*
app.get('/addon/*', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const originalPath = req.url.replace('/addon', '');
    const upstreamUrl = `${UPSTREAM_BASE}${originalPath}`;
    
    // 1. Lógica de Streams
    if (originalPath.startsWith('/stream/')) {
        res.setHeader('Content-Type', 'application/json');
        
        try {
            const response = await axios.get(upstreamUrl);
            let streams = response.data.streams || [];

            return res.json({ streams: streams });

        } catch (error) {
            console.error("Stream Fetch Error:", error.message);
            return res.status(404).json({ streams: [] }); 
        }
    }
    
    // 2. Lógica de Redirecionamento (Catálogos, Meta, etc.)
    res.redirect(307, upstreamUrl);
});


// ============================================================
// 6. INTERFACE
// ============================================================
const generatorHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brazuca Wrapper V2</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="/_vercel/insights/script.js"></script> 
    <style>
        body { background-color: #0a0a0a; color: #e5e5e5; font-family: sans-serif; }
        .card { background-color: #141414; border: 1px solid #262626; }
        .input-dark { background-color: #0a0a0a; border: 1px solid #333; color: white; transition: 0.2s; }
        .input-dark:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        
        .btn-action { 
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%); 
            color: white; font-weight: bold; 
            transition: all 0.3s ease;
        }
        
        .btn-sub { font-weight: 600; font-size: 0.8rem; padding: 10px; border-radius: 0.5rem; border: 1px solid; text-align: center; display: block; transition: 0.2s; }
        .btn-sub-tb { background: #008000; color: white; border-color: #006400; } 
        .btn-sub-rd { background: #2563eb; color: white; border-color: #1e40af; } 
        .btn-sub-tb:hover { background: #32cd32; }
        .btn-sub-rd:hover { background: #1e40af; }

        .btn-file {
            background: #1f2937; color: #9ca3af; border: 1px solid #374151;
            font-size: 0.75rem; padding: 8px 12px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; text-decoration: none;
            cursor: pointer;
        }
        .btn-file:hover { background: #374151; color: white; border-color: #4b5563; }
        
        .divider { border-top: 1px solid #262626; margin: 25px 0; position: relative; }
        .input-container { margin-bottom: 1.5rem; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 bg-black">

    <div class="w-full max-w-lg card rounded-2xl shadow-2xl p-6 border border-gray-800 relative">
        
        <!-- Header -->
        <div class="text-center mb-8">
            <img src="${DEFAULT_LOGO}" id="previewLogo" class="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-gray-800 shadow-lg object-cover">
            <h1 class="text-3xl font-extrabold text-white tracking-tight">Brazuca <span class="text-blue-500">Wrapper</span></h1>
            <p class="text-gray-500 text-xs mt-1 uppercase tracking-widest">GERADOR STREMTHRU V${PROJECT_VERSION}</p>
        </div>

        <form class="space-y-6">
            
            <!-- 1. Instância -->
            <div class="hidden">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">1. Servidor (Bridge)</label>
                <select id="instance" class="w-full input-dark p-3 rounded-lg text-sm mt-1 cursor-pointer">
                    <option value="${STREMTHRU_HOST}">Midnight</option>
                </select>
            </div>

            <!-- Personalização -->
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Nome do Addon</label>
                    <input type="text" id="custom_name" value="${DEFAULT_NAME}" class="w-full input-dark p-2 rounded text-sm mt-1">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Ícone (URL)</label>
                    <input type="text" id="custom_logo" value="${DEFAULT_LOGO}" class="w-full input-dark p-2 rounded text-sm mt-1" onchange="updatePreview()">
                </div>
            </div>

            <!-- 2. Fontes Extras -->
            <div class="divider"></div>
            <div class="space-y-3">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">2. Fontes de Torrent</label>
                
                <div class="bg-[#161616] p-3 rounded border border-gray-800">
                    <label class="flex items-center gap-3">
                        <span class="text-sm font-bold text-gray-300">✔ Brazuca (Default)</span>
                    </label>
                </div>
                
                 <div class="bg-[#161616] p-3 rounded border border-gray-800">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="use_torrentio" checked class="w-4 h-4 accent-red-600" onchange="validate()">
                        <span class="text-sm font-bold text-gray-300">Incluir Torrentio (PT/BR)</span>
                    </label>
                    <p class="text-[10px] text-gray-500 mt-1 ml-1">Torrentio Customizado incluso para resultados em português/BR.</p>
                </div>
            </div>

            <!-- 3. Debrids (Tokens) -->
            <div class="divider"></div>
            
            <div class="space-y-6">
                
                <!-- TORBOX -->
                <div class="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                    <div class="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="use_tb" class="w-5 h-5 accent-purple-600 cursor-pointer" onchange="validate()">
                        <span class="text-sm font-bold text-white">TorBox</span>
                    </div>
                    
                    <div class="input-container">
                        <input type="text" id="tb_key" placeholder="Cole sua API KEY" class="w-full input-dark px-4 py-3 rounded-lg text-sm">
                    </div>
                    
                    <div class="grid grid-cols-1 gap-3">
                        <a href="https://torbox.app/subscription?referral=${REFERRAL_TB}" target="_blank" class="btn-sub btn-sub-tb w-full shadow-lg shadow-purple-900/20 text-center font-bold">
                            Assinar TorBox <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                        <p class="text-xs text-center text-green-400 mt-1">Ganhe 7 dias extras/mês ou 84 dias por 1 ano assinado: <span id="tb_ref_code" class="font-mono text-xs cursor-pointer select-all underline" onclick="copyRefCode('${REFERRAL_TB}')">Copiar Código</span></p>
                    </div>
                </div>

                <!-- REAL DEBRID -->
                <div class="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                    <div class="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="use_rd" class="w-5 h-5 accent-blue-600 cursor-pointer" onchange="validate()">
                        <span class="text-sm font-bold text-white">Real-Debrid</span>
                    </div>
                    
                    <div class="input-container">
                        <input type="text" id="rd_key" placeholder="Cole sua API KEY" class="w-full input-dark px-4 py-3 rounded-lg text-sm" >
                    </div>
                    
                    <div class="grid grid-cols-1 gap-3">
                        <a href="http://real-debrid.com/?id=${REFERRAL_RD}" target="_blank" class="btn-sub btn-sub-rd w-full shadow-lg shadow-blue-900/20 text-center font-bold">
                            Assinar Real-Debrid <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Resultado -->
            <div id="resultArea" class="hidden pt-4 border-t border-gray-800 space-y-3">
                <div class="relative">
                    <input type="text" id="finalUrl" readonly class="w-full bg-black border border-blue-900 text-blue-400 text-[10px] p-3 rounded pr-12 font-mono outline-none">
                    <button type="button" onclick="copyLink()" class="absolute right-1 top-1 bottom-1 bg-blue-900 hover:bg-blue-800 text-white px-3 rounded text-xs font-bold transition">COPY</button>
                </div>
                
                <a id="installBtn" href="#" class="block w-full btn-action py-3.5 rounded-xl text-center font-bold text-sm uppercase tracking-widest shadow-lg">
                    INSTALAR BRAZUCA WRAPPER
                </a>

                <!-- AIOStreams Botão -->
                <div class="divider"></div>
                <div class="bg-[#111] p-3 rounded border border-gray-800 text-center">
                    <p class="text-xs text-gray-400 mb-2">Alternativa (Addon Separado):</p>
                    <a id="downloadAioConfig" href="#" class="block w-full bg-purple-900 hover:bg-purple-800 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wide mb-2" onclick="downloadConfig(event)">
                        <i class="fas fa-file-code mr-1"></i> Baixar Config AIO (Com Keys)
                    </a>
                    <a href="https://aio.atbphosting.com/stremio/configure?menu=save-install" target="_blank" class="block w-full text-[10px] text-gray-500 hover:text-gray-300 mt-2 underline">
                        Abrir Configurador Online
                    </a>
                </div>
            </div>

            <button type="button" onclick="generate()" id="btnGenerate" class="w-full bg-gray-800 text-gray-500 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed transition" disabled>
                GERAR CONFIGURAÇÃO
            </button>
            
        </form>
    </div>

    <div id="toast" class="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg hidden">Link Copiado!</div>

    <script>
        const STREMTHRU_HOST = "${STREMTHRU_HOST}";
        const REFERRAL_TB = "${REFERRAL_TB}";
        const REFERRAL_RD = "${REFERRAL_RD}";
        const TORRENTIO_PT_URL = "${TORRENTIO_PT_URL}";
        
        // Injeta o template JSON no escopo do JavaScript
        const AIO_TEMPLATE = ${JSON.stringify(AIO_CONFIG_JSON)};

        function updatePreview() {
            const url = document.getElementById('custom_logo').value.trim();
            if(url) document.getElementById('previewLogo').src = url;
        }

        function validate() {
            const rd = document.getElementById('use_rd').checked;
            const tb = document.getElementById('use_tb').checked;
            const rdInput = document.getElementById('rd_key');
            const tbInput = document.getElementById('tb_key');
            const btn = document.getElementById('btnGenerate');

            rdInput.disabled = !rd;
            tbInput.disabled = !tb;

            rdInput.parentElement.style.opacity = rd ? '1' : '0.5';
            tbInput.parentElement.style.opacity = tb ? '1' : '0.5';

            if(!rd) rdInput.value = '';
            if(!tb) tbInput.value = '';
            
            const isRdValid = rd && rdInput.value.trim().length > 5;
            const isTbValid = tb && tbInput.value.trim().length > 5;
            
            const isValid = isRdValid || isTbValid;

            if(isValid) {
                btn.classList.replace('bg-gray-800', 'btn-action');
                btn.classList.replace('text-gray-500', 'text-white');
                btn.classList.remove('cursor-not-allowed');
                btn.disabled = false;
            } else {
                btn.classList.replace('btn-action', 'bg-gray-800');
                btn.classList.replace('text-white', 'text-gray-500');
                btn.classList.add('cursor-not-allowed');
                btn.disabled = true;
            }
        }

        document.getElementById('rd_key').addEventListener('input', validate);
        document.getElementById('tb_key').addEventListener('input', validate);
        document.getElementById('use_rd').addEventListener('change', validate);
        document.getElementById('use_tb').addEventListener('change', validate);

        function generate() {
            let host = STREMTHRU_HOST;
            host = host.replace(/\\/$/, '').replace('http:', 'https:');
            if (!host.startsWith('http')) host = 'https://' + host;

            const cName = document.getElementById('custom_name').value.trim();
            const cLogo = document.getElementById('custom_logo').value.trim();
            const useTorrentio = document.getElementById('use_torrentio').checked;
            
            const rdKey = document.getElementById('rd_key').value.trim();
            const tbKey = document.getElementById('tb_key').value.trim();

            const finalName = cName || "Brazuca"; 

            let proxyParams = \`?name=\${encodeURIComponent(finalName)}\`;
            if(cLogo) proxyParams += \`&logo=\${encodeURIComponent(cLogo)}\`;

            const myMirrorUrl = window.location.origin + "/addon/manifest.json" + proxyParams + "&t=" + Date.now();

            let config = { upstreams: [], stores: [] };
            
            config.upstreams.push({ u: myMirrorUrl });
            
            if (useTorrentio) {
                config.upstreams.push({ u: TORRENTIO_PT_URL });
            }
            
            if (document.getElementById('use_rd').checked && rdKey) {
                config.stores.push({ c: "rd", t: rdKey });
            }
            if (document.getElementById('use_tb').checked && tbKey) {
                config.stores.push({ c: "tb", t: tbKey });
            }

            const b64 = btoa(JSON.stringify(config));
            const hostClean = host.replace(/^https?:\\/\\//, '');
            const httpsUrl = \`\${host}/stremio/wrap/\${b64}/manifest.json\`;
            const stremioUrl = \`stremio://\${hostClean}/stremio/wrap/\${b64}/manifest.json\`; 

            document.getElementById('finalUrl').value = httpsUrl;
            document.getElementById('installBtn').href = stremioUrl;

            document.getElementById('btnGenerate').classList.add('hidden');
            document.getElementById('resultArea').classList.remove('hidden');
        }

        // Função de download dinâmico para injetar as chaves
        function downloadConfig(e) {
            e.preventDefault();
            
            const aioConfig = JSON.parse(JSON.stringify(AIO_TEMPLATE));
            const rdKey = document.getElementById('rd_key').value.trim();
            const tbKey = document.getElementById('tb_key').value.trim();
            const useRd = document.getElementById('use_rd').checked;
            const useTb = document.getElementById('use_tb').checked;

            if (useRd && rdKey) {
                const rdService = aioConfig.services.find(s => s.id === 'realdebrid');
                if (rdService) {
                    rdService.enabled = true;
                    rdService.credentials = { apiKey: rdKey };
                }
                const preset = aioConfig.presets.find(p => p.type === 'stremthruTorz');
                if(preset && !preset.options.services.includes('realdebrid')) {
                    preset.options.services.push('realdebrid');
                }
            }

            if (useTb && tbKey) {
                const tbService = aioConfig.services.find(s => s.id === 'torbox');
                if (tbService) {
                    tbService.enabled = true;
                    tbService.credentials = { apiKey: tbKey };
                }
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(aioConfig, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "aiostreams-config-PT-BR.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        function copyLink() {
            const el = document.getElementById('finalUrl');
            el.select();
            document.execCommand('copy');
            const btn = document.querySelector('button[onclick="copyLink()"]');
            const oldTxt = btn.innerText;
            btn.innerText = "LINK COPIADO!";
            setTimeout(() => btn.innerText = oldTxt, 1500);
        }

        function copyRefCode(code) {
            navigator.clipboard.writeText(code).then(() => {
                const toast = document.getElementById('toast');
                toast.innerText = "CÓDIGO COPIADO!";
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 2000);
            });
        }
    </script>
</body>
</html>
`;

// ============================================================
// 7. ROTAS (ORDENADAS CORRETAMENTE)
// ============================================================

// 1. Interface (GET /)
app.get('/', (req, res) => res.send(generatorHtml));
app.get('/configure', (req, res) => res.send(generatorHtml));

// 2. Download JSON Estático (Fallback)
app.get('/download/aiostreams-config.json', (req, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename="aiostreams-config-PT-BR.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(AIO_CONFIG_JSON, null, 2));
});

// 3. Manifesto (GET /addon/manifest.json)
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

// 4. Redirecionamento Catch-All (GET /addon/*)
app.get('/addon/*', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const originalPath = req.url.replace('/addon', '');
    const upstreamUrl = `${UPSTREAM_BASE}${originalPath}`;
    
    if (originalPath.startsWith('/stream/')) {
        res.setHeader('Content-Type', 'application/json');
        try {
            const response = await axios.get(upstreamUrl);
            let streams = response.data.streams || [];
            return res.json({ streams: streams });
        } catch (error) {
            console.error("Stream Fetch Error:", error.message);
            return res.status(404).json({ streams: [] }); 
        }
    }
    res.redirect(307, upstreamUrl);
});


// ============================================================
// 8. START
// ============================================================
const PORT = process.env.PORT || 7000;
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Gerador rodando na porta ${PORT}`);
    });
}


