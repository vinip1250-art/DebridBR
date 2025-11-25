const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

// ============================================================
// 1. CONFIGURAÇÕES PADRÃO
// ============================================================
const UPSTREAM_BASE = "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";
const DEFAULT_NAME = "Brazuca"; 
const DEFAULT_LOGO = "https://i.imgur.com/KVpfrAk.png";
const PROJECT_VERSION = "1.0.0"; 

const REFERRAL_RD = "6684575";
const REFERRAL_TB = "b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96";

// ============================================================
// 2. ROTA MANIFESTO (Proxy)
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
// 3. ROTA REDIRECIONADORA (FIX 404)
// ============================================================

// Captura TODAS as rotas /addon/*
app.get('/addon/*', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const originalPath = req.url.replace('/addon', '');
    const upstreamUrl = `${UPSTREAM_BASE}${originalPath}`;
    
    // 1. Lógica de Parsing (APENAS SE FOR ROTA DE STREAM)
    if (originalPath.startsWith('/stream/')) {
        res.setHeader('Content-Type', 'application/json');
        
        try {
            const response = await axios.get(upstreamUrl);
            let streams = response.data.streams || [];

            // Apenas retorna os streams. Deixamos o StremThru Wrapper fazer o parsing
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
// 4. INTERFACE (Com Selector de Template)
// ============================================================
const generatorHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brazuca Wrapper</title>
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
        
        .divider { border-top: 1px solid #262626; margin: 25px 0; position: relative; }
        .input-container { margin-bottom: 1.5rem; }
        .textarea-small { font-family: monospace; font-size: 10px; }
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
            <div>
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">1. Servidor (Bridge)</label>
                <select id="instance" class="w-full input-dark p-3 rounded-lg text-sm mt-1 cursor-pointer">
                    <option value="https://stremthrufortheweebs.midnightignite.me">Midnight</option>
                    <option value="https://stremthru.elfhosted.com">Elfhosted</option>
                </select>
            </div>

            <!-- Personalização -->
            <div class="divider"></div>
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
            
            <!-- 2. Customização de Formato -->
            <div class="divider"></div>
            <div>
                <label class="text-xs font-bold text-gray-500 uppercase ml-1 block mb-2">2. Formatação Customizada (Opcional)</label>
                
                <select id="format_selector" onchange="loadFormatTemplate()" class="w-full input-dark p-3 rounded-lg text-sm mb-2 cursor-pointer">
                    <option value="">-- Escolher um Modelo --</option>
                    <option value="simple">Simples (FHD • Dual)</option>
                    <option value="avancado">Avançado (Qualidade + Áudio + Idioma)</option>
                </select>

                <textarea id="custom_format_string" placeholder='Cole a string JSON de formatação (ex: {"name": "{stream.resolution::=2160p[...]})' class="w-full input-dark p-2 rounded textarea-small h-24 resize-none"></textarea>
                <p class="text-[10px] text-gray-600">Este código dita o que aparece ao lado do nome do filme no Stremio. (Requer conhecimento de Torrentio Formatter)</p>
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
                        <input type="text" id="tb_key" placeholder="Cole sua API KEY" class="w-full input-dark px-4 py-3 rounded-lg text-sm" disabled>
                    </div>
                    
                    <div class="grid grid-cols-1 gap-3">
                        <a href="https://torbox.app/subscription?referral=${REFERRAL_TB}" target="_blank" class="btn-sub btn-sub-tb w-full shadow-lg shadow-purple-900/20 text-center font-bold">
                            Assinar TorBox <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                        <p class="text-xs text-center text-green-400 mt-1">Ganhe 7 dias extras: <span id="tb_ref_code" class="font-mono text-xs cursor-pointer select-all underline" onclick="copyRefCode('${REFERRAL_TB}')">Copiar Código</span></p>
                    </div>
                </div>

                <!-- REAL DEBRID -->
                <div class="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                    <div class="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="use_rd" class="w-5 h-5 accent-blue-600 cursor-pointer" onchange="validate()">
                        <span class="text-sm font-bold text-white">Real-Debrid</span>
                    </div>
                    
                    <div class="input-container">
                        <input type="text" id="rd_key" placeholder="Cole sua API KEY" class="w-full input-dark px-4 py-3 rounded-lg text-sm" disabled>
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
                
                <a id="installBtn" href="#" class="block w-full btn-action py-3.5 rounded-xl text-center font-bold text-sm uppercase tracking-wide shadow-lg">
                    INSTALAR AGORA
                </a>
            </div>

            <button type="button" onclick="generate()" id="btnGenerate" class="w-full bg-gray-800 text-gray-500 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed transition" disabled>
                GERAR CONFIGURAÇÃO
            </button>

        </form>
    </div>

    <div id="toast" class="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg hidden">Link Copiado!</div>

    <script>
        const instanceSelect = document.getElementById('instance');
        const REFERRAL_TB = "${REFERRAL_TB}";

        const FORMATS = {
            simple: {
                name: "{stream.resolution::=2160p[\"4K\"||\"\"]}{stream.resolution::=1080p[\"FHD\"||\"\"]} • {stream.languages::join(' / ')}",
                description: "{stream.audioTags::join(' | ')} | {stream.visualTags::join(' | ')} | {stream.size::bytes}"
            },
            avancado: {
                name: "{stream.resolution::=2160p[\"🟣 4K\"||\"\"]}{stream.resolution::=1080p[\"🔵 FHD\"||\"\"]}{stream.resolution::=720p[\"🟢 HD\"||\"\"]}{stream.quality::~REMUX[\" 📀 Remux\"||\"\"]}{stream.quality::~DL[\" 🌐 WEB-DL\"||\"\"]}",
                description: "{stream.visualTags::~HDR[\"📺 HDR\"||\"\"]}{stream.visualTags::~DV[\"🎬 DV\"||\"\"]} | {stream.audioTags::~ATMOS[\"🎧 Atmos\"||\"\"]}{stream.audioTags::~DDP[\"🔊 DD+\"||\"\"]} | {stream.languages::join(' / ')}"
            }
        };

        function loadFormatTemplate() {
            const selector = document.getElementById('format_selector');
            const textarea = document.getElementById('custom_format_string');
            const key = selector.value;
            
            if (key && FORMATS[key]) {
                const template = JSON.stringify(FORMATS[key], null, 2);
                textarea.value = template;
            } else {
                textarea.value = '';
            }
        }
        
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
            
            if(!rd) rdInput.value = '';
            if(!tb) tbInput.value = '';
            
            rdInput.parentElement.style.opacity = rd ? '1' : '0.5';
            tbInput.parentElement.style.opacity = tb ? '1' : '0.5';

            const isValid = (rd && rdInput.value.trim().length > 5) || (tb && tbInput.value.trim().length > 5);

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

        function generate() {
            let host = instanceSelect.value;
            host = host.replace(/\\/$/, '').replace('http:', 'https:');
            if (!host.startsWith('http')) host = 'https://' + host;

            const cName = document.getElementById('custom_name').value.trim();
            const cLogo = document.getElementById('custom_logo').value.trim();
            const formatString = document.getElementById('custom_format_string').value.trim();
            
            let proxyParams = \`?name=\${encodeURIComponent(cName)}\`;
            if(cLogo) proxyParams += \`&logo=\${encodeURIComponent(cLogo)}\`;

            // Adiciona a string de formatação customizada se existir
            if (formatString) {
                try {
                    // O StremThru espera que a string seja um JSON válido de formatação
                    const encodedFormat = encodeURIComponent(formatString);
                    proxyParams += \`&format=\${encodedFormat}\`;
                } catch(e) {
                    alert("A string de formatação customizada é inválida. Use JSON válido.");
                    return;
                }
            }


            const myMirrorUrl = window.location.origin + "/addon/manifest.json" + proxyParams + "&t=" + Date.now();

            let config = { upstreams: [], stores: [] };
            config.upstreams.push({ u: myMirrorUrl });

            if (document.getElementById('use_rd').checked) {
                config.stores.push({ c: "rd", t: document.getElementById('rd_key').value.trim() });
            }
            if (document.getElementById('use_tb').checked) {
                config.stores.push({ c: "tb", t: document.getElementById('tb_key').value.trim() });
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

app.get('/', (req, res) => res.send(generatorHtml));
app.get('/configure', (req, res) => res.send(generatorHtml));

// Rota do Manifesto (Proxy)
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

// Rotas de Redirecionamento (Streams/Catálogos)
app.get('/addon/stream/:type/:id.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const upstreamUrl = `${UPSTREAM_BASE}${req.path}`;
        const response = await axios.get(upstreamUrl);
        let streams = response.data.streams || [];

        // Retorna os streams originais para o StremThru fazer o parsing
        return res.json({ streams: streams });

    } catch (error) {
        console.error("Stream Fetch Error:", error.message);
        res.status(404).json({ streams: [] }); 
    }
});

// Redireciona todos os outros recursos (catálogos, meta, etc.)
app.get('/addon/*', (req, res) => {
    const originalPath = req.url.replace('/addon', '');
    const upstreamUrl = `${UPSTREAM_BASE}${originalPath}`;
    res.redirect(307, upstreamUrl);
});


// Exporta a aplicação para o Vercel Serverless
const PORT = process.env.PORT || 7000;
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Gerador rodando na porta ${PORT}`);
    });
}
