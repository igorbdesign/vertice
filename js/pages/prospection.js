/* ===== Vértice — Prospecção ativa (busca automática + ranking + funil) ===== */
window.Pages = window.Pages || {};

const SITE_ISSUES = {
  site:      { label: 'não tem site próprio', w: 0 },
  https:     { label: 'não tem HTTPS (cadeado de segurança)', w: 10 },
  mobile:    { label: 'não funciona bem no celular', w: 22 },
  whatsapp:  { label: 'não tem WhatsApp fácil de achar', w: 18 },
  seo:       { label: 'tem título/descrição fracos no Google', w: 12 },
  rapido:    { label: 'está pesado (carrega lento)', w: 14 },
  cta:       { label: 'não tem chamada clara para ação', w: 12 },
  presenca:  { label: 'tem presença fraca no Google (poucas avaliações)', w: 14 },
  erro:      { label: 'está fora do ar ou com erro de acesso', w: 30 }
};
const DIAG_FIX = {
  site: 'Hoje, quando alguém pesquisa pelo seu serviço no Google, você não aparece com endereço próprio — fotos, horário, serviços e WhatsApp num lugar só. Esse movimento todo vai para o concorrente que tem site.',
  https: 'Sem o cadeado de segurança, o navegador marca seu site como "não seguro" — e muita gente fecha na hora.',
  mobile: 'A maioria das pessoas pesquisa pelo celular. Se o site não se ajusta à tela, o cliente desiste em segundos e chama o concorrente.',
  whatsapp: 'Quem tem interesse quer chamar no WhatsApp com um toque. Se precisa procurar o número, quase sempre desiste.',
  seo: 'No Google, o título e a descrição são o seu outdoor. Fracos assim, pouca gente clica — mesmo aparecendo.',
  rapido: 'Site que demora mais de 3 segundos faz a maioria desistir antes de ver qualquer coisa.',
  cta: 'O site precisa dizer claramente o que fazer: pedir orçamento, agendar, chamar no zap. Sem isso, o visitante sai sem falar com você.',
  presenca: 'Poucas avaliações no Google passam pouca confiança para quem está comparando você com o concorrente.',
  erro: 'Neste momento o site nem abre direito. Todo cliente que tenta acessar está indo embora — ou indo para o concorrente.'
};

const scoreClass = s => s >= 60 ? 'score-high' : s >= 30 ? 'score-mid' : 'score-low';
const mainProblem = l => (l.issues || []).length ? SITE_ISSUES[l.issues[0]].label : (l.audited ? 'site saudável' : 'não analisado');
function issueLabel(k) { return SITE_ISSUES[k] ? SITE_ISSUES[k].label : k; }

function buildDiagnosis(lead) {
  const issues = lead.issues || [];
  const name = lead.name;
  if (!issues.length) return `O site de ${name} está bem cuidado! Não é um lead quente agora — bom manter contato para trabalhos futuros (manutenção, campanhas, sazonal).`;
  const parts = issues.map(k => DIAG_FIX[k]).filter(Boolean);
  const titles = issues.map(issueLabel);
  return `Ao visitar o site de ${name}, notei que ${titles.join(', ')}. Na prática: ${parts.join(' ')} Juntos, esses pontos fazem quem chega pelo Google desistir antes de chamar — ou seja, o site recebe visita e deixa cliente escapar.`;
}

Pages.prospection = function () {
  const p = Store.data.prospection;
  const results = [...(p.results || [])].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const leads = [...p.leads].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return `
  <div class="stat-row" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-bottom:16px">
    <div class="stat"><div class="stat-label">Leads no funil</div><div class="stat-value">${leads.length}</div></div>
    <div class="stat"><div class="stat-label">🔥 Oportunidade alta</div><div class="stat-value" style="color:var(--bad)">${leads.filter(l => (l.score ?? 0) >= 60).length}</div></div>
    <div class="stat"><div class="stat-label">Em conversa</div><div class="stat-value" style="color:var(--warn)">${leads.filter(l => l.stage === 'f3' || l.stage === 'f2').length}</div></div>
    <div class="stat"><div class="stat-label">Fechados</div><div class="stat-value" style="color:var(--good)">${leads.filter(l => l.stage === 'f5').length}</div></div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>Buscar negócios para prospectar</h3>
    <div class="form-grid">
      <label class="field"><span>Nicho / segmento*</span>
        <input type="text" id="leadNiche" placeholder="Ex.: pizzaria, dentista, pet shop" list="nicheList">
        <datalist id="nicheList"><option>pizzaria</option><option>restaurante</option><option>dentista</option><option>advogado</option><option>pet shop</option><option>salão de beleza</option><option>academia</option><option>imobiliária</option><option>clínica</option><option>loja de roupas</option></datalist></label>
      <label class="field"><span>Cidade (opcional, ajuda a filtrar)</span>
        <input type="text" id="leadCity" placeholder="Ex.: Curitiba" value="${esc(Store.data.profile.city || '')}"></label>
      <label class="field"><span>Quantos leads?</span>
        <select id="leadQty"><option value="5">5 leads</option><option value="10" selected>10 leads</option><option value="20">20 leads</option></select></label>
      <label class="field" style="justify-content:flex-end">
        <button class="btn block" id="btnSearchLeads">🔍 Buscar e rankear oportunidades</button></label>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap">
      <span class="muted" style="font-size:11.5px">Fonte atual: <b id="srcLabel">${Store.data.settings.placesKey ? 'Google Places (nota, avaliações e site de cada negócio)' : 'OpenStreetMap (gratuita, sem avaliações — configure a chave Google abaixo para mais dados)'}</b></span>
      <span class="spacer" style="flex:1"></span>
      <button class="btn ghost small" id="btnPlacesKey">⚙️ Chave do Google Places (opcional)</button>
    </div>
    <div id="searchStatus" class="muted" style="font-size:12px;margin-top:8px"></div>
  </div>

  <div class="section-title">Ranking de oportunidade — quem mais precisa de um site novo</div>
  ${results.length === 0 ? '<div class="empty">Busque por um nicho acima — os negócios aparecem rankeados: quem não tem site, tem site ruim ou presença fraca no Google fica no topo.</div>' :
  `<div class="card" style="padding:0;overflow:hidden"><table class="table">
    <thead><tr><th style="width:56px">Nota</th><th>Negócio</th><th>Local</th><th>Site</th><th>Google</th><th>Principal problema</th><th></th></tr></thead>
    <tbody>${results.map((l, i) => `<tr data-idx="${i}">
      <td><div class="score-ring ${scoreClass(l.score ?? 0)}">${l.score ?? '—'}</div></td>
      <td><b>${esc(l.name)}</b>${l.phone ? `<br><small class="muted">📞 ${esc(l.phone)}</small>` : ''}</td>
      <td class="muted" style="font-size:12px">${esc(l.address || l.city || '')}</td>
      <td>${l.site ? `<a href="${esc(l.site)}" target="_blank">🔗 abrir</a> ${l.checkedAt ? `<span class="badge ${l.score >= 60 ? 'red' : l.score >= 30 ? 'yellow' : 'green'}">${l.score >= 60 ? 'ruim' : l.score >= 30 ? 'regular' : 'bom'}</span>` : ''}` : '<span class="badge red">sem site</span>'}</td>
      <td class="muted" style="font-size:12px">${l.rating != null ? `⭐ ${String(l.rating).replace('.', ',')} (${l.reviews || 0})` : (l.googleRank ? `#${l.googleRank} na busca` : '—')}</td>
      <td class="muted" style="font-size:12px">${esc(mainProblem(l))}</td>
      <td style="text-align:right;white-space:nowrap">
        ${l.site && !l.checkedAt ? `<button class="btn ghost small" data-analyze="${i}">🔍 Analisar</button>` : ''}
        <button class="btn small" data-msg="${i}">💬 Diagnóstico + mensagem</button>
        <button class="btn ghost small" data-tofunnel="${i}">➕ Funil</button>
      </td></tr>`).join('')}</tbody>
  </table>
  <div style="padding:12px;display:flex;gap:10px;justify-content:flex-end">
    <button class="btn ghost small" id="btnAnalyzeAll">🔍 Analisar todos os sites</button>
    <button class="btn small" id="btnAllToFunnel">➕ Adicionar todos ao funil</button>
  </div></div>`}

  <div class="section-title">Funil de prospecção — nenhum lead no esquecimento</div>
  <div class="funnel" id="funnel">
    ${p.stages.map(st => {
      const ls = leads.filter(l => l.stage === st.id);
      return `<div class="fstage" data-stage="${st.id}">
        <div class="fstage-head"><span>${esc(st.title)}</span><span class="badge">${ls.length}</span></div>
        <div class="fstage-body">
          ${ls.length ? ls.map(l => `<div class="lead-card" draggable="true" data-lead="${l.id}">
            <div class="l-name">${esc(l.name)}</div>
            <div class="l-info">${esc(l.niche)} · nota ${l.score ?? '—'}${l.lastTouch ? ` · último toque: ${fmtDate(l.lastTouch)}` : ''}</div>
            ${l.stage !== 'f5' && l.stage !== 'f6' ? `<div class="l-info" style="color:${followUpTone(l)}">${followUpMsg(l)}</div>` : ''}
            <div style="display:flex;gap:6px;margin-top:7px">
              <button class="btn small" style="padding:3px 9px;font-size:11px" data-fun-msg="${l.id}">💬 Mensagem</button>
              <button class="btn ghost" style="padding:3px 9px;font-size:11px" data-lead-view="${l.id}">abrir</button>
            </div>
          </div>`).join('') : '<div class="muted" style="text-align:center;font-size:11px;padding:10px 0">vazio</div>'}
        </div>
      </div>`;
    }).join('')}
  </div>`;
};

function followUpMsg(l) {
  if (!l.lastTouch) return 'toque necessário';
  const d = daysBetween(l.lastTouch, todayISO());
  if (d >= 4) return `⚠️ ${d} dias sem retorno — mande um lembrete`;
  if (d >= 2) return 'aguardando resposta';
  return 'recém abordado';
}
function followUpTone(l) {
  const d = l.lastTouch ? daysBetween(l.lastTouch, todayISO()) : 99;
  return d >= 4 ? 'var(--bad)' : 'var(--muted-2)';
}

/* ---------- fontes de busca ---------- */
async function searchLeads(niche, city, qty) {
  const key = Store.data.settings.placesKey;
  if (key) return googleSearch(niche, city, qty);
  return osmSearch(niche, city, qty);
}
async function googleSearch(niche, city, qty) {
  const q = city ? `${niche} em ${city}` : niche;
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': Store.data.settings.placesKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.googleMapsUri'
    },
    body: JSON.stringify({ textQuery: q, languageCode: 'pt-BR', maxResultCount: Math.min(qty, 20) })
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message);
  return (j.places || []).slice(0, qty).map((p, i) => ({
    name: p.displayName?.text || '—',
    address: p.formattedAddress || '',
    site: p.websiteUri || '',
    phone: (p.internationalPhoneNumber || '').replace(/\D/g, ''),
    rating: p.rating ?? null, reviews: p.userRatingCount ?? null,
    googleRank: i + 1, maps: p.googleMapsUri || ''
  }));
}
async function osmSearch(niche, city, qty) {
  if (!city) throw new Error('Na fonte gratuita (OpenStreetMap) a cidade é obrigatória — ou configure a chave do Google Places.');
  const g = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(city)).then(r => r.json());
  if (!g[0]) throw new Error('Não encontrei a cidade "' + city + '" no mapa.');
  const bb = g[0].boundingbox;
  const bbox = `${bb[2]},${bb[0]},${bb[3]},${bb[1]}`;
  const q = `[out:json][timeout:30];(nwr["name"~"${niche.replace(/["\\]/g, '')}",i](${bbox}););out center ${qty * 4};`;
  const j = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q)).then(r => r.json());
  return (j.elements || []).filter(e => e.tags && e.tags.name)
    .slice(0, qty).map(e => {
      const t = e.tags;
      return {
        name: t.name,
        address: [t['addr:street'], t['addr:housenumber'], t['addr:city']].filter(Boolean).join(', ') || city,
        site: t.website || t['contact:website'] || '',
        phone: (t.phone || t['contact:phone'] || t['contact:mobile'] || '').replace(/\D/g, ''),
        rating: null, reviews: null, googleRank: null, maps: ''
      };
    });
}

/* ---------- auditoria de site real ---------- */
async function auditSite(lead) {
  if (!lead.site) {
    lead.score = 95; lead.issues = ['site']; lead.checkedAt = todayISO();
    lead.diagnosis = buildDiagnosis(lead);
    return;
  }
  let html = '';
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(lead.site), { signal: ctrl.signal });
    clearTimeout(t);
    html = await res.text();
  } catch (e) { html = ''; }
  const issues = [];
  if (!html) {
    issues.push('erro');
  } else {
    if (lead.site.startsWith('http://')) issues.push('https');
    if (!/<meta[^>]+viewport/i.test(html)) issues.push('mobile');
    if (!/wa\.me|whatsapp|api\.whatsapp/i.test(html)) issues.push('whatsapp');
    if (!/<title>\s*[\s\S]{5,}?\s*<\/title>/i.test(html) || !/<meta[^>]+name=["']description["']/i.test(html)) issues.push('seo');
    if (html.length > 1200000) issues.push('rapido');
    if (!/tel:|mailto:|contato|fale\s+conosco|or[çc]amento|agend/i.test(html)) issues.push('cta');
  }
  lead.issues = issues;
  lead.score = Math.min(100, issues.reduce((s, k) => s + (SITE_ISSUES[k]?.w || 15), 10));
  lead.checkedAt = todayISO();
  lead.diagnosis = buildDiagnosis(lead);
}

/* ---------- mensagens ---------- */
function waModal(lead) {
  const p = Store.data.prospection;
  const prof = Store.data.profile;
  if (!lead.diagnosis) lead.diagnosis = buildDiagnosis(lead);
  const problems = (lead.issues || []).map(k => '• ' + issueLabel(k)).join('\n') || '';
  const text = p.waTemplate
    .split('{{nome}}').join(lead.name)
    .split('{{meunome}}').join(prof.name || prof.business || '')
    .split('{{minhacidade}}').join(prof.city || '')
    .split('{{nicho}}').join(lead.niche || '')
    .split('{{cidade}}').join(lead.city || '')
    .split('{{problemas}}').join(problems);
  UI.modal({
    title: 'Mensagem para ' + lead.name,
    body: `<label class="field"><span>Diagnóstico (entenda sem sigla técnica o que afasta o cliente)</span>
        <textarea id="waDiag" style="min-height:110px;background:var(--bg)">${esc(lead.diagnosis)}</textarea></label>
      <label class="field" style="margin-top:12px"><span>Mensagem pronta para WhatsApp</span>
        <textarea id="waMsg" style="min-height:220px">${esc(text)}</textarea></label>
      <p class="muted" style="font-size:11.5px">Enviar para: ${esc(lead.phone || 'sem telefone — copie e cole no WhatsApp')}</p>`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn ghost" data-copiar>Copiar mensagem</button>
        <button class="btn" data-open>Abrir no WhatsApp</button>`;
      f.querySelector('[data-copiar]').onclick = () => UI.copy(ov.querySelector('#waMsg').value, f.querySelector('[data-copiar]'));
      f.querySelector('[data-open]').onclick = () => {
        const msg = ov.querySelector('#waMsg').value;
        let phone = (lead.phone || '').replace(/\D/g, '');
        if (!phone) return UI.toast('Este lead não tem telefone — copie a mensagem', true);
        if (!phone.startsWith('55')) phone = '55' + phone;
        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
        lead.stage = lead.stage === 'f1' ? 'f2' : lead.stage;
        lead.lastTouch = todayISO();
        lead.history = lead.history || [];
        lead.history.push({ date: todayISO(), stage: 'f2', note: 'mensagem enviada' });
        Store.save(); UI.closeModal(ov); App.render();
      };
      ov.querySelector('#waDiag').onchange = e => { lead.diagnosis = e.target.value; Store.save(); };
      ov.querySelector('#waMsg').onchange = e => { lead.lastMessage = e.target.value; Store.save(); };
    }
  });
}

function leadModal(lead) {
  const stages = Store.data.prospection.stages;
  UI.modal({
    title: lead.name,
    body: `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <span class="badge purple">${esc(lead.niche || '')}${lead.city ? ' · ' + esc(lead.city) : ''}</span>
      ${lead.site ? `<a class="badge" href="${esc(lead.site)}" target="_blank" style="text-decoration:none">🔗 site</a>` : '<span class="badge red">sem site</span>'}
      ${lead.maps ? `<a class="badge" href="${esc(lead.maps)}" target="_blank" style="text-decoration:none">📍 Google Maps</a>` : ''}
      ${lead.rating != null ? `<span class="badge">⭐ ${String(lead.rating).replace('.', ',')} (${lead.reviews || 0})</span>` : ''}
      <span class="score-ring ${scoreClass(lead.score ?? 0)}" style="width:30px;height:30px;font-size:11px">${lead.score ?? '—'}</span>
    </div>
    ${lead.address ? `<p class="muted" style="font-size:12px;margin-bottom:10px">📍 ${esc(lead.address)}</p>` : ''}
    <label class="field"><span>Etapa do funil</span>
      <select id="ldStage">${UI.selectOptions(stages, lead.stage, 'id', s => s.title)}</select></label>
    <label class="field" style="margin-top:10px"><span>WhatsApp</span><input type="tel" id="ldPhone" value="${esc(lead.phone)}"></label>
    <label class="field" style="margin-top:10px"><span>Diagnóstico</span><textarea id="ldDiag" style="min-height:100px">${esc(lead.diagnosis || buildDiagnosis(lead))}</textarea></label>
    <label class="field" style="margin-top:10px"><span>Anotações da negociação</span><textarea id="ldNotes" style="min-height:80px">${esc(lead.notes || '')}</textarea></label>
    <b style="font-size:12px;display:block;margin-top:12px">Histórico</b>
    ${(lead.history || []).map(h => `<div class="muted" style="font-size:12px;padding:4px 0">• ${fmtDate(h.date)} — ${esc((stages.find(s => s.id === h.stage) || {}).title || h.note || '')}</div>`).join('') || '<span class="muted" style="font-size:12px">sem interações ainda</span>'}`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn danger" data-d style="margin-right:auto">Excluir</button>
        <button class="btn ghost" data-wa>💬 Mensagem WhatsApp</button>
        <button class="btn ghost" data-c>Fechar</button>
        <button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      f.querySelector('[data-d]').onclick = () => UI.confirm('Excluir lead?', () => {
        Store.data.prospection.leads = Store.data.prospection.leads.filter(l => l.id !== lead.id);
        Store.save(); UI.closeModal(ov); App.render();
      });
      f.querySelector('[data-wa]').onclick = () => { UI.closeModal(ov); waModal(lead); };
      f.querySelector('[data-s]').onclick = () => {
        lead.stage = ov.querySelector('#ldStage').value;
        lead.phone = ov.querySelector('#ldPhone').value.trim();
        lead.diagnosis = ov.querySelector('#ldDiag').value;
        lead.notes = ov.querySelector('#ldNotes').value;
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Lead atualizado ✓');
      };
    }
  });
}

/* ---------- interações ---------- */
Pages.prospection_after = function () {
  const p = Store.data.prospection;
  document.getElementById('btnSearchLeads').onclick = async () => {
    const niche = document.getElementById('leadNiche').value.trim();
    const city = document.getElementById('leadCity').value.trim();
    const qty = Number(document.getElementById('leadQty').value);
    if (!niche) return UI.toast('Digite o nicho (ex.: pizzaria)', true);
    const st = document.getElementById('searchStatus');
    st.innerHTML = '⏳ Buscando negócios...';
    try {
      const found = await searchLeads(niche, city, qty);
      if (!found.length) { st.innerHTML = 'Nenhum negócio encontrado para "' + esc(niche) + '". Tente outro termo ou cidade.'; return; }
      p.results = found.map(l => ({ ...l, niche, city: city || (l.address || ''), stage: 'f1', audited: l.site ? false : true, score: null, issues: [], history: [] }));
      p.lastSearch = todayISO();
      Store.save();
      st.innerHTML = `✅ ${found.length} negócio(s) encontrados — analisando os sites...`;
      App.render();
      analyzeAll();
    } catch (e) {
      st.innerHTML = '⚠️ ' + esc(e.message);
    }
  };
  document.getElementById('btnPlacesKey').onclick = () => {
    UI.modal({
      title: 'Chave do Google Places (opcional)',
      body: `<p style="font-size:12.5px">Com uma chave do <b>Google Places API</b>, a busca traz nota, número de avaliações, telefone e site de cada negócio (fonte oficial do Google). Sem chave, uso o OpenStreetMap — gratuito, sem cadastro, mas sem avaliações.</p>
        <ol style="font-size:12.5px;color:var(--muted);margin:10px 0 14px 18px;line-height:1.7">
          <li>Acesse <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank">console.cloud.google.com</a></li>
          <li>Crie um projeto → APIs e serviços → Credenciais → Criar credencial → Chave de API</li>
          <li>Ative a API "Places API (New)"</li>
          <li>Cole a chave abaixo (fica salva só neste navegador)</li>
        </ol>
        <label class="field"><span>Chave de API</span><input type="text" id="pkInput" value="${esc(Store.data.settings.placesKey || '')}" placeholder="AIza..."></label>`,
      foot(f, ov) {
        f.innerHTML = `<button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
        f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
        f.querySelector('[data-s]').onclick = () => {
          Store.data.settings.placesKey = ov.querySelector('#pkInput').value.trim();
          Store.save(); UI.closeModal(ov); App.render(); UI.toast('Chave salva ✓');
        };
      }
    });
  };
  document.querySelectorAll('[data-analyze]').forEach(b => b.onclick = async () => {
    const l = p.results[Number(b.dataset.analyze)];
    b.textContent = '⏳ analisando...';
    await auditSite(l);
    Store.save(); App.render();
    UI.toast(`"${l.name}" analisado — nota ${l.score}`);
  });
  document.querySelectorAll('[data-msg]').forEach(b => b.onclick = () => waModal(p.results[Number(b.dataset.msg)]));
  document.querySelectorAll('[data-tofunnel]').forEach(b => b.onclick = () => toFunnel([p.results[Number(b.dataset.tofunnel)]]));
  const all = document.getElementById('btnAllToFunnel');
  if (all) all.onclick = () => toFunnel(p.results);
  const analyzeAllBtn = document.getElementById('btnAnalyzeAll');
  if (analyzeAllBtn) analyzeAllBtn.onclick = () => { analyzeAllBtn.textContent = '⏳ analisando...'; analyzeAll(); };
  document.querySelectorAll('[data-lead-view]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    leadModal(p.leads.find(l => l.id === b.dataset.leadView));
  });
  document.querySelectorAll('[data-fun-msg]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    waModal(p.leads.find(l => l.id === b.dataset.funMsg));
  });
  document.querySelectorAll('.lead-card').forEach(el => {
    el.ondragstart = e => { e.dataTransfer.setData('lead', el.dataset.lead); el.style.opacity = .4; };
    el.ondragend = () => el.style.opacity = 1;
  });
  document.querySelectorAll('.fstage').forEach(stEl => {
    stEl.ondragover = e => { e.preventDefault(); stEl.classList.add('drag-over'); };
    stEl.ondragleave = () => stEl.classList.remove('drag-over');
    stEl.ondrop = e => {
      e.preventDefault(); stEl.classList.remove('drag-over');
      const id = e.dataTransfer.getData('lead');
      if (!id) return;
      const lead = p.leads.find(l => l.id === id);
      lead.stage = stEl.dataset.stage;
      if (stEl.dataset.stage !== 'f1' && !lead.firstTouch) lead.firstTouch = todayISO();
      lead.lastTouch = todayISO();
      lead.history.push({ date: todayISO(), stage: stEl.dataset.stage });
      Store.save(); App.render();
      if (stEl.dataset.stage === 'f5') UI.toast('Parabéns pela venda! 🏆 Registre no financeiro.');
    };
  });
};

async function analyzeAll() {
  const p = Store.data.prospection;
  const pending = p.results.filter(l => !l.checkedAt);
  for (const l of pending) {
    await auditSite(l);
    Store.save();
    App.render();
  }
  if (pending.length) UI.toast(`${pending.length} site(s) analisado(s) ✓ Ranking atualizado`);
}

function toFunnel(list) {
  const p = Store.data.prospection;
  let added = 0;
  list.forEach(l => {
    if (p.leads.some(x => x.name === l.name && x.city === l.city)) return;
    p.leads.push({
      id: uid(), name: l.name, niche: l.niche, city: l.city, address: l.address,
      site: l.site, phone: l.phone, rating: l.rating, reviews: l.reviews,
      googleRank: l.googleRank, maps: l.maps,
      stage: 'f1', audited: !!l.checkedAt, score: l.score ?? null, issues: l.issues || [],
      diagnosis: l.diagnosis || '', history: [], addedAt: todayISO()
    });
    added++;
  });
  Store.save(); App.render();
  UI.toast(added ? `${added} lead(s) no funil ✓ Gere a mensagem em 💬` : 'Estes leads já estão no funil');
}
