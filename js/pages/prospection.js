/* ===== Vértice — Prospecção ativa ===== */
window.Pages = window.Pages || {};
const AUDIT_ITEMS = [
  { key: 'site', w: 0, q: 'O negócio tem site próprio?', noSite: true },
  { key: 'mobile', w: 25, q: 'O site funciona bem no celular (responsivo)?' },
  { key: 'whatsapp', w: 20, q: 'Tem botão/contato de WhatsApp visível?' },
  { key: 'atualizado', w: 15, q: 'As informações estão atualizadas (preços, horário, endereço)?' },
  { key: 'design', w: 20, q: 'O visual é moderno e passa confiança (fotos boas, layout limpo)?' },
  { key: 'rapido', w: 10, q: 'Carrega rápido e sem erros/quebras?' },
  { key: 'cta', w: 10, q: 'Tem chamada clara para ação (orçamento, agendar, comprar)?' }
];
const AUDIT_LABELS = {
  mobile: 'não funciona bem no celular',
  whatsapp: 'não tem WhatsApp fácil de achar',
  atualizado: 'tem informações desatualizadas',
  design: 'tem visual antigo / pouco confiável',
  rapido: 'está lento ou com erros',
  cta: 'não tem chamada clara para ação'
};
const DIAG_FIX = {
  mobile: 'A maioria das pessoas hoje pesquisa pelo celular. Se o site não se ajusta à tela, o cliente desiste em segundos e vai pro concorrente.',
  whatsapp: 'Quem tem interesse quer chamar no WhatsApp com um toque. Se a pessoa precisa procurar o número, ela quase sempre desiste.',
  atualizado: 'Preço errado, horário antigo ou telefone que não existe mais passam impressão de descuido — e de empresa fechada.',
  design: 'O site é a vitrine do negócio. Layout velho ou fotos ruins fazem o cliente pensar que o serviço também é assim.',
  rapido: 'Site que demora mais de 3 segundos faz a maioria das pessoas desistir antes de ver qualquer coisa.',
  cta: 'O site precisa dizer claramente o que o cliente deve fazer: pedir orçamento, agendar, chamar no zap.'
};
function scoreClass(s) { return s >= 60 ? 'score-high' : s >= 30 ? 'score-mid' : 'score-low'; }

Pages.prospection = function () {
  const p = Store.data.prospection;
  const leads = [...p.leads].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const hot = leads.filter(l => (l.score ?? 0) >= 60).length;
  return `
  <div class="stat-row" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-bottom:16px">
    <div class="stat"><div class="stat-label">Leads na base</div><div class="stat-value">${leads.length}</div></div>
    <div class="stat"><div class="stat-label">🔥 Oportunidade alta</div><div class="stat-value" style="color:var(--bad)">${hot}</div></div>
    <div class="stat"><div class="stat-label">Em conversa</div><div class="stat-value" style="color:var(--warn)">${leads.filter(l => l.stage === 'f3' || l.stage === 'f2').length}</div></div>
    <div class="stat"><div class="stat-label">Fechados</div><div class="stat-value" style="color:var(--good)">${leads.filter(l => l.stage === 'f5').length}</div></div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <h3>Adicionar negócio para auditoria</h3>
    <p class="muted" style="font-size:12px;margin-bottom:12px">Informe o nicho e a cidade. Depois, abra a auditoria e responda o mini-checklist sobre o site/Instagram do negócio — a nota de oportunidade, o diagnóstico e a mensagem de WhatsApp são gerados na hora.</p>
    <div class="form-grid">
      <label class="field"><span>Nome do negócio*</span><input type="text" id="leadName" placeholder="Ex.: Pizzaria Bella"></label>
      <label class="field"><span>Nicho*</span><input type="text" id="leadNiche" placeholder="Ex.: pizzaria, dentista, pet shop" list="nicheList">
        <datalist id="nicheList"><option>pizzaria</option><option>restaurante</option><option>dentista</option><option>advogado</option><option>pet shop</option><option>salão de beleza</option><option>academia</option><option>imobiliária</option><option>clínica</option><option>loja de roupas</option></datalist></label>
      <label class="field"><span>Cidade*</span><input type="text" id="leadCity" value="${esc(Store.data.profile.city || '')}"></label>
      <label class="field"><span>WhatsApp</span><input type="tel" id="leadPhone" placeholder="5511999999999"></label>
      <label class="field"><span>Site (se existir)</span><input type="url" id="leadSite" placeholder="https://..."></label>
      <label class="field"><span>Instagram</span><input type="text" id="leadIg" placeholder="@perfil"></label>
    </div>
    <div style="margin-top:12px"><button class="btn" id="btnAddLead">+ Adicionar e auditar depois</button></div>
  </div>

  <div class="section-title">Ranking de oportunidade — quem mais precisa de um site novo</div>
  <div class="card" style="padding:0;overflow:hidden">
  ${leads.length === 0 ? '<div class="empty">Adicione negócios acima para começar.</div>' : `<table class="table">
    <thead><tr><th style="width:56px">Nota</th><th>Negócio</th><th>Nicho/Cidade</th><th>Site</th><th>Principal problema</th><th></th></tr></thead>
    <tbody>${leads.map(l => `<tr data-id="${l.id}">
      <td><div class="score-ring ${scoreClass(l.score ?? 0)}">${l.score ?? '—'}</div></td>
      <td><b>${esc(l.name)}</b>${l.phone ? `<br><small class="muted">📞 ${esc(l.phone)}</small>` : ''}</td>
      <td class="muted">${esc(l.niche)} · ${esc(l.city)}</td>
      <td>${l.site ? `<a href="${esc(l.site)}" target="_blank">🔗 abrir</a>` : '<span class="badge red">sem site</span>'}</td>
      <td class="muted" style="font-size:12px">${esc(mainProblem(l))}</td>
      <td style="text-align:right;white-space:nowrap">
        ${l.stage === 'f1' && l.audited ? `<button class="btn small" data-wa="${l.id}">💬 WhatsApp</button>` : ''}
        <button class="btn ghost small" data-audit="${l.id}">${l.audited ? 'Reauditar' : 'Auditar'}</button>
      </td></tr>`).join('')}</tbody>
  </table>`}
  </div>

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
              ${l.stage === 'f1' && l.audited ? `<button class="btn small" style="padding:3px 9px;font-size:11px" data-wa="${l.id}">💬</button>` : ''}
              <button class="btn ghost" style="padding:3px 9px;font-size:11px" data-lead-view="${l.id}">abrir</button>
            </div>
          </div>`).join('') : '<div class="muted" style="text-align:center;font-size:11px;padding:10px 0">vazio</div>'}
        </div>
      </div>`;
    }).join('')}
  </div>`;
};

function mainProblem(l) {
  const fails = (l.issues || []);
  if (!l.site && l.audited) return 'Não tem site — os clientes só o encontram por indicação';
  return fails.length ? AUDIT_LABELS[fails[0]] || '—' : '—';
}
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

Pages.prospection_after = function () {
  const p = Store.data.prospection;
  document.getElementById('btnAddLead').onclick = () => {
    const name = val('leadName'), niche = val('leadNiche'), city = val('leadCity');
    if (!name || !niche || !city) return UI.toast('Preencha nome, nicho e cidade', true);
    p.leads.push({ id: uid(), name, niche, city, phone: val('leadPhone'), site: val('leadSite'),
      ig: val('leadIg'), stage: 'f1', audited: false, score: null, issues: [], history: [] });
    Store.save(); App.render(); UI.toast('Lead adicionado ✓ Agora audite o site dele.');
  };
  document.querySelectorAll('[data-audit]').forEach(b => b.onclick = () => auditModal(p.leads.find(l => l.id === b.dataset.audit)));
  document.querySelectorAll('[data-lead-view]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    leadModal(p.leads.find(l => l.id === b.dataset.leadView));
  });
  document.querySelectorAll('[data-wa]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    waModal(p.leads.find(l => l.id === b.dataset.wa));
  });
  document.querySelectorAll('.lead-card').forEach(el => {
    el.ondragstart = e => { e.dataTransfer.setData('lead', el.dataset.lead); el.style.opacity = .4; };
    el.ondragend = () => el.style.opacity = 1;
  });
  document.querySelectorAll('.fstage').forEach(st => {
    st.ondragover = e => { e.preventDefault(); st.classList.add('drag-over'); };
    st.ondragleave = () => st.classList.remove('drag-over');
    st.ondrop = e => {
      e.preventDefault(); st.classList.remove('drag-over');
      const id = e.dataTransfer.getData('lead');
      if (!id) return;
      const lead = p.leads.find(l => l.id === id);
      lead.stage = st.dataset.stage;
      if (st.dataset.stage !== 'f1' && !lead.firstTouch) lead.firstTouch = todayISO();
      lead.lastTouch = todayISO();
      lead.history.push({ date: todayISO(), stage: st.dataset.stage });
      Store.save(); App.render();
      if (st.dataset.stage === 'f5') UI.toast('Parabéns pela venda! 🏆 Registre o financeiro.');
    };
  });
};

function auditModal(lead) {
  const answers = lead.answers || {};
  UI.modal({
    title: 'Auditoria — ' + lead.name,
    body: `<p class="muted" style="font-size:12px;margin-bottom:12px">Abra o site${lead.site ? ` (<a href="${esc(lead.site)}" target="_blank">🔗 ${esc(lead.site)}</a>)` : ''} e o Instagram ${lead.ig ? esc(lead.ig) : ''} do negócio e responda rápido:</p>
      ${AUDIT_ITEMS.map(it => {
        if (it.key === 'site') {
          return `<div class="checkline" style="border-bottom:1px solid var(--border-soft)">
            <div class="box ${answers.site === false ? 'done' : ''}" data-audit-no-site>${answers.site === false ? '✓' : ''}</div>
            <span>${it.q} <small class="muted">(marque se NÃO tiver site)</small></span></div>`;
        }
        return `<div class="checkline" style="border-bottom:1px solid var(--border-soft)">
          <div class="box ${answers[it.key] === false ? 'done' : ''}" data-audit-key="${it.key}">${answers[it.key] === false ? '✓' : ''}</div>
          <span>Marque se <b>é um problema</b>: ${it.q}</span></div>`;
      }).join('')}
      <div style="margin-top:14px;display:flex;align-items:center;gap:12px">
        <div class="score-ring score-high" id="auditPreview" style="width:48px;height:48px;font-size:15px">—</div>
        <span class="muted" style="font-size:12px">Nota de oportunidade: quanto maior, mais o negócio precisa de você.</span>
      </div>`,
    onMount(m, ov) {
      function compute() {
        if (m.querySelector('[data-audit-no-site]').classList.contains('done')) {
          return { score: 95, issues: [] };
        }
        let penalty = 0; const issues = [];
        AUDIT_ITEMS.forEach(it => {
          if (it.key === 'site') return;
          if (m.querySelector(`[data-audit-key="${it.key}"]`).classList.contains('done')) {
            penalty += it.w; issues.push(it.key);
          }
        });
        return { score: Math.min(100, penalty + (lead.site ? 0 : 15)), issues };
      }
      function refresh() {
        const r = compute();
        const el = m.querySelector('#auditPreview');
        el.textContent = r.score;
        el.className = 'score-ring ' + scoreClass(r.score);
      }
      m.querySelectorAll('[data-audit-key], [data-audit-no-site]').forEach(b => b.onclick = () => {
        const done = b.classList.toggle('done');
        b.textContent = done ? '✓' : '';
        refresh();
      });
      refresh();
      const foot = document.createElement('div');
      foot.className = 'modal-foot';
      foot.innerHTML = `<button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar auditoria</button>`;
      m.appendChild(foot);
      foot.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      foot.querySelector('[data-s]').onclick = () => {
        const r = compute();
        lead.answers = {};
        AUDIT_ITEMS.forEach(it => {
          if (it.key === 'site') lead.answers.site = !m.querySelector('[data-audit-no-site]').classList.contains('done');
          else lead.answers[it.key] = !m.querySelector(`[data-audit-key="${it.key}"]`).classList.contains('done');
        });
        lead.score = r.score; lead.issues = r.issues; lead.audited = true;
        if (!lead.diagnosis) lead.diagnosis = buildDiagnosis(lead);
        Store.save(); UI.closeModal(ov); App.render(); App.updateAlertBadge();
        UI.toast('Auditoria salva ✓ Nota: ' + r.score);
      };
    }
  });
}

function buildDiagnosis(lead) {
  const noSite = lead.answers && lead.answers.site === false;
  const issues = lead.issues || [];
  const name = lead.name;
  if (noSite) {
    return `${name} não tem site próprio hoje. Isso significa que, quando alguém pesquisa "${lead.niche} em ${lead.city}" no Google, esse cliente só aparece em listagens de terceiros (ou não aparece). Quem pesquisa hoje confia em quem tem endereço digital próprio: horário, fotos, serviços e WhatsApp em um só lugar. Sem site, boa parte desse movimento vai para o concorrente que tem.`;
  }
  const parts = issues.map(k => DIAG_FIX[k]).filter(Boolean);
  const titles = issues.map(k => AUDIT_LABELS[k]).filter(Boolean);
  if (!parts.length) return `O site de ${name} está bem cuidado! Pode não ser um lead quente agora — bom manter contato para trabalhos futuros (manutenção, campanhas sazonais).`;
  return `Ao visitar o site de ${name}, notei que ${titles.join(', ')}. Na prática: ${parts.join(' ')} Juntos, esses pontos fazem quem chega pelo Google desistir antes de chamar — ou seja, o site está recebendo visita e deixando cliente escapar.`;
}

function waModal(lead) {
  const p = Store.data.prospection;
  const prof = Store.data.profile;
  const problems = (lead.issues || []).map(k => '• ' + (AUDIT_LABELS[k] || '')).join('\n') || (lead.answers?.site === false ? '• vocês ainda não têm site próprio' : '');
  const text = p.waTemplate
    .split('{{nome}}').join(lead.name)
    .split('{{meunome}}').join(prof.name || prof.business || '')
    .split('{{minhacidade}}').join(prof.city || '')
    .split('{{nicho}}').join(lead.niche)
    .split('{{cidade}}').join(lead.city)
    .split('{{problemas}}').join(problems);
  UI.modal({
    title: 'Mensagem para ' + lead.name,
    body: `<label class="field"><span>Diagnóstico (para você entender e adaptar)</span>
        <textarea id="waDiag" style="min-height:110px;background:var(--bg)">${esc(lead.diagnosis || buildDiagnosis(lead))}</textarea></label>
      <label class="field" style="margin-top:12px"><span>Mensagem pronta para WhatsApp</span>
        <textarea id="waMsg" style="min-height:220px">${esc(text)}</textarea></label>
      <p class="muted" style="font-size:11.5px">Envie pelo número: ${esc(lead.phone || 'cadastre o WhatsApp do lead')}</p>`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn ghost" data-copiar>Copiar mensagem</button>
        <button class="btn" data-open>Abrir no WhatsApp</button>`;
      f.querySelector('[data-copiar]').onclick = () => UI.copy(ov.querySelector('#waMsg').value, f.querySelector('[data-copiar]'));
      f.querySelector('[data-open]').onclick = () => {
        const msg = ov.querySelector('#waMsg').value;
        let phone = (lead.phone || '').replace(/\D/g, '');
        if (!phone) return UI.toast('Cadastre o WhatsApp do lead', true);
        if (!phone.startsWith('55')) phone = '55' + phone;
        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
        lead.stage = lead.stage === 'f1' ? 'f2' : lead.stage;
        lead.lastTouch = todayISO();
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
      <span class="badge purple">${esc(lead.niche)} · ${esc(lead.city)}</span>
      ${lead.site ? `<a class="badge" href="${esc(lead.site)}" target="_blank" style="text-decoration:none">🔗 site</a>` : '<span class="badge red">sem site</span>'}
      ${lead.ig ? `<span class="badge">📸 ${esc(lead.ig)}</span>` : ''}
      <span class="score-ring ${scoreClass(lead.score ?? 0)}" style="width:30px;height:30px;font-size:11px">${lead.score ?? '—'}</span>
    </div>
    <label class="field"><span>Etapa do funil</span>
      <select id="ldStage">${UI.selectOptions(stages, lead.stage, 'id', s => s.title)}</select></label>
    <label class="field" style="margin-top:10px"><span>WhatsApp</span><input type="tel" id="ldPhone" value="${esc(lead.phone)}"></label>
    <label class="field" style="margin-top:10px"><span>Diagnóstico</span><textarea id="ldDiag" style="min-height:100px">${esc(lead.diagnosis || '')}</textarea></label>
    <label class="field" style="margin-top:10px"><span>Anotações da negociação</span><textarea id="ldNotes" style="min-height:80px">${esc(lead.notes || '')}</textarea></label>
    <b style="font-size:12px;display:block;margin-top:12px">Histórico</b>
    ${(lead.history || []).map(h => `<div class="muted" style="font-size:12px;padding:4px 0">• ${fmtDate(h.date)} — ${esc((stages.find(s => s.id === h.stage) || {}).title || h.note || '')}</div>`).join('') || '<span class="muted" style="font-size:12px">sem interações ainda</span>'}`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn danger" data-d style="margin-right:auto">Excluir</button>
        ${lead.audited ? '<button class="btn ghost" data-wa>Mensagem WhatsApp</button>' : ''}
        <button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      f.querySelector('[data-d]').onclick = () => UI.confirm('Excluir lead?', () => {
        Store.data.prospection.leads = Store.data.prospection.leads.filter(l => l.id !== lead.id);
        Store.save(); UI.closeModal(ov); App.render();
      });
      if (f.querySelector('[data-wa]')) f.querySelector('[data-wa]').onclick = () => { UI.closeModal(ov); waModal(lead); };
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
