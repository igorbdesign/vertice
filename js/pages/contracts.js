/* ===== Vértice — Gerador de contratos ===== */
window.Pages = window.Pages || {};
Pages.contracts = function () {
  const list = Store.data.contracts;
  return `
  <div class="toolbar"><span class="muted" style="font-size:13px">Minuta padrão + cláusulas editáveis + assinatura digitalizada.</span>
    <span class="spacer"></span>
    <button class="btn ghost" id="btnTemplate">Minuta padrão</button>
    <button class="btn" id="btnNewContract">+ Gerar contrato</button>
  </div>
  ${list.length === 0 ? '<div class="empty">Nenhum contrato gerado ainda.</div>' :
    `<div class="card" style="padding:0;overflow:hidden"><table class="table">
      <thead><tr><th>Cliente</th><th>Serviços</th><th>Valor</th><th>Data</th><th>Assinatura</th><th></th></tr></thead>
      <tbody>${list.map(c => `<tr data-id="${c.id}">
        <td><b>${esc(Finance.clientName(c.clientId) || '—')}</b></td>
        <td class="muted" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc((c.services || []).join(', '))}</td>
        <td class="mono">${fmtMoney(c.value)}</td>
        <td class="muted">${fmtDate(c.date)}</td>
        <td>${c.signature ? '<span class="badge green">✓ assinado</span>' : '<span class="badge yellow">pendente</span>'}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn ghost small" data-view>Ver / Assinar</button>
          <button class="btn danger small" data-del>✕</button>
        </td></tr>`).join('')}</tbody>
    </table></div>`}`;
};
Pages.contracts_after = function () {
  document.getElementById('btnNewContract').onclick = () => contractWizard();
  document.getElementById('btnTemplate').onclick = () => templateModal();
  document.querySelectorAll('tr[data-id]').forEach(tr => {
    const c = Store.data.contracts.find(x => x.id === tr.dataset.id);
    tr.querySelector('[data-view]').onclick = () => contractWizard(c);
    tr.querySelector('[data-del]').onclick = () => UI.confirm('Excluir este contrato?', () => {
      Store.data.contracts = Store.data.contracts.filter(x => x.id !== c.id);
      Store.save(); App.render();
    });
  });
};

function templateModal() {
  UI.modal({
    title: 'Minuta padrão', lg: true,
    body: `<label class="field"><span>Cabeçalho (partes)</span><textarea id="tHeader" style="min-height:120px">${esc(Store.data.contractTemplate?.header || ContractTemplate.header)}</textarea></label>
      <div id="tClauses" style="margin-top:14px">${(Store.data.contractTemplate?.clauses || ContractTemplate.clauses).map(cl => `
        <div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px">
          <input type="text" data-cl-title="${cl.id}" value="${esc(cl.title)}" style="font-weight:700;margin-bottom:8px">
          <textarea data-cl-text="${cl.id}" style="min-height:70px">${esc(cl.text)}</textarea>
        </div>`).join('')}</div>
      <label class="field"><span>Encerramento</span><textarea id="tFooter" style="min-height:90px">${esc(Store.data.contractTemplate?.footer || ContractTemplate.footer)}</textarea></label>
      <p class="muted" style="font-size:11.5px;margin-top:10px">Variáveis: {{contratado}}, {{contratante}}, {{documento}}, {{doccontratante}}, {{enderecocompleto}}, {{enderecocliente}}, {{servicos}}, {{datainicio}}, {{prazo}}, {{valor}}, {{valextenso}}, {{pagamento}}, {{revisoes}}, {{cidadecontrato}}, {{datacontrato}}</p>`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn ghost" data-reset style="margin-right:auto">Restaurar padrão</button><button class="btn" data-s>Salvar minuta</button>`;
      f.querySelector('[data-s]').onclick = () => {
        Store.data.contractTemplate = {
          header: ov.querySelector('#tHeader').value,
          footer: ov.querySelector('#tFooter').value,
          clauses: [...ov.querySelectorAll('[data-cl-title]')].map((t, i) => ({
            id: t.dataset.clTitle || 'cl' + i, title: t.value, text: ov.querySelector(`[data-cl-text="${t.dataset.clTitle}"]`).value
          }))
        };
        Store.save(); UI.closeModal(ov); UI.toast('Minuta salva ✓');
      };
      f.querySelector('[data-reset]').onclick = () => { delete Store.data.contractTemplate; Store.save(); UI.closeModal(ov); templateModal(); };
    }
  });
}

function contractWizard(existing) {
  const isNew = !existing;
  const clients = Store.data.clients;
  const tpl = Store.data.contractTemplate || ContractTemplate;
  let clauses = existing ? JSON.parse(JSON.stringify(existing.clauses)) : JSON.parse(JSON.stringify(tpl.clauses));
  let sigData = existing?.signature || null;

  function formHtml(c) {
    return `<div class="form-grid">
      <label class="field"><span>Cliente*</span>
        <select id="wClient">${UI.selectOptions(clients, c.clientId, 'id', x => x.name)}</select></label>
      <label class="field"><span>Data do contrato</span><input type="date" id="wDate" value="${c.date || todayISO()}"></label>
      <label class="field full"><span>Serviços contratados (separados por vírgula)</span>
        <input type="text" id="wServices" value="${esc((c.services || []).join(', '))}" placeholder="Ex.: identidade visual, landing page"></label>
      <label class="field"><span>Valor total (R$)</span><input type="number" id="wValue" value="${c.value || ''}"></label>
      <label class="field"><span>Prazo (dias)</span><input type="number" id="wPrazo" value="${c.prazo || 30}"></label>
      <label class="field"><span>Início dos trabalhos</span><input type="date" id="wInicio" value="${c.inicio || todayISO()}"></label>
      <label class="field"><span>Rodadas de revisão</span><input type="number" id="wRevisoes" value="${c.revisoes || 2}"></label>
      <label class="field full"><span>Forma de pagamento</span>
        <input type="text" id="wPagamento" value="${esc(c.pagamento || '50% na assinatura e 50% na entrega final')}"></label>
    </div>`;
  }

  function clausesHtml() {
    return clauses.map((cl, i) => `<div data-clause="${i}" style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px;position:relative">
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input type="text" data-i-title="${i}" value="${esc(cl.title)}" style="font-weight:700;flex:1">
        <button class="icon-btn" data-cl-del="${i}" title="Remover cláusula">🗑</button>
      </div>
      <textarea data-i-text="${i}" style="min-height:64px">${esc(cl.text)}</textarea>
    </div>`).join('');
  }

  const ov = UI.modal({
    title: isNew ? 'Gerar contrato' : 'Contrato — ' + (Finance.clientName(existing.clientId) || ''),
    lg: true, foot: false,
    body: `<div class="tabs" id="ctabs">
        <button class="tab active" data-tab="0">1 · Dados</button>
        <button class="tab" data-tab="1">2 · Cláusulas</button>
        <button class="tab" data-tab="2">3 · Assinatura</button>
      </div>
      <div data-pane="0">${formHtml(existing || {})}</div>
      <div data-pane="1" hidden>
        <button class="btn ghost small" id="btnAddClause" style="margin-bottom:10px">+ Adicionar cláusula</button>
        <div id="clauseList">${clausesHtml()}</div>
      </div>
      <div data-pane="2" hidden>
        <p class="muted" style="font-size:12.5px;margin-bottom:10px">Assine no quadro abaixo (mouse ou toque). A assinatura será incorporada ao contrato.</p>
        <canvas id="sigPad" class="sig-canvas" height="180"></canvas>
        <div style="display:flex;gap:10px;margin-top:10px">
          <button class="btn ghost small" id="btnClearSig">Limpar</button>
          <span class="spacer"></span>
          <button class="btn small" id="btnPreview">Pré-visualizar contrato</button>
          <button class="btn small" id="btnDownload">Baixar (.doc)</button>
        </div>
        <div id="previewBox" style="margin-top:14px"></div>
      </div>`,
    onMount(m) {
      m.querySelector('.modal-foot');
      const tabs = m.querySelectorAll('.tab');
      tabs.forEach(t => t.onclick = () => {
        tabs.forEach(x => x.classList.remove('active')); t.classList.add('active');
        m.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== t.dataset.tab);
      });
      const add = m.querySelector('#btnAddClause');
      if (add) add.onclick = () => {
        clauses.push({ id: uid(), title: 'CLÁUSULA ' + (clauses.length + 1) + 'ª — NOVA', text: '' });
        m.querySelector('#clauseList').innerHTML = clausesHtml();
        bindDel();
      };
      function bindDel() {
        m.querySelectorAll('[data-cl-del]').forEach(b => b.onclick = () => {
          clauses.splice(Number(b.dataset.clDel), 1);
          m.querySelector('#clauseList').innerHTML = clausesHtml();
          bindDel();
        });
      }
      bindDel();
      const canvas = m.querySelector('#sigPad');
      setupSignature(canvas, () => sigData);
      m.querySelector('#btnClearSig').onclick = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); sigData = null;
      };
      m.querySelector('#btnPreview').onclick = () => {
        m.querySelector('#previewBox').innerHTML = `<div class="card" style="max-height:340px;overflow-y:auto;white-space:pre-wrap;font-size:12px;line-height:1.7;background:var(--bg-soft)">${esc(generateText(m))}</div>`;
      };
      m.querySelector('#btnDownload').onclick = () => {
        const txt = generateText(m);
        const html = `<html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.6}img{width:220px;margin-top:10px}</style></head><body>${esc(txt).replace(/\n/g, '<br>')}${sigData ? `<br><img src="${sigData}">` : ''}</body></html>`;
        const name = clientOf(m)?.name || 'contrato';
        UI.download('contrato-' + name.toLowerCase().replace(/\s+/g, '-') + '.doc', html, 'application/msword');
      };
      const foot = document.createElement('div');
      foot.className = 'modal-foot';
      foot.innerHTML = `<button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar contrato</button>`;
      m.appendChild(foot);
      foot.querySelector('[data-c]').onclick = () => UI.closeModal(m);
      foot.querySelector('[data-s]').onclick = () => {
        const cl = clientOf(m);
        if (!cl) return UI.toast('Cadastre um cliente primeiro', true);
        const value = Number(m.querySelector('#wValue').value) || 0;
        const obj = {
          id: existing?.id || uid(), clientId: cl.id, date: m.querySelector('#wDate').value,
          services: m.querySelector('#wServices').value.split(',').map(s => s.trim()).filter(Boolean),
          value, prazo: Number(m.querySelector('#wPrazo').value) || 30,
          inicio: m.querySelector('#wInicio').value, revisoes: Number(m.querySelector('#wRevisoes').value) || 2,
          pagamento: m.querySelector('#wPagamento').value.trim(),
          clauses: JSON.parse(JSON.stringify(clauses)),
          signature: sigData, status: sigData ? 'assinado' : 'pendente'
        };
        if (existing) Object.assign(existing, obj);
        else Store.data.contracts.push(obj);
        if (!existing && value > 0) {
          Store.data.finance.entries.push({ id: uid(), type: 'income', description: 'Contrato ' + cl.name + ' (50% assinatura)',
            amount: value / 2, clientId: cl.id, date: obj.date, category: 'Serviços', forecast: true });
          const due = new Date(obj.inicio); due.setDate(due.getDate() + obj.prazo);
          Store.data.finance.entries.push({ id: uid(), type: 'income', description: 'Contrato ' + cl.name + ' (50% entrega)',
            amount: value / 2, clientId: cl.id, date: due.toISOString().slice(0, 10), category: 'Serviços', forecast: true });
          UI.toast('Contrato salvo + 2 previsões de pagamento criadas (50% / 50%) ✓');
        } else UI.toast('Contrato salvo ✓');
        Store.save(); UI.closeModal(m); App.render();
      };
      function clientOf(m) { return clients.find(c => c.id === m.querySelector('#wClient').value); }
      function generateText(m) {
        const cl = clientOf(m);
        const p = Store.data.profile;
        const value = Number(m.querySelector('#wValue').value) || 0;
        const vars = {
          contratado: p.business || p.name || '[Seu nome]',
          documento: p.doc || '[seu CPF/CNPJ]',
          enderecocompleto: p.address || '[seu endereço]',
          contratante: cl?.company || cl?.name || '[Cliente]',
          doccontratante: cl?.doc || '[CPF/CNPJ do cliente]',
          enderecocliente: cl?.address || '[endereço do cliente]',
          servicos: m.querySelector('#wServices').value || '[serviços]',
          datainicio: fmtDate(m.querySelector('#wInicio').value),
          prazo: m.querySelector('#wPrazo').value || '30',
          valor: (value).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          valextenso: valueExtenso(value),
          pagamento: m.querySelector('#wPagamento').value || '50% na assinatura e 50% na entrega',
          revisoes: m.querySelector('#wRevisoes').value || '2',
          cidadecontrato: p.city || '[cidade]',
          datacontrato: fmtDate(m.querySelector('#wDate').value)
        };
        let txt = (tpl.header || ContractTemplate.header);
        clauses.forEach(c => {
          const title = m.querySelector(`[data-i-title="${clauses.indexOf(c)}"]`)?.value ?? c.title;
          const text = m.querySelector(`[data-i-text="${clauses.indexOf(c)}"]`)?.value ?? c.text;
          txt += '\n' + title + '\n' + text + '\n';
        });
        txt += (tpl.footer || ContractTemplate.footer);
        Object.entries(vars).forEach(([k, v]) => { txt = txt.split('{{' + k + '}}').join(v); });
        return txt;
      }
      function valueExtenso(v) {
        if (!v) return '[valor por extenso]';
        const r = Math.floor(v), c = Math.round((v - r) * 100);
        const u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const dd = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const cem = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
        function tres(n) {
          if (n === 100) return 'cem';
          let s = '';
          const c1 = Math.floor(n / 100), resto = n % 100;
          if (c1) s += cem[c1];
          if (resto) {
            if (s) s += ' e ';
            if (resto < 20) s += u[resto];
            else { const d1 = Math.floor(resto / 10), u1 = resto % 10; s += d[d1] + (u1 ? ' e ' + u[u1] : ''); }
          }
          return s || 'zero';
        }
        function ext(n) {
          if (n >= 1000000) { const mi = Math.floor(n / 1000000); return tres(mi) + (mi > 1 ? ' milhões' : ' milhão') + (n % 1000000 ? ' e ' + ext(n % 1000000) : ''); }
          if (n >= 1000) { const mil = Math.floor(n / 1000); return (mil === 1 ? 'mil' : tres(mil) + ' mil') + (n % 1000 ? ' e ' + ext(n % 1000) : ''); }
          return tres(n);
        }
        let out = ext(r) + (r === 1 ? ' real' : ' reais');
        if (c) out += ' e ' + ext(c) + (c === 1 ? ' centavo' : ' centavos');
        return out;
      }
    }
  });
}

function setupSignature(canvas, getSig) {
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx) return;
  ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a2e';
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return [(t.clientX - r.left) * (canvas.width / r.width), (t.clientY - r.top) * (canvas.height / r.height)];
  }
  let drawing = false;
  const start = e => { drawing = true; ctx.beginPath(); ctx.moveTo(...pos(e)); e.preventDefault(); };
  const move = e => { if (!drawing) return; ctx.lineTo(...pos(e)); ctx.stroke(); e.preventDefault(); };
  const end = () => drawing = false;
  canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);
}
