const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

// ============================================================
// CONFIGURAÇÕES DO ESPELHO
// ============================================================
const UPSTREAM_BASE = "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";
const NEW_NAME = "Brazuca"; 
const NEW_ID = "community.brazuca.wrapper.final.v2"; // ID Novo
const NEW_LOGO = "https://i.imgur.com/Q61eP9V.png";

// ============================================================
// ROTA 1: MANIFESTO EDITADO (Renomeia o Addon)
// ============================================================
app.get('/addon/manifest.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
        // Baixa o manifesto original
        const response = await axios.get(`${UPSTREAM_BASE}/manifest.json`);
        const manifest = response.data;

        // Reescreve metadados para o StremThru ler
        manifest.id = NEW_ID;
        manifest.name = NEW_NAME;
        manifest.description = "Filmes e Séries Brasileiros";
        manifest.logo = NEW_LOGO;
        // Limpa background para leveza
        delete manifest.background; 
        
        res.json(manifest);
    } catch (error) {
        console.error("Erro upstream:", error.message);
        res.status(500).json({ error: "Erro no manifesto original" });
    }
});

// ============================================================
// ROTA 2: REDIRECIONADOR DE RECURSOS
// ============================================================
// Redireciona os pedidos do StremThru para o Brazuca Original
app.use('/addon', (req, res) => {
    const redirectUrl = `${UPSTREAM_BASE}${req.path}`;
    res.redirect(307, redirectUrl);
});

// ============================================================
// 3. PÁGINA GERADORA (INTERFACE)
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
    <style>
        body { background-color: #050505; color: #e2e8f0; font-family: sans-serif; }
        .card { background-color: #111; border: 1px solid #333; }
        .input-dark { background-color: #000; border: 1px solid #333; color: white; }
        .input-dark:focus { border-color: #3b82f6; outline: none; }
        .btn-action { background: linear-gradient(to right, #2563eb, #3b82f6); color: white; }
        .btn-action:hover { filter: brightness(1.1); }
        
        /* Botões de Referência */
        .btn-ref-rd { background-color: #1e3a8a; color: #93c5fd; font-size: 0.75rem; padding: 6px 12px; border-radius: 6px; display: inline-block; text-decoration: none; transition: 0.2s; border: 1px solid #2563eb; }
        .btn-ref-rd:hover { background-color: #2563eb; color: white; }
        
        .btn-ref-tb { background-color: #581c87; color: #d8b4fe; font-size: 0.75rem; padding: 6px 12px; border-radius: 6px; display: inline-block; text-decoration: none; transition: 0.2s; border: 1px solid #9333ea; }
        .btn-ref-tb:hover { background-color: #7e22ce; color: white; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">

    <div class="w-full max-w-lg card rounded-2xl shadow-2xl p-6 border border-gray-800 relative">
        
        <div class="text-center mb-6">
            <img src="${NEW_LOGO}" class="w-12 h-12 mx-auto mb-2 rounded-full border border-gray-700">
            <h1 class="text-xl font-bold text-white">Brazuca Wrapper</h1>
            <p class="text-gray-500 text-xs">Gerador StremThru • Nome Curto</p>
        </div>

        <form class="space-y-5">
            
            <!-- Instância -->
            <div>
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">1. Instância StremThru</label>
                <select id="instance" class="w-full input-dark p-3 rounded-lg text-sm mt-1 cursor-pointer">
                    <option value="https://stremthru.elfhosted.com">ElfHosted (Estável)</option>
                    <option value="https://stremthrufortheweebs.midnightignite.me">Midnight Ignite</option>
                    <option value="custom">Outra...</option>
                </select>
                <input type="text" id="custom_instance" placeholder="https://..." class="hidden w-full input-dark p-3 rounded-lg text-sm mt-2">
            </div>

            <!-- Debrids -->
            <div class="space-y-4">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">2. Tokens (Store StremThru)</label>
                
                <!-- Real Debrid -->
                <div class="bg-[#1a1a1a] p-3 rounded border border-gray-800">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="use_rd" class="accent-blue-600 w-4 h-4" onchange="validate()">
                            <span class="text-sm font-bold text-gray-300">Real-Debrid</span>
                        </div>
                        <a href="http://real-debrid.com/?id=6684575" target="_blank" class="btn-ref-rd">
                            <i class="fas fa-external-link-alt mr-1"></i> Assinar
                        </a>
                    </div>
                    <input type="text" id="rd_key" placeholder="Token da Store 'rd'" class="w-full input-dark p-2 rounded text-xs bg-transparent border-gray-700 focus:border-blue-500 focus:bg-black transition-colors" disabled>
                </div>

                <!-- TorBox -->
                <div class="bg-[#1a1a1a] p-3 rounded border border-gray-800">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <input type="checkbox" id="use_tb" class="accent-purple-600 w-4 h-4" onchange="validate()">
                            <span class="text-sm font-bold text-gray-300">TorBox</span>
                        </div>
                        <a href="https://torbox.app/subscription?referral=b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96" target="_blank" class="btn-ref-tb">
                            <i class="fas fa-external-link-alt mr-1"></i> Assinar
                        </a>
                    </div>
                    <input type="text" id="tb_key" placeholder="Token da Store 'tb'" class="w-full input-dark p-2 rounded text-xs bg-transparent border-gray-700 focus:border-purple-500 focus:bg-black transition-colors" disabled>
                </div>
            </div>

            <!-- Resultado -->
            <div id="resultArea" class="hidden pt-4 border-t border-gray-800 space-y-3">
                <div class="relative">
                    <input type="text" id="finalUrl" readonly class="w-full bg-gray-900 border border-blue-900 text-blue-400 text-[10px] p-3 rounded pr-12 font-mono outline-none">
                    <button type="button" onclick="copyLink()" class="absolute right-1 top-1 bottom-1 bg-blue-900 hover:bg-blue-800 text-white px-3 rounded text-xs font-bold transition">
                        COPY
                    </button>
                </div>
                <a id="installBtn" href="#" class="block w-full btn-action py-3 rounded-lg text-center font-bold text-sm uppercase tracking-wide shadow-lg shadow-blue-900/20 transition transform hover:scale-[1.02]">
                    INSTALAR NO STREMIO
                </a>
            </div>

            <button type="button" onclick="generate()" id="btnGenerate" class="w-full bg-gray-800 text-gray-500 py-3 rounded-lg text-sm font-bold cursor-not-allowed transition" disabled>
                GERAR LINK
            </button>

        </form>
    </div>

    <script>
        const instanceSelect = document.getElementById('instance');
        const customInput = document.getElementById('custom_instance');

        instanceSelect.addEventListener('change', (e) => {
            if(e.target.value === 'custom') customInput.classList.remove('hidden');
            else customInput.classList.add('hidden');
        });

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

            const isValid = (rd && rdInput.value.trim()) || (tb && tbInput.value.trim());

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
            let host = instanceSelect.value === 'custom' ? customInput.value.trim() : instanceSelect.value;
            host = host.replace(/\\/$/, '').replace('http:', 'https:');

            // --- PULO DO GATO ---
            // Aponta para o NOSSO espelho (/addon/manifest.json)
            // Assim o StremThru lê o nome curto "Brazuca"
            const myMirrorUrl = window.location.origin + "/addon/manifest.json?t=" + Date.now();

            let config = { upstreams: [], stores: [] };

            // Adiciona o Proxy do Brazuca como fonte
            config.upstreams.push({ u: myMirrorUrl });

            // Configura Real-Debrid
            if (document.getElementById('use_rd').checked) {
                config.stores.push({ c: "rd", t: document.getElementById('rd_key').value.trim() });
            }
            
            // Configura TorBox
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
            btn.innerText = "OK!";
            setTimeout(() => btn.innerText = "COPY", 1500);
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(generatorHtml));

app.get('*', (req, res) => {
    if (req.path.startsWith('/addon')) return res.status(404).send('Not Found');
    res.redirect('/');
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Gerador rodando na porta ${PORT}`);
});


