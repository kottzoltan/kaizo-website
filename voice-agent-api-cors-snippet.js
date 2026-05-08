/**
 * Használd azon az Express szerón, amely kiadja /think, /speak, /robots és /health.
 * Ez csak böngészős CORS; adj hozzá a saját alkalmazásod előtt.
 */
module.exports = function voiceAgentApiCors(originsAllowed) {
  const set = new Set(originsAllowed);
  return (req, res, next) => {
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

// példa:
// const corsKaizo = require('./voice-agent-api-cors-snippet');
// app.use(corsKaizo(['https://kaizo.hu','https://www.kaizo.hu','http://127.0.0.1:5500','http://localhost:5500']));
