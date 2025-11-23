import fetch from "node-fetch";

const TORBOX_API = "https://api.torbox.app"; // ou endpoint equivalente
const TOKEN = process.env.TORBOX_TOKEN;

export async function resolveWithTorbox(magnet: string): Promise<string | null> {
  const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

  // 1. Adicionar torrent
  const addResp = await fetch(`${TORBOX_API}/torrents`, {
    method: "POST",
    headers,
    body: JSON.stringify({ magnet })
  });

  if (!addResp.ok) return null;
  const { id } = await addResp.json();

  // 2. Verificar status
  const infoResp = await fetch(`${TORBOX_API}/torrents/${id}`, { headers });
  if (!infoResp.ok) return null;
  const info = await infoResp.json();

  const readyFile = info.files?.find(f => f.status === "ready");
  return readyFile?.streamUrl || null;
}
