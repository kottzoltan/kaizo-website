/**
 * Illeszd be az Express appba, ami kiszolgálja /think, /speak, /robots, /health.
 * Add hozzá a Kaizo-domain(ek)et és bármilyen preview localhostot.
 */
module.exports = function voiceAgentApiCors(originsAllowed) {
  const set = new Set(originsAllowed);
  return function voiceAgentApiCorsMw(req, res, next) {
    const o = req.headers.origin;
    if (o && set.has(o)) {
      res.setHeader('Access-Control-Allow-Origin', o);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  };
};

/** példa:
 * const corsKaizo = require('./voice-agent-api-cors-snippet');
 * app.use(corsKaizo(['https://kaizo.hu','https://www.kaizo.hu','http://127.0.0.1:5500','http://localhost:5500']));
 */
