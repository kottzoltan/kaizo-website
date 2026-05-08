/**
 * Kaizo hangos ügynök demó: külső HTTP API nélkül.
 * Adatok és „válaszok” helyben vannak; STT: Web Speech API; TTS: speechSynthesis.
 */
(() => {
  const ABS_MAX_LISTEN_MS = 38000;
  const SILENCE_AFTER_WORD_MS = 1800;
  const MAX_SILENT_TURNS = 6;

  /** Ugyanaz a szerepkör-kulcs mint korábban a szerveren — itt csak helyi választógéphez kell. */
  const LOCAL_AGENTS = [
    {
      key: 'outbound_sales',
      titles: { hu: 'Sales ügynök', en: 'Sales agent' },
      intros: {
        hu:
          'Szia, Mihály vagyok — a Kaizo sales demó ügynök. Segítek egy rövid szinten tisztázni, mire lenne időpont, és elmondom a következő lépést. Ez statikus demó: nem hívunk háttér-szolgáltatást, mikrofon és gépelés is megy.',
        en:
          'Hi, I am Mihály — Kaizo sales demo agent. I can sketch what a call would cover and the next step. This is a static demo with no backend.',
      },
      hint: { hu: 'időpont, demo, kapcsolat', en: 'appointment, demo, contact' },
    },
    {
      key: 'email_sales',
      titles: { hu: 'Ügyfélszolgálat', en: 'Customer support' },
      intros: {
        hu:
          'Ricsi vagyok — időpont- és ügyfélszolgálati demó. Írd vagy mondd el, miben segíthetek; lokális példaválaszokat adok, hogy lásd a Kaizo folyamatot.',
        en:
          'I am Ricsi — scheduling and support demo. Ask in text or voice; I answer with local scripted responses.',
      },
      hint: { hu: 'időpont, ügyfél, üzenet', en: 'appointment, client, message' },
    },
    {
      key: 'support_inbound',
      titles: { hu: 'Bejövő ügyfélszolgálat', en: 'Inbound support' },
      intros: {
        hu:
          'Ari vagyok — bejövő támogatási demó. Mondd el röviden a problémát; demó módban iránymutatást kapsz, élő rendszer nélkül.',
        en:
          'I am Ari — inbound support demo. Briefly describe your issue; you get guidance text only, no live ticket system.',
      },
      hint: { hu: 'hiba, bejelentés, jegy', en: 'error, issue, ticket' },
    },
    {
      key: 'customer_satisfaction',
      titles: { hu: 'Elégedettségmérés', en: 'Satisfaction survey' },
      intros: {
        hu:
          'Adél vagyok — elégedettségi demó. Tudok rögzíteni példa visszajelzést (szövegből), és összegzem, mit mérnél élőben.',
        en:
          'I am Adél — satisfaction demo. I capture example feedback and summarise what you would measure live.',
      },
      hint: { hu: 'elégedett, értékelés, javaslat', en: 'rating, feedback, suggestion' },
    },
  ];

  const el = (id) => document.getElementById(id);

  let chatEl,
    statusEl,
    loopEl,
    dotEl,
    activeNameEl,
    activeKeyEl,
    inputEl;

  let activeRobotKey = null;
  let activeRobotTitle = null;
  let running = false;
  let busy = false;
  let history = [];
  let silentTurns = 0;
  let replyTurn = 0;

  function english() {
    return document.documentElement.lang === 'en';
  }

  function t(code) {
    const en = english();
    const M = {
      pickRobot: en ? 'Pick an agent card first.' : 'Válassz előbb egy ügynököt.',
      ttsFail: en ? 'Speech output failed (browser TTS).' : 'A böngésző felolvasása nem indult el.',
      stopSilent: en
        ? 'No speech detected — stopping. Tap an agent card again to continue.'
        : 'Nincs beszédbejegyzés — leállok. Nyomj új ügynök kártyát a folytatáshoz.',
      errMeta: en ? 'Note' : 'Megjegyzés',
      agentMeta: en ? 'Agents' : 'Ügynökök',
      youMeta: en ? 'You' : 'Te',
      interruptMeta: en ? 'You (interrupted)' : 'Te (megszólaltál)',
      demoNote: en
        ? 'This is offline copy: no cloud API. Replies are scripted heuristics.'
        : 'Ez offline demó: nincs felhő API, a válaszok helyi, mintapéldák.',
    };
    return M[code] || code;
  }

  function agentByKey(key) {
    return LOCAL_AGENTS.find((a) => a.key === key) || null;
  }

  function setStatus(kind, text) {
    if (!statusEl || !dotEl) return;
    statusEl.textContent = text;
    dotEl.classList.toggle('err', kind === 'err');
  }

  function setLoopState(state) {
    if (loopEl) loopEl.textContent = state;
  }

  function addMsg(who, body, meta) {
    if (!chatEl) return;
    const row = document.createElement('div');
    row.className = 'kaizo-agent-msg kaizo-agent-msg--' + (who === 'me' ? 'me' : 'ai');
    row.innerHTML = `<div class="kaizo-agent-msgmeta">${escapeHtml(meta)}</div>${escapeHtml(body)}`;
    chatEl.appendChild(row);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function escapeHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function pickVoice(langCode) {
    const list = speechSynthesis.getVoices?.() || [];
    const want = langCode === 'en' ? 'en' : 'hu';
    return list.find((v) => (v.lang || '').toLowerCase().startsWith(want)) || list[0] || null;
  }

  /** @param {{ allowBargeIn?: boolean }} [opts] — barge-in nincs böngészős TTS-hez kötve */
  function speakBrowser(text, opts) {
    const allowIn = opts?.allowBargeIn === true;
    void allowIn;
    setLoopState('SPEAKING');
    speechSynthesis.cancel();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = english() ? 'en-US' : 'hu-HU';

      const attachVoice = () => {
        const voice = pickVoice(english() ? 'en' : 'hu');
        if (voice) u.voice = voice;
      };
      attachVoice();
      if (!(speechSynthesis.getVoices?.() || []).length) {
        speechSynthesis.addEventListener('voiceschanged', attachVoice, { once: true });
      }

      u.onend = () => resolve({ interrupted: false });
      u.onerror = () => resolve({ interrupted: false });
      try {
        speechSynthesis.speak(u);
      } catch (e) {
        resolve({ interrupted: false });
      }
    });
  }

  function haltSpeech() {
    try {
      speechSynthesis.cancel();
    } catch (e) {}
  }

  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recObj = null;
  let recLock = false;

  async function listenOnce() {
    if (recLock) return '';
    if (!Rec) throw new Error(english() ? 'Use Chrome for speech input.' : 'Beszédfelismeréshez Chrome ajánlott.');
    for (let k = 0; k < 5 && running; k++) {
      const line = await listenSegment();
      if (!running) return '';
      if (line.trim()) return line.trim();
      await new Promise((r) => setTimeout(r, 350));
    }
    return '';
  }

  function listenSegment() {
    if (recLock) return Promise.resolve('');
    if (recObj) {
      try {
        recObj.abort();
      } catch (e) {}
      recObj = null;
    }

    const r = new Rec();
    r.lang = 'hu-HU';
    r.interimResults = true;
    r.continuous = true;
    r.maxAlternatives = 1;
    recObj = r;
    recLock = true;
    setLoopState('LISTENING');

    return new Promise((resolve, reject) => {
      let done = false;
      let finals = '';
      let interim = '';
      let silenceT = null;
      const wipeSilence = () => {
        if (silenceT) {
          clearTimeout(silenceT);
          silenceT = null;
        }
      };

      const textOut = () => (finals + interim).trim();

      const finalize = (out, error) => {
        if (done) return;
        done = true;
        wipeSilence();
        clearTimeout(hardStop);
        try {
          r.abort();
        } catch (e) {}
        recObj = null;
        recLock = false;
        if (error) reject(error);
        else resolve((out || '').trim());
      };

      const armSilence = () => {
        wipeSilence();
        silenceT = setTimeout(() => finalize(textOut()), SILENCE_AFTER_WORD_MS);
      };

      const hardStop = setTimeout(() => finalize(textOut()), ABS_MAX_LISTEN_MS);

      r.onresult = (ev) => {
        let f = '';
        let i = '';
        for (let j = 0; j < ev.results.length; j++) {
          const row = ev.results[j];
          if (row.isFinal) f += row[0].transcript;
          else i += row[0].transcript;
        }
        finals = f;
        interim = i;
        if (textOut()) armSilence();
      };

      r.onerror = (ev) => {
        const c = ev.error || '?';
        if (c === 'aborted' || c === 'no-speech') {
          finalize(textOut());
          return;
        }
        finalize('', new Error('STT: ' + c));
      };

      r.onend = () => {
        if (done) return;
        finalize(textOut());
      };

      try {
        r.start();
      } catch (err) {
        finalize('', err);
      }
    });
  }

  function localThink(userLine, key) {
    const en = english();
    replyTurn++;
    const a = agentByKey(key);
    const line = (userLine || '').toLowerCase();
    const fallback = [
      () =>
        en
          ? `Understood («${escapeHtmlThink(userLine)}»). Tip: keywords for this persona — ${a?.hint?.en || 'appointment, feedback'}. ${t('demoNote')}`
          : `Értettem („${escapeHtmlThink(userLine)}”). Tipp ennél az ügynöknél: ${a?.hint?.hu || 'időpont, visszajelzés'}. ${t('demoNote')}`,
      () =>
        en
          ? 'Recorded. In production this would branch to workflows, calendars, ERP and CRM integrations.'
          : 'Rögzítve. Éles rendszerben innen vezérlődnének a naptár, CRM és ERP lépések.',
      () =>
        en
          ? 'Thanks — that input would feed the next automation step in Kaizo.'
          : 'Köszönöm — ez a bemenet a Kaizo következő automatizált lépéséhez csatlakozna.',
    ];
    const pick = fallback[(replyTurn + (userLine?.length || 0)) % fallback.length];

    const greet = /\b(szia|szevasz|helló|hello|jó napot|jó reggelt|hey)\b/i.test(userLine);
    const thanks = /\b(köszön|thanks|thank you|thx)\b/i.test(userLine);

    if (en) {
      if (greet) return `Hi! ${a?.intros?.en?.split('.')[0] || 'How can I help?'}`;
      if (thanks) return 'You are welcome. Anything else I should note for the demo?';
      if (key === 'outbound_sales' && /\b(appointment|slot|call|demo|meeting|price|cost)\b/i.test(line)) {
        return 'For a real rollout we would book a slot in your calendar stack and send a confirmation. Here: pick a time window and I will echo it as a demo record.';
      }
      if (key === 'email_sales' && /\b(book|schedule|slot|complaint|email)\b/i.test(line)) {
        return 'Scheduling path: we capture channel, topic, and preferred time; then push to your queue. Say a date or “next week morning”.';
      }
      if (key === 'support_inbound' && /\b(error|bug|broken|down|ticket|issue)\b/i.test(line)) {
        return 'Triage step: severity, product area, and whether it blocks work. I would open a ticket ID and suggest the first fix article.';
      }
      if (key === 'customer_satisfaction' && /\b(score|rate|scale|satisfied|recommend|nps)\b/i.test(line)) {
        return 'Survey flow: one main score plus one free-text reason. I will store your last message as example feedback for reporting.';
      }
      return pick();
    }

    if (greet) return `Szia! ${a?.intros?.hu?.split('.')[0] || 'Miben segíthetek?'}`;
    if (thanks) return 'Szívesen. Van még valami, amit jegyezzek a demóhoz?';
    if (key === 'outbound_sales' && /\b(időpont|demo|hívás|ár|árak|kapcsolat|árajánlat)\b/.test(line)) {
      return 'Élesben naptáradhoz kötnénk a szabad idősávot és visszaigazolást küldenénk. Demóban: mondj egy időablakot, és azt visszhangként rögzítem.';
    }
    if (key === 'email_sales' && /\b(időpont|foglal|ügyfél|panasz|email|üzenet)\b/.test(line)) {
      return 'Foglalási lépések: csatorna, téma, preferált idő — majd sorba tesszük. Mondd például: „jövő hét kedd délután”.';
    }
    if (key === 'support_inbound' && /\b(hiba|nem működik|leállt|jegy|ticket|probléma)\b/.test(line)) {
      return 'Első szűrés: súlyosság, termékterület, blokkol-e a munkát. Innen nyílna a jegy és a javasolt első lépés.';
    }
    if (key === 'customer_satisfaction' && /\b(eléged|értékel|pont|skála|nps|javaslat)\b/.test(line)) {
      return 'Mérési folyamat: egy fő pontszám + szabad szöveges indoklás. Az utolsó üzenetedet demó jelleggel visszajelzésként kezelem.';
    }
    return pick();
  }

  function escapeHtmlThink(s) {
    const x = (s || '').slice(0, 200);
    return x.replace(/</g, '');
  }

  async function thinkLine(text) {
    setLoopState('THINK');
    await new Promise((r) => setTimeout(r, 120));
    return localThink(text, activeRobotKey);
  }

  async function handleLine(userText, meta) {
    addMsg('me', userText, meta);
    history.push({ role: 'user', content: userText });
    const reply = await thinkLine(userText);
    if (!running) return {};
    addMsg('ai', reply, activeRobotTitle || 'Kaizo');
    history.push({ role: 'assistant', content: reply });
    return speakBrowser(reply, {});
  }

  async function mainLoop(seed) {
    if (!running || busy) return;
    busy = true;
    try {
      let cur = (seed || '').trim();
      while (running) {
        if (!cur) {
          cur = await listenOnce();
          if (!running) {
            busy = false;
            return;
          }
          if (!cur) {
            silentTurns += 1;
            if (silentTurns >= MAX_SILENT_TURNS) {
              addMsg('ai', t('stopSilent'), t('agentMeta'));
              halt();
              return;
            }
            busy = false;
            setTimeout(mainLoop, 200);
            return;
          }
        }

        silentTurns = 0;
        const meta = cur === seed && seed ? t('interruptMeta') : t('youMeta');
        await handleLine(cur, meta);
        if (!running) {
          busy = false;
          return;
        }
        break;
      }

      busy = false;
      setTimeout(mainLoop, 150);
    } catch (err) {
      console.error(err);
      setStatus('err', 'ERROR');
      setLoopState('ERROR');
      addMsg('ai', (err && err.message) ? err.message : String(err), t('errMeta'));
      busy = false;
      running = false;
    }
  }

  async function startAgent(key) {
    const def = agentByKey(key);
    if (!def) return;
    document.querySelectorAll('.kaizo-agent-picker .kaizo-agent-card').forEach((c) =>
      c.classList.toggle('is-active', c.getAttribute('data-robot') === key),
    );
    activeRobotKey = key;
    activeRobotTitle = english() ? def.titles.en : def.titles.hu;
    if (activeNameEl) activeNameEl.textContent = activeRobotTitle;
    if (activeKeyEl) activeKeyEl.textContent = '(' + key + ')';

    setStatus('ok', 'RUN');
    running = true;
    busy = false;
    silentTurns = 0;
    replyTurn = 0;

    const intro = english() ? def.intros.en : def.intros.hu;
    addMsg('ai', intro, activeRobotTitle);
    history = [{ role: 'assistant', content: intro }];
    try {
      await speakBrowser(intro, {});
    } catch (err) {
      console.error(err);
      addMsg('ai', t('ttsFail'), t('errMeta'));
      running = false;
      setStatus('err', 'ERROR');
      setLoopState('ERROR');
      return;
    }
    busy = false;
    mainLoop();
  }

  async function sendTyped() {
    if (!inputEl) return;
    const v = inputEl.value.trim();
    if (!v) return;
    inputEl.value = '';
    if (!activeRobotKey) {
      addMsg('ai', t('pickRobot'), t('agentMeta'));
      return;
    }
    addMsg('me', v, t('youMeta'));
    history.push({ role: 'user', content: v });
    try {
      const answer = await thinkLine(v);
      addMsg('ai', answer, activeRobotTitle || 'Kaizo');
      history.push({ role: 'assistant', content: answer });
      await speakBrowser(answer, {});
    } catch (err) {
      addMsg('ai', err.message || String(err), t('errMeta'));
    }
  }

  function halt() {
    running = false;
    busy = false;
    haltSpeech();
    silentTurns = 0;
    setLoopState('IDLE');
    setStatus('ok', 'IDLE');
    try {
      if (recObj) recObj.abort();
    } catch (e) {}
    recObj = null;
    recLock = false;
  }

  function bind() {
    chatEl = el('kaizo-agent-chat');
    statusEl = el('kaizo-agent-status');
    loopEl = el('kaizo-agent-loop');
    dotEl = el('kaizo-agent-dot');
    activeNameEl = el('kaizo-agent-active');
    activeKeyEl = el('kaizo-agent-key');
    inputEl = el('kaizo-agent-input');

    document.querySelector('.kaizo-agent-picker')?.addEventListener('click', (e) => {
      const card = e.target.closest('.kaizo-agent-card');
      if (!card) return;
      const key = card.getAttribute('data-robot');
      if (!key) return;
      halt();
      void startAgent(key);
    });

    el('kaizo-agent-send')?.addEventListener('click', sendTyped);
    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendTyped();
    });
    el('kaizo-agent-halt')?.addEventListener('click', halt);

    if (speechSynthesis.getVoices?.().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {}, { once: true });
    }

    setStatus('ok', 'IDLE');
    setLoopState('IDLE');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
