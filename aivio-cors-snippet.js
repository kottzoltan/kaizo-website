/**
 * AIVIO backend — CORS a Kaizo statikus oldal számára
 * ================================================
 * Másold az aivio repo index.js fájljába, közvetlenül az
 *   app.use(express.json({ limit: "2mb" }));
 * sor UTÁN, majd deploy-old újra a Cloud Run-t.
 *
 * Env (opcionális): CORS_ORIGINS="https://kaizo.hu,https://www.kaizo.hu"
 */

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "https://kaizo.hu,https://www.kaizo.hu,http://127.0.0.1:8080,http://localhost:8080")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
