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
const NEW_ID = "community.brazuca.proxy.v6"; // ID Novo para forçar atualização
const NEW_LOGO = "https://i.imgur.com/Q61eP9V.png";

// ============================================================
// ROTA 1: MANIFESTO EDITADO (Renomeia o Addon)
// ============================================================
app.get('/addon/manifest.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    // Cabeçalhos agressivos para evitar cache antigo
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
        const response = await axios.get(`${UPSTREAM_BASE}/manifest.json`);
        const manifest = response.data;

        // Reescreve metadados
        manifest.id = NEW_ID;
        manifest.name = NEW_NAME;
        manifest.description = "Brazuca via StremThru";
        manifest.logo = NEW_LOGO;
        manifest.version = "3.1.0"; 
        
        res.json(manifest);
    } catch (error) {
        console.error("Erro upstream:", error.message);
        res.status(500).json({ error: "Erro no manifesto original" });
    }
});

// ============================================================
// ROTA 2: REDIRECIONADOR DE RECURSOS
// ============================================================
app.use('/addon', (req, res) => {
    const redirectUrl = `${UPSTREAM_BASE}${req.path}`;
    res.redirect(307, redirectUrl);
});

// ============================================================
// ROTA 3: PÁGINA GERADORA
// ============================================================
const generatorHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brazuca Pro Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #050505; color: #e2e8f0; font-family: sans-serif; }
        .card { background-color: #111; border: 1px solid #333; }
        .input-dark { background-color: #000; border: 1px solid #333; color: white; }
        .input-dark:focus { border-color: #3b82f6; outline: none; }
        .btn-action { background: linear-gradient(to right, #2563eb, #3b82f6); color: white; }
        .btn-action:hover { filter: brightness(1.1); }
        a.link-ref { color: #60a5fa; text-decoration: none; font-size: 0.75rem; margin-top: 6px; display: inline-block; }
        a.link-ref:hover { text-decoration: underline; color: #93c5fd; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">

    <div class="w-full max-w-lg card rounded-2xl shadow-2xl p-6 border border-gray-800 relative">
        
        <div class="text-center mb-6">
            <img src="${NEW_LOGO}" class="w-12 h-12 mx-auto mb-2 rounded-full border border-gray-700">
            <h1 class="text-xl font-bold text-white">Brazuca Wrapper</h1>
            <p class="text-gray-500 text-xs">Gerador StremThru Customizado v3.1</p>
        </div>

        <form class="space-y-5">
            
            <!-- Instância -->
            <div>
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">Instância StremThru</label>
                <select id="instance" class="w-full input-dark p-3 rounded-lg text-sm mt-1 cursor-pointer">
                    <option value="https://stremthru.elfhosted.com">ElfHosted</option>
                    <option value="https://stremthrufortheweebs.midnightignite.me">Midnight Ignite</option>
                    <option value="https://api.stremthru.xyz">StremThru Oficial</option>
                    <option value="custom">Outra...</option>
                </select>
                <input type="text" id="custom_instance" placeholder="https://..." class="hidden w-full input-dark p-3 rounded-lg text-sm mt-2">
            </div>

            <!-- Debrids -->
            <div class="space-y-4">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">Serviços (Tokens StremThru)</label>
                
                <!-- Real Debrid -->
                <div class="bg-[#1a1a1a] p-3 rounded border border-gray-800">
                    <div class="flex items-center gap-2 mb-1">
                        <input type="checkbox" id="use_rd" class="accent-blue-600 w-4 h-4" onchange="validate()">
                        <span class="text-sm font-bold text-gray-300">Real-Debrid</span>
                    </div>
                    <input type="text" id="rd_key" placeholder="Cole o Token da Store 'rd'" class="w-full input-dark p-2 rounded text-xs bg-transparent border border-gray-700 focus:border-blue-500 focus:bg-black transition-colors" disabled>
                    <div class="text-right">
                        <a href="http://real-debrid.com/?id=6684575" target="_blank" class="link-ref">💎 Assinar Real-Debrid</a>
                    </div>
                </div>

                <!-- TorBox -->
                <div class="bg-[#1a1a1a] p-3 rounded border border-gray-800">
                    <div class="flex items-center gap-2 mb-1">
                        <input type="checkbox" id="use_tb" class="accent-purple-600 w-4 h-4" onchange="validate()">
                        <span class="text-sm font-bold text-gray-300">TorBox</span>
                    </div>
                    <input type="text" id="tb_key" placeholder="Cole o Token da Store 'tb'" class="w-full input-dark p-2 rounded text-xs bg-transparent border border-gray-700 focus:border-purple-500 focus:bg-black transition-colors" disabled>
                    <div class="text-right">
                        <a href="https://torbox.app/subscription?referral=b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96" target="_blank" class="link-ref text-purple-400">⚡ Assinar TorBox</a>
                    </div>
                </div>
            </div>

            <!-- Resultado -->
            <div id="resultArea" class="hidden pt-4 border-t border-gray-800 space-y-3">
                <div class="relative">
                    <input type="text" id="finalUrl" readonly class="w-full bg-gray-900 border border-blue-900 text-blue-400 text-[10px] p-3 rounded pr-12 font-mono">
                    <button type="button" onclick="copyLink()" class="absolute right-1 top-1 bottom-1 bg-blue-900 hover:bg-blue-800 text-white px-3 rounded text-xs font-bold transition">
                        COPY
                    </button>
                </div>
                <a id="installBtn" href="#" class="block w-full btn-action py-3 rounded-lg text-center font-bold text-sm uppercase tracking-wide shadow-lg shadow-blue-900/20">
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
            customInput.classList.toggle('hidden', e.target.value !== 'custom');
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

            // Adicionamos um timestamp para quebrar o cache do navegador/stremio
            const cacheBuster = "?t=" + Date.now();
            const myMirrorUrl = window.location.origin + "/addon/manifest.json" + cacheBuster;

            let config = { upstreams: [], stores: [] };

            if (document.getElementById('use_rd').checked) {
                config.upstreams.push({ u: myMirrorUrl });
                config.stores.push({ c: "rd", t: document.getElementById('rd_key').value.trim() });
            }
            if (document.getElementById('use_tb').checked) {
                config.upstreams.push({ u: myMirrorUrl });
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
            const originalText = btn.innerText;
            btn.innerText = "OK!";
            setTimeout(() => btn.innerText = originalText, 1500);
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(generatorHtml));

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Gerador rodando na porta ${PORT}`);
});
