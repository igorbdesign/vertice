/* ===== Vértice — Estúdio de Conteúdo ===== */
window.Pages = window.Pages || {};
let ContentTab = 'posts';

const POST_HOOKS = {
  educar: ['Você está cometendo esse erro e nem sabe:', '3 coisas que ninguém te conta sobre {assunto}:', 'Se você trabalha com {assunto}, para tudo e lê isso:', 'O jeito certo de {assunto} (que quase ninguém faz):'],
  vender: ['Seu negócio está perdendo cliente por causa disso:', 'Investir em {assunto} não é gasto, é recuperação de venda:', 'Todo mundo quer mais cliente, mas ninguém arruma isso primeiro:', 'Por que seu concorrente aparece mais que você?'],
  conectar: ['Confessa: isso já aconteceu com você 👇', 'Hoje o post é mais pessoal:', 'Todo designer que começou do zero entende esse:', 'Meu maior aprendizado com {assunto}:'],
  autoridade: ['Anote isso: {assunto} em 4 passos.', 'Depois de {assunto} em vários projetos, aprendi que:', 'O que separa um resultado amador de um profissional em {assunto}:']
};
const POST_BODY = {
  educar: 'Explique o problema em 2–3 linhas simples, mostre o erro comum, e dize por que isso custa cliente/dinheiro. Depois dê o passo a passo prático.',
  vender: 'Mostre a dor que o cliente sente hoje (sem site, sem identidade, sem movimento nas redes), pinte o cenário depois da solução e termine com o convite direto.',
  conectar: 'Conte uma mini história real (antes → virada → hoje). Gente se identifica com processo, não com perfeição.',
  autoridade: 'Dê um framework com passos numerados. Frases curtas. Cada passo = 1 ideia.'
};

Pages.content = function () {
  const tabs = [
    ['posts', '✍️ Gerador de posts'], ['radar', '📰 Radar de notícias'],
    ['reels', '🎬 Roteiros de Reels'], ['carousel', '🎠 Carrosséis'], ['tone', '🪞 Meu tom de voz']
  ];
  return `<div class="tabs">${tabs.map(([id, l]) =>
    `<button class="tab ${ContentTab === id ? 'active' : ''}" data-ctab="${id}">${l}</button>`).join('')}</div>
  <div id="contentPane">${renderContentPane()}</div>`;
};
Pages.content_after = function () {
  document.querySelectorAll('[data-ctab]').forEach(b => b.onclick = () => { ContentTab = b.dataset.ctab; App.render(); });
  afterContentPane();
};

function renderContentPane() {
  if (ContentTab === 'posts') return panePosts();
  if (ContentTab === 'radar') return paneRadar();
  if (ContentTab === 'reels') return paneReels();
  if (ContentTab === 'carousel') return paneCarousel();
  return paneTone();
}
function afterContentPane() {
  if (ContentTab === 'posts') afterPosts();
  if (ContentTab === 'radar') afterRadar();
  if (ContentTab === 'reels') afterReels();
  if (ContentTab === 'carousel') afterCarousel();
  if (ContentTab === 'tone') afterTone();
}

/* ---------- TOM DE VOZ ---------- */
function paneTone() {
  const t = Store.data.profile.tone;
  return `<div class="card" style="max-width:720px">
    <h3>Meu tom de voz</h3>
    <p class="muted" style="font-size:12px;margin-bottom:12px">O gerador usa este perfil para escrever posts no seu jeito. Quanto mais você descrever, melhor fica.</p>
    <div class="form-grid">
      <label class="field full"><span>Como eu falo (resumo)</span>
        <textarea id="tAbout" placeholder="Ex.: direto, informal, uso analogias do dia a dia, gosto de humor leve, sempre explico como se fosse pra minha mãe entender...">${esc(t.about)}</textarea></label>
      <label class="field full"><span>Expressões/palavras que uso muito</span>
        <textarea id="tExpr" style="min-height:55px" placeholder="Ex.: 'vamos combinar', 'sem enrolação', 'na moral'...">${esc(t.expressions)}</textarea></label>
      <label class="field full"><span>O que eu NUNCA falo / evito</span>
        <textarea id="tAvoid" style="min-height:55px" placeholder="Ex.: jargão técnico, 'sinergia', tom corporativo, emojis em excesso...">${esc(t.avoid)}</textarea></label>
      <label class="field full"><span>Meus CTAs favoritos (um por linha)</span>
        <textarea id="tCtas" style="min-height:80px">${esc(t.ctas)}</textarea></label>
    </div>
    <button class="btn" style="margin-top:14px" id="btnSaveTone">Salvar tom de voz</button>
  </div>`;
}
function afterTone() {
  document.getElementById('btnSaveTone').onclick = () => {
    const t = Store.data.profile.tone;
    t.about = val('tAbout'); t.expressions = val('tExpr'); t.avoid = val('tAvoid'); t.ctas = val('tCtas');
    Store.save(); UI.toast('Tom de voz salvo ✓');
  };
}

/* ---------- GERADOR DE POSTS ---------- */
function pickCta() {
  const ctas = (Store.data.profile.tone.ctas || '').split('\n').map(s => s.trim()).filter(Boolean);
  return ctas.length ? ctas[Math.floor(Math.random() * ctas.length)] : 'Chama no direct 👇';
}
function generatePost(subject, objective) {
  const t = Store.data.profile.tone;
  const hooks = POST_HOOKS[objective] || POST_HOOKS.educar;
  const hook = hooks[Math.floor(Math.random() * hooks.length)].split('{assunto}').join(subject);
  const flavor = t.expressions ? `\n\nEstilo: ${t.expressions}` : '';
  let body;
  if (objective === 'autoridade') {
    body = `1. [ponto principal sobre ${subject}]\n2. [o erro mais comum]\n3. [o que fazer na prática]\n4. [resultado esperado]`;
  } else if (objective === 'vender') {
    body = `Situação atual: [dor do cliente]\nCom ${subject}: [o que muda na vida dele]\nVocê não precisa entender de nada — eu resolvo do início ao fim.`;
  } else {
    body = `[Erro/problema comum]\nPor que isso acontece\nComo fazer certo, passo a passo`;
  }
  const avoid = t.avoid ? `\n(Evitar: ${t.avoid})` : '';
  return `${hook}\n\n${body}\n\n${pickCta()}${flavor}${avoid}`;
}
function panePosts() {
  const posts = Store.data.content.posts;
  return `<div class="grid" style="grid-template-columns:1fr 1.4fr">
    <div class="card">
      <h3>Transformar assunto em post</h3>
      <label class="field"><span>Assunto / tema*</span>
        <input type="text" id="postSubject" placeholder="Ex.: por que toda clínica precisa de site em 2025"></label>
      <label class="field" style="margin-top:10px"><span>Objetivo</span>
        <select id="postObjective">
          <option value="educar">Educar / ensinar</option>
          <option value="vender">Vender</option>
          <option value="conectar">Conectar / história</option>
          <option value="autoridade">Autoridade / passo a passo</option>
        </select></label>
      <label class="field" style="margin-top:10px"><span>Formato</span>
        <select id="postFormat"><option>Post único</option><option>Carrossel</option><option>Legenda de Reels</option></select></label>
      <button class="btn block" style="margin-top:14px" id="btnGenPost">✨ Gerar rascunho no meu tom</button>
    </div>
    <div>
      ${posts.length === 0 ? '<div class="empty">Seus posts gerados ficam salvos aqui.</div>' :
      posts.slice().reverse().map(p => `<div class="card" style="margin-bottom:12px" data-post="${p.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
          <b style="font-size:13px">${esc(p.subject)}</b>
          <div style="display:flex;gap:6px">
            <span class="badge">${esc(p.objective)}</span>
            <span class="badge ${p.status === 'postado' ? 'green' : 'yellow'}">${esc(p.status)}</span>
          </div>
        </div>
        <p style="font-size:12.5px;white-space:pre-wrap;color:#cdc9da;background:var(--bg-soft);padding:12px;border-radius:10px">${esc(p.text)}</p>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn ghost small" data-copy-post>Copiar</button>
          <button class="btn ghost small" data-edit-post>Editar</button>
          <button class="btn ghost small" data-toggle-post>${p.status === 'postado' ? 'Marcar como ideia' : 'Marcar como postado'}</button>
          <button class="btn danger small" data-del-post>✕</button>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}
function afterPosts() {
  document.getElementById('btnGenPost').onclick = () => {
    const subject = val('postSubject');
    if (!subject) return UI.toast('Digite o assunto', true);
    const objective = val('postObjective');
    const text = generatePost(subject, objective);
    Store.data.content.posts.push({ id: uid(), subject, objective, format: val('postFormat'), text, status: 'ideia', date: todayISO() });
    Store.save(); App.render();
    UI.toast('Rascunho gerado ✓ Ajuste as partes entre [ ] antes de postar');
  };
  document.querySelectorAll('[data-copy-post]').forEach(b => b.onclick = () => {
    const p = Store.data.content.posts.find(x => x.id === b.closest('[data-post]').dataset.post);
    UI.copy(p.text, b);
  });
  document.querySelectorAll('[data-del-post]').forEach(b => b.onclick = () => {
    const id = b.closest('[data-post]').dataset.post;
    Store.data.content.posts = Store.data.content.posts.filter(x => x.id !== id);
    Store.save(); App.render();
  });
  document.querySelectorAll('[data-toggle-post]').forEach(b => b.onclick = () => {
    const p = Store.data.content.posts.find(x => x.id === b.closest('[data-post]').dataset.post);
    p.status = p.status === 'postado' ? 'ideia' : 'postado';
    Store.save(); App.render();
  });
  document.querySelectorAll('[data-edit-post]').forEach(b => b.onclick = () => {
    const p = Store.data.content.posts.find(x => x.id === b.closest('[data-post]').dataset.post);
    UI.modal({
      title: 'Editar post',
      body: `<textarea id="epText" style="min-height:260px">${esc(p.text)}</textarea>`,
      foot(f, ov) {
        f.innerHTML = `<button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
        f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
        f.querySelector('[data-s]').onclick = () => { p.text = ov.querySelector('#epText').value; Store.save(); UI.closeModal(ov); App.render(); };
      }
    });
  });
}

/* ---------- RADAR ---------- */
function paneRadar() {
  const r = Store.data.content.radar;
  return `<div class="toolbar">
    <button class="btn" id="btnFetchRadar">🔄 Buscar notícias de hoje</button>
    <button class="btn ghost" id="btnRadarSources">Fontes (${r.sources.length})</button>
    <button class="btn ghost" id="btnManualSuggestion">+ Adicionar ideia manualmente</button>
  </div>
  ${r.items.length === 0 ? '<div class="empty">Clique em “Buscar notícias de hoje” — as manchetes viram sugestões de post conectadas ao seu nicho.</div>' :
  `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
    ${r.items.slice(0, 24).map((it, idx) => `<div class="card" data-news="${idx}">
      <span class="badge blue" style="margin-bottom:8px">${esc(it.source || 'notícia')}</span>
      <b style="font-size:13.5px;display:block;margin-bottom:6px">${esc(it.title)}</b>
      ${it.link ? `<a href="${esc(it.link)}" target="_blank" class="muted" style="font-size:11.5px">ler matéria original →</a>` : ''}
      <div style="margin-top:10px"><button class="btn ghost small" data-news-to-post="${idx}">✨ Transformar em post</button></div>
    </div>`).join('')}
  </div>`}
  ${Store.data.content.suggestions.length ? `<div class="section-title">Sugestões criadas do radar</div>
    ${Store.data.content.suggestions.map((s, i) => `<div class="card" style="margin-bottom:10px;max-width:760px">
      <b style="font-size:13px">${esc(s.title)}</b>
      <p style="font-size:12.5px;margin-top:6px;white-space:pre-wrap;color:#cdc9da">${esc(s.text)}</p>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn ghost small" data-copy-sug="${i}">Copiar</button>
        <button class="btn ghost small" data-sug-to-post="${i}">Salvar como post</button>
      </div></div>`).join('')}` : ''}`;
}
async function fetchRadar() {
  const r = Store.data.content.radar;
  UI.toast('Buscando notícias...');
  const items = [];
  for (const src of r.sources.slice(0, 3)) {
    try {
      const res = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(src));
      const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
      const name = (xml.querySelector('channel > title')?.textContent || src).slice(0, 24);
      xml.querySelectorAll('item').forEach((it, i) => {
        if (i >= 8) return;
        items.push({ title: (it.querySelector('title')?.textContent || '').trim(),
          link: it.querySelector('link')?.textContent?.trim() || '',
          source: name });
      });
    } catch (e) { console.warn('feed falhou', src); }
  }
  if (!items.length) {
    UI.toast('Não consegui acessar os feeds agora (rede/proxy). Adicione uma ideia manualmente.', true);
    return;
  }
  r.items = items; r.lastFetch = todayISO();
  Store.save(); App.render(); UI.toast(items.length + ' notícias encontradas ✓');
}
function newsToPost(it) {
  const subject = it.title;
  const angles = [
    `O que a notícia "${subject}" muda para pequenos negócios:\n\n1. [resuma em 1 frase]\n2. [o que o leitor deve fazer]\n3. [onde você entra como designer]`,
    `Essa notícia (${subject}) prova que quem não se adapta fica para trás. Sua marca precisa parecer atual — começa pelo visual.`,
    `TODO MUNDO está falando disso: ${subject}. E quase ninguém percebeu a oportunidade pro seu negócio...`
  ];
  Store.data.content.suggestions.push({ title: it.title, text: angles[Math.floor(Math.random() * angles.length)] + '\n\n' + pickCta(), date: todayISO() });
  Store.save(); App.render();
}
function afterRadar() {
  document.getElementById('btnFetchRadar').onclick = fetchRadar;
  document.getElementById('btnRadarSources').onclick = () => {
    const r = Store.data.content.radar;
    UI.modal({
      title: 'Fontes de notícias (RSS)',
      body: r.sources.map((s, i) => `<div class="checkline"><input type="text" data-src="${i}" value="${esc(s)}" style="background:transparent;border:none;flex:1"><button class="del" data-del-src="${i}">🗑</button></div>`).join('') +
        `<label class="field" style="margin-top:12px"><span>Adicionar feed</span><input type="url" id="newSource" placeholder="https://site.com/feed"></label>`,
      foot(f, ov) {
        f.innerHTML = `<button class="btn" data-s>Salvar</button>`;
        f.querySelector('[data-s]').onclick = () => {
          const arr = [...ov.querySelectorAll('[data-src]')].map(i => i.value.trim()).filter(Boolean);
          const nw = ov.querySelector('#newSource').value.trim();
          if (nw) arr.push(nw);
          r.sources = arr; Store.save(); UI.closeModal(ov); UI.toast('Fontes salvas ✓');
        };
        ov.querySelectorAll('[data-del-src]').forEach(b => b.onclick = () => b.closest('.checkline').remove());
      }
    });
  };
  document.getElementById('btnManualSuggestion').onclick = () => {
    UI.modal({
      title: 'Nova ideia de conteúdo',
      body: `<label class="field"><span>Título*</span><input type="text" id="sugTitle"></label>
        <label class="field" style="margin-top:10px"><span>Esboço / texto</span><textarea id="sugText" style="min-height:120px"></textarea></label>`,
      foot(f, ov) {
        f.innerHTML = `<button class="btn" data-s>Salvar</button>`;
        f.querySelector('[data-s]').onclick = () => {
          const title = ov.querySelector('#sugTitle').value.trim();
          if (!title) return UI.toast('Dê um título', true);
          Store.data.content.suggestions.push({ title, text: ov.querySelector('#sugText').value, date: todayISO() });
          Store.save(); UI.closeModal(ov); App.render();
        };
      }
    });
  };
  document.querySelectorAll('[data-news-to-post]').forEach(b => b.onclick = () =>
    newsToPost(Store.data.content.radar.items[Number(b.dataset.newsToPost)]));
  document.querySelectorAll('[data-copy-sug]').forEach(b => b.onclick = () =>
    UI.copy(Store.data.content.suggestions[Number(b.dataset.copySug)].text, b));
  document.querySelectorAll('[data-sug-to-post]').forEach(b => b.onclick = () => {
    const s = Store.data.content.suggestions[Number(b.dataset.sugToPost)];
    Store.data.content.posts.push({ id: uid(), subject: s.title, objective: 'educar', format: 'Post único', text: s.text, status: 'ideia', date: todayISO() });
    Store.data.content.suggestions = Store.data.content.suggestions.filter(x => x !== s);
    Store.save(); App.render(); UI.toast('Salvo como post ✓');
  });
}

/* ---------- REELS ---------- */
function generateReel(subject) {
  return {
    id: uid(), subject, date: todayISO(),
    hook: `Se você ${subject.toLowerCase().startsWith('como') ? 'quer ' + subject.toLowerCase() : 'trabalha com ' + subject}, precisa ver isso até o final.`,
    sections: [
      { time: '0–3s', text: `GANCHO: "${subject}" — fale a frase mais forte primeiro, sem apresentação.` },
      { time: '3–10s', text: `PROBLEMA: mostre o que dá errado sem isso. Exemplo prático do dia a dia.` },
      { time: '10–25s', text: `SOLUÇÃO: explique em 2 passos simples, na tela, mostrando na prática.` },
      { time: '25–30s', text: `CTA: "${pickCta()}"` }
    ],
    caption: `${subject} 🎬\n\nSalva esse vídeo pra usar depois 📌\n\n${pickCta()}`,
    notes: ''
  };
}
function paneReels() {
  const reels = Store.data.content.reels;
  return `<div class="toolbar"><button class="btn" id="btnNewReel">+ Roteiro novo</button>
    <input type="text" id="reelSubject" placeholder="Assunto do reels (ex.: como precificar design)" style="max-width:340px">
  </div>
  ${reels.length === 0 ? '<div class="empty">Roteiros estruturados com gancho, blocos cronometrados e CTA + modo teleprompter.</div>' :
  `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
    ${reels.map(r => `<div class="card" data-reel="${r.id}" style="cursor:pointer">
      <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:13.5px;flex:1">🎬 ${esc(r.subject)}</b>
        <span class="muted" style="font-size:11px">${fmtDate(r.date)}</span></div>
      <p class="muted" style="font-size:12px;margin:8px 0">${esc(r.hook)}</p>
      <div style="display:flex;gap:8px">
        <button class="btn small" data-tele="${r.id}">▶ Teleprompter</button>
        <button class="btn ghost small" data-edit-reel="${r.id}">Editar</button>
        <button class="btn danger small" data-del-reel="${r.id}">✕</button>
      </div></div>`).join('')}
  </div>`}`;
}
function afterReels() {
  document.getElementById('btnNewReel').onclick = () => {
    const subject = val('reelSubject');
    if (!subject) return UI.toast('Digite o assunto do reels', true);
    reelModal(generateReel(subject));
  };
  document.querySelectorAll('[data-tele]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    teleprompter(Store.data.content.reels.find(r => r.id === b.dataset.tele));
  });
  document.querySelectorAll('[data-del-reel]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const id = b.dataset.delReel;
    Store.data.content.reels = Store.data.content.reels.filter(r => r.id !== id);
    Store.save(); App.render();
  });
  document.querySelectorAll('[data-edit-reel]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    reelModal(Store.data.content.reels.find(r => r.id === b.dataset.editReel));
  });
}
function reelModal(r) {
  const isNew = !Store.data.content.reels.includes(r);
  UI.modal({
    title: 'Roteiro de Reels', lg: true,
    body: `<div class="form-grid">
      <label class="field full"><span>Assunto</span><input type="text" id="rSubject" value="${esc(r.subject)}"></label>
      <label class="field full"><span>Gancho (0–3s)</span><input type="text" id="rHook" value="${esc(r.hook)}"></label>
    </div>
    <b style="font-size:12.5px;display:block;margin:12px 0 6px">Blocos cronometrados</b>
    <div id="rBlocks">${r.sections.map((s, i) => `<div style="display:flex;gap:8px;margin-bottom:8px">
      <input type="text" data-rb-time="${i}" value="${esc(s.time)}" style="width:90px;flex-shrink:0">
      <textarea data-rb-text="${i}" style="min-height:52px">${esc(s.text)}</textarea>
      <button class="btn danger small" data-rb-del="${i}">✕</button></div>`).join('')}</div>
    <button class="btn ghost small" id="btnRbAdd">+ Bloco</button>
    <div class="form-grid" style="margin-top:12px">
      <label class="field full"><span>Legenda</span><textarea id="rCaption" style="min-height:70px">${esc(r.caption)}</textarea></label>
      <label class="field full"><span>Anotações (cenário, roupas, referência)</span><textarea id="rNotes" style="min-height:55px">${esc(r.notes)}</textarea></label>
    </div>`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn ghost" data-tele style="margin-right:auto">▶ Teleprompter</button>
        <button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-tele]').onclick = () => {
        r.hook = ov.querySelector('#rHook').value;
        r.sections = [...ov.querySelectorAll('[data-rb-time]')].map((t, i) => ({
          time: t.value, text: ov.querySelector(`[data-rb-text="${i}"]`).value
        }));
        teleprompter(r);
      };
      f.querySelector('[data-s]').onclick = () => {
        r.subject = ov.querySelector('#rSubject').value.trim() || r.subject;
        r.hook = ov.querySelector('#rHook').value;
        r.sections = [...ov.querySelectorAll('[data-rb-time]')].map((t, i) => ({
          time: t.value, text: ov.querySelector(`[data-rb-text="${i}"]`).value
        }));
        r.caption = ov.querySelector('#rCaption').value;
        r.notes = ov.querySelector('#rNotes').value;
        if (isNew) Store.data.content.reels.push(r);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Roteiro salvo ✓');
      };
      ov.querySelector('#btnRbAdd').onclick = () => {
        const i = ov.querySelectorAll('[data-rb-time]').length;
        ov.querySelector('#rBlocks').insertAdjacentHTML('beforeend', `<div style="display:flex;gap:8px;margin-bottom:8px">
          <input type="text" data-rb-time="${i}" value="${i * 8}–${i * 8 + 8}s" style="width:90px;flex-shrink:0">
          <textarea data-rb-text="${i}" style="min-height:52px" placeholder="Fale isso..."></textarea>
          <button class="btn danger small" data-rb-del="${i}">✕</button></div>`);
      };
      ov.addEventListener('click', e => {
        const del = e.target.closest('[data-rb-del]');
        if (del) del.closest('div[style]').remove();
      });
    }
  });
}
function teleprompter(r) {
  const ov = document.createElement('div');
  ov.className = 'tele';
  const full = [r.hook, ...r.sections.map(s => (s.time ? '[' + s.time + ']\n' : '') + s.text), r.caption]
    .filter(Boolean).join('\n\n');
  ov.innerHTML = `<div class="tele-scroll"><div class="tele-text" id="teleText">${esc(full).replace(/\n/g, '<br>')}</div></div>
    <div class="tele-bar">
      <button class="btn" id="telePlay">▶ Iniciar</button>
      <button class="btn ghost" id="telePause">⏸</button>
      <button class="btn ghost" id="teleReset">↺</button>
      <label class="muted" style="font-size:12px">Velocidade
        <input type="range" id="teleSpeed" min="0.5" max="4" step="0.25" value="1.5" style="width:130px;vertical-align:middle"></label>
      <button class="btn danger" id="teleClose">✕ Fechar</button>
    </div>`;
  document.body.appendChild(ov);
  const scroller = ov.querySelector('.tele-scroll');
  const textEl = ov.querySelector('#teleText');
  let speed = 1.5, raf = null, last = 0;
  function tick(ts) {
    if (!last) last = ts;
    scroller.scrollTop += speed * (ts - last) / 16;
    last = ts;
    raf = requestAnimationFrame(tick);
  }
  ov.querySelector('#telePlay').onclick = () => { last = 0; raf = requestAnimationFrame(tick); };
  ov.querySelector('#telePause').onclick = () => { cancelAnimationFrame(raf); };
  ov.querySelector('#teleReset').onclick = () => { scroller.scrollTop = 0; };
  ov.querySelector('#teleSpeed').oninput = e => speed = Number(e.target.value);
  ov.querySelector('#teleClose').onclick = () => { cancelAnimationFrame(raf); ov.remove(); };
}

/* ---------- CARROSSÉIS ---------- */
function generateCarousel(subject) {
  const cta = pickCta();
  return {
    id: uid(), subject, date: todayISO(),
    slides: [
      { title: subject.toUpperCase() + ' 👇', body: '(capa: frase curta e forte, 5–8 palavras, fonte grande)', imageIdea: 'Foto sua olhando pra câmera ou fundo na sua identidade visual com o título em destaque' },
      { title: 'O problema', body: `A maioria erra em ${subject} porque copia o que vê por aí sem contexto.`, imageIdea: 'Print ou foto do problema real (antes)' },
      { title: 'Por que importa', body: 'Isso custa clientes todo dia sem você perceber.', imageIdea: 'Número grande/ilustração do impacto (ex.: contador de clientes perdidos)' },
      { title: 'Como fazer — passo 1', body: '[explique o primeiro passo de forma simples]', imageIdea: 'Screenshot do passo a passo ou mockup demonstrando' },
      { title: 'Como fazer — passo 2', body: '[explique o segundo passo]', imageIdea: 'Foto do processo / depois' },
      { title: 'Resultado', body: '[mostre o antes e depois ou o ganho]', imageIdea: 'Antes x depois lado a lado' },
      { title: 'Resumo + CTA', body: cta, imageIdea: 'Card com seu @, foto sua e fundo na identidade visual' }
    ]
  };
}
function paneCarousel() {
  const list = Store.data.content.carousels;
  return `<div class="toolbar"><button class="btn" id="btnNewCarousel">+ Gerar carrossel</button>
    <input type="text" id="carSubject" placeholder="Assunto do carrossel" style="max-width:340px"></div>
  ${list.length === 0 ? '<div class="empty">Estrutura completa: capa, desenvolvimento e CTA — com sugestão de imagem para cada slide.</div>' :
  `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(310px,1fr))">
    ${list.map(c => `<div class="card" style="cursor:pointer" data-car="${c.id}">
      <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:13.5px;flex:1">🎠 ${esc(c.subject)}</b>
        <span class="badge">${c.slides.length} slides</span></div>
      <p class="muted" style="font-size:12px;margin:8px 0">${esc(c.slides[0].body)}</p>
      <div style="display:flex;gap:8px">
        <button class="btn ghost small" data-car-open="${c.id}">Abrir</button>
        <button class="btn ghost small" data-car-copy="${c.id}">Copiar tudo</button>
        <button class="btn danger small" data-car-del="${c.id}">✕</button>
      </div></div>`).join('')}
  </div>`}`;
}
function afterCarousel() {
  document.getElementById('btnNewCarousel').onclick = () => {
    const subject = val('carSubject');
    if (!subject) return UI.toast('Digite o assunto', true);
    carouselModal(generateCarousel(subject));
  };
  document.querySelectorAll('[data-car-del]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    Store.data.content.carousels = Store.data.content.carousels.filter(c => c.id !== b.dataset.carDel);
    Store.save(); App.render();
  });
  document.querySelectorAll('[data-car-copy]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const c = Store.data.content.carousels.find(x => x.id === b.dataset.carCopy);
    UI.copy(c.slides.map((s, i) => `— Slide ${i + 1} —\n${s.title}\n${s.body}\n🖼 ${s.imageIdea}`).join('\n\n'), b);
  });
  document.querySelectorAll('[data-car-open]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    carouselModal(Store.data.content.carousels.find(c => c.id === b.dataset.carOpen));
  });
}
function carouselModal(c) {
  const isNew = !Store.data.content.carousels.includes(c);
  function slidesHtml() {
    return c.slides.map((s, i) => `<div style="border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px;background:var(--bg-soft)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span class="badge purple">Slide ${i + 1}</span>
        <button class="btn danger small" data-sl-del="${i}">✕</button>
      </div>
      <label class="field"><span>Título</span><input type="text" data-sl-title="${i}" value="${esc(s.title)}"></label>
      <label class="field" style="margin-top:6px"><span>Texto</span><textarea data-sl-body="${i}" style="min-height:50px">${esc(s.body)}</textarea></label>
      <label class="field" style="margin-top:6px"><span>🖼 Sugestão de imagem</span><input type="text" data-sl-img="${i}" value="${esc(s.imageIdea)}"></label>
    </div>`).join('');
  }
  UI.modal({
    title: 'Carrossel — ' + c.subject, lg: true,
    body: `<button class="btn ghost small" id="btnSlAdd" style="margin-bottom:10px">+ Slide</button>
      <div id="carSlides">${slidesHtml()}</div>
      <button class="btn small" id="btnCarCopy2" style="margin-top:6px">Copiar texto completo</button>`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn" data-s>Salvar carrossel</button>`;
      f.querySelector('[data-s]').onclick = () => {
        c.subject = c.subject;
        c.slides = [...ov.querySelectorAll('[data-sl-title]')].map((t, i) => ({
          title: t.value, body: ov.querySelector(`[data-sl-body="${i}"]`).value,
          imageIdea: ov.querySelector(`[data-sl-img="${i}"]`).value
        }));
        if (isNew) Store.data.content.carousels.push(c);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Carrossel salvo ✓');
      };
      ov.querySelector('#btnSlAdd').onclick = () => {
        c.slides.push({ title: '', body: '', imageIdea: '' });
        ov.querySelector('#carSlides').innerHTML = slidesHtml();
      };
      ov.querySelector('#btnCarCopy2').onclick = e => {
        const slides = [...ov.querySelectorAll('[data-sl-title]')].map((t, i) => ({
          title: t.value, body: ov.querySelector(`[data-sl-body="${i}"]`).value, imageIdea: ov.querySelector(`[data-sl-img="${i}"]`).value
        }));
        UI.copy(slides.map((s, i) => `— Slide ${i + 1} —\n${s.title}\n${s.body}\n🖼 ${s.imageIdea}`).join('\n\n'), e.target);
      };
      ov.addEventListener('click', e => {
        const del = e.target.closest('[data-sl-del]');
        if (del) { c.slides.splice(Number(del.dataset.slDel), 1); ov.querySelector('#carSlides').innerHTML = slidesHtml(); }
      });
    }
  });
}
