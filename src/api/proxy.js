// api/proxy.js  ← esse arquivo roda no SERVIDOR da Vercel, não no navegador
export default async function handler(req, res) {
  const { path } = req.query;
  const targetUrl = `${process.env.API_URL}/${Array.isArray(path) ? path.join("/") : path}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "X-Embarcadero-App-Secret": process.env.EMS_APP_SECRET, 
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao conectar com o servidor" });
  }
}