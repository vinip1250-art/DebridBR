const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// ============================================================
// CONFIGURAÇÕES
// ============================================================
const UPSTREAM = "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";
const NEW_NAME = "Brazuca"; // O nome curto que você quer
const NEW_LOGO = "https://i.imgur.com/Q61eP9V.png";
const NEW_ID = "community.brazuca.wrapper.final";

// ============================================================
// 1. PROXY DE MANIFESTO (Para limpar o nome)
// ============================================================
app.get('/proxy/manifest.json', async (req, res) => {
    // Headers essenciais para o StremThru aceitar a resposta
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    try {
        const { data } = await axios.get(`${UPSTREAM}/manifest.json`);
        
        // Sobrescreve apenas o necessário
        data.id = NEW_ID;
        data.name = NEW_NAME;
        data.description = "Filmes e Séries Brasileiros";
        data.logo = NEW_LOGO;
        
        // Remove backgrounds para deixar mais leve
        delete data.background;
        
        res.json(data);
    } catch (error) {
        console.error("Erro Proxy:", error.message);
        res.status(500).json({ error: "Failed to fetch upstream manifest" });
    }
});

// ============================================================
// 2. PROXY DE RECURSOS (Redireciona streams/catalogos)
// ============================================================
// O StremThru vai bater aqui para pedir a lista de filmes.
// Nós redirecionamos para o Brazuca original.
app.get('/proxy/:resource/:type/:id/:extra?.json', (req, res) => {
    const { resource, type, id, extra } = req.params;
    let url = `${UPSTREAM}/${resource}/${type}/${id}`;
    if (extra) url += `/${extra}`;
    url += '.json';
    
    res.redirect(307, url);
});

// ============================================================
// 3. INTERFACE DO GERADOR
// ============================================================
const generatorHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brazuca Wrapper Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background-color: #0b0c10; color: #c5c6c7; font-family: sans-serif; }
        .card { background-color: #1f2833; border: 1px solid #45a29e; }
        .input-dark { background-color: #0b0c10; border: 1px solid #45a29e; color: #fff; }
        .input-dark:focus { outline: 2px solid #66fcf1; }
        .btn-action { background: linear-gradient(90deg, #45a29e 0%, #66fcf1 100%); color: #000; font-weight: bold; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 bg-black">

    <div class="w-full max-w-lg card rounded-2xl p-8 border border-gray-800">
        
        <div class="text-center mb-8">
            <img src="${NEW_LOGO}" class="w-12 h-12 mx-auto mb-3 rounded-full">
            <h1 class="text-2xl font-bold text-white">Brazuca Wrapper</h1>
            <p class="text-xs text-gray-400">Gerador StremThru (Nome Curto)</p>
        </div>

        <form class="space-y-6">
            
            <!-- Instância -->
            <div>
                <label class="text-xs font-bold uppercase text-gray-500">1. Instância</label>
                <select id="instance" class="w-full input-dark p-3 rounded text-sm mt-1">
                    <option value="https://stremthru.elfhosted.com">ElfHosted (Recomendado)</option>
                    <option value="https://stremthrufortheweebs.midnightignite.me">Midnight Ignite</option>
                    <option value="https://api.stremthru.xyz">Oficial</option>
                </select>
            </div>

            <!-- Tokens -->
            <div class="space-y-3">
                <label class="text-xs font-bold uppercase text-gray-500">2. Tokens StremThru Store</label>
                
                <div class="flex items-center gap-2 bg-[#111] p-2 rounded border border-gray-700">
                    <input type="checkbox" id="use_rd" class="w-4 h-4 accent-blue-500" onchange="validate()">
                    <input type="text" id="rd_key" placeholder="Token Store: rd" class="w-full input-dark p-2 rounded text-xs" disabled>
                </div>
                <div class="text-right text-[10px]"><a href="http://real-debrid.com/?id=6684575" class="text-blue-400 hover:underline">Assinar RD</a></div>

                <div class="flex items-center gap-2 bg-[#111] p-2 rounded border border-gray-700">
                    <input type="checkbox" id="use_tb" class="w-4 h-4 accent-purple-500" onchange="validate()">
                    <input type="text" id="tb_key" placeholder="Token Store: tb" class="w-full input-dark p-2 rounded text-xs" disabled>
                </div>
                <div class="text-right text-[10px]"><a href="https://torbox.app/subscription?referral=b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96" class="text-purple-400 hover:underline">Assinar TB</a></div>
            </div>

            <!-- Botões -->
            <div id="resultArea" class="hidden space-y-3 pt-4 border-t border-gray-700">
                <div class="flex gap-2">
                    <input type="text" id="finalUrl" readonly class="w-full bg-black border border-gray-600 text-gray-300 text-[10px] p-2 rounded">
                    <button type="button" onclick="copyLink()" class="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded text-xs font-bold">COPY</button>
                </div>
                <a id="installBtn" href="#" class="block w-full btn-action py-3 rounded text-center font-bold text-sm uppercase">INSTALAR</a>
            </div>

            <button type="button" onclick="generate()" id="btnGenerate" class="w-full bg-gray-700 text-gray-500 py-3 rounded text-sm font-bold cursor-not-allowed" disabled>GERAR LINK</button>

        </form>
    </div>

    <script>
        const instanceSelect = document.getElementById('instance');
        
        function validate() {
            const rd = document.getElementById('use_rd').checked;
            const tb = document.getElementById('use_tb').checked;
            const rdKey = document.getElementById('rd_key');
            const tbKey = document.getElementById('tb_key');
            const btn = document.getElementById('btnGenerate');

            rdKey.disabled = !rd;
            tbKey.disabled = !tb;
            
            if(!rd) rdKey.value = '';
            if(!tb) tbKey.value = '';

            // Visual disable
            rdKey.parentElement.style.opacity = rd ? '1' : '0.5';
            tbKey.parentElement.style.opacity = tb ? '1' : '0.5';

            if ((rd && rdKey.value.trim()) || (tb && tbKey.value.trim())) {
                btn.classList.remove('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
                btn.classList.add('btn-action');
                btn.disabled = false;
            } else {
                btn.classList.add('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
                btn.classList.remove('btn-action');
                btn.disabled = true;
            }
        }

        document.getElementById('rd_key').addEventListener('input', validate);
        document.getElementById('tb_key').addEventListener('input', validate);

        function generate() {
            const host = instanceSelect.value.replace(/\\/$/, '');
            
            // URL do nosso Proxy Local (para limpar o nome)
            // Adicionamos /proxy/manifest.json
            const myProxyUrl = window.location.origin + "/proxy/manifest.json";

            let config = { upstreams: [], stores: [] };

            if (document.getElementById('use_rd').checked) {
                config.upstreams.push({ u: myProxyUrl });
                config.stores.push({ c: "rd", t: document.getElementById('rd_key').value.trim() });
            }
            if (document.getElementById('use_tb').checked) {
                config.upstreams.push({ u: myProxyUrl });
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


