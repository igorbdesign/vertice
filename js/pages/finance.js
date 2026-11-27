/* ===== Vértice — Financeiro ===== */
window.Pages = window.Pages || {};
let FinPeriod = { year: new Date().getFullYear(), month: todayISO().slice(0, 7), mode: 'month' };

Pages.finance = function () {
  const year = FinPeriod.year;
  const months = Finance.monthList(year);
  const yearIn = Finance.inMonth(String(year), 'income');
  const yearOut = Finance.inMonth(String(year), 'expense');
  const mode = FinPeriod.mode;
  const mk = FinPeriod.month;
  const mIn = Finance.inMonth(mk, 'income');
  const mOut = Finance.inMonth(mk, 'expense');
  const forecast = Finance.forecast(mk);
  const entries = Store.data.finance.entries.filter(e => (mode === 'year' ? e.date.startsWith(String(year)) : Finance.monthKey(e.date) === mk))
    .sort((a, b) => b.date.localeCompare(a.date));
  const received = mIn - forecast;

  return `
  <div class="toolbar">
    <div class="pill-toggle">
      <button data-mode="month" class="${mode === 'month' ? 'active' : ''}">Mês</button>
      <button data-mode="year" class="${mode === 'year' ? 'active' : ''}">Ano</button>
    </div>
    <button class="btn ghost small" id="finPrev">‹</button>
    <b id="finLabel">${mode === 'month' ? new Date(mk + '-01T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : year}</b>
    <button class="btn ghost small" id="finNext">›</button>
    <span class="spacer"></span>
    <button class="btn ghost" id="btnRecurring">Assinaturas fixas (${Store.data.finance.recurring.length})</button>
    <button class="btn" id="btnNewEntry">+ Lançamento</button>
  </div>

  <div class="stat-row">
    <div class="stat hoverable"><span class="ico">💰</span>
      <div class="stat-label">Entradas</div>
      <div class="stat-value" style="color:var(--good)">${fmtMoney(mode === 'month' ? mIn : yearIn)}</div>
      <div class="stat-extra">${mode === 'month' ? fmtMoney(received) + ' confirmado · ' + fmtMoney(forecast) + ' previsto' : 'no ano ' + year}</div>
      <div class="hover-pop"><b>${mode === 'month' ? 'Por cliente / origem' : 'Por mês — ' + year}</b>
        ${mode === 'month'
          ? incomeBySource(mk)
          : months.map(m => `<div class="hrow"><span>${new Date(m + '-01T12:00').toLocaleDateString('pt-BR', { month: 'long' })}</span><b>${fmtMoney(Finance.inMonth(m, 'income'))}</b></div>`).join('')}
      </div>
    </div>
    <div class="stat hoverable"><span class="ico">💸</span>
      <div class="stat-label">Saídas</div>
      <div class="stat-value" style="color:var(--bad)">${fmtMoney(mode === 'month' ? mOut : yearOut)}</div>
      <div class="stat-extra">${mode === 'month' ? 'custos fixos + variáveis' : 'no ano ' + year}</div>
      <div class="hover-pop"><b>${mode === 'month' ? 'Por categoria' : 'Por mês — ' + year}</b>
        ${mode === 'month'
          ? catBreakdown(mk)
          : months.map(m => `<div class="hrow"><span>${new Date(m + '-01T12:00').toLocaleDateString('pt-BR', { month: 'long' })}</span><b>${fmtMoney(Finance.inMonth(m, 'expense'))}</b></div>`).join('')}
      </div>
    </div>
    <div class="stat hoverable"><span class="ico">⚖️</span>
      <div class="stat-label">Saldo</div>
      <div class="stat-value" style="color:${(mode === 'month' ? mIn - mOut : yearIn - yearOut) >= 0 ? 'var(--accent-soft)' : 'var(--bad)'}">${fmtMoney(mode === 'month' ? mIn - mOut : yearIn - yearOut)}</div>
      <div class="stat-extra">${mode === 'month' ? 'entradas − saídas do mês' : 'entradas − saídas do ano'}</div>
      <div class="hover-pop"><b>Ano ${year} — saldo por mês</b>
        ${months.map(m => { const i = Finance.inMonth(m, 'income'), o = Finance.inMonth(m, 'expense'); const s = i - o;
          return `<div class="hrow"><span>${new Date(m + '-01T12:00').toLocaleDateString('pt-BR', { month: 'long' })}</span><b style="color:${s >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtMoney(s)}</b></div>`; }).join('')}
        <div class="hrow" style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px"><span>Total do ano</span><b>${fmtMoney(yearIn - yearOut)}</b></div>
      </div>
    </div>
    <div class="stat hoverable"><span class="ico">🔮</span>
      <div class="stat-label">Previsão de recebimento</div>
      <div class="stat-value" style="color:var(--warn)">${fmtMoney(forecast)}</div>
      <div class="stat-extra">${Store.data.finance.entries.filter(e => e.forecast && e.type === 'income' && Finance.monthKey(e.date) === mk).length} item(ns) a receber no mês</div>
      <div class="hover-pop"><b>A receber em ${new Date(mk + '-01T12:00').toLocaleDateString('pt-BR', { month: 'long' })}</b>
        ${Store.data.finance.entries.filter(e => e.forecast && e.type === 'income' && Finance.monthKey(e.date) === mk)
          .map(e => `<div class="hrow"><span>${fmtDate(e.date)} · ${esc(e.description)}</span><b>${fmtMoney(e.amount)}</b></div>`).join('') || '<div class="hrow">Nada previsto</div>'}
      </div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns:2fr 1fr;margin-top:14px">
    <div class="card"><h3>Fluxo do ano ${year}</h3><div class="chart-box"><canvas id="finChart"></canvas></div></div>
    <div class="card"><h3>Distribuição das saídas</h3><div class="chart-box sm"><canvas id="finDonut"></canvas></div></div>
  </div>

  <div class="section-title">Lançamentos ${mode === 'month' ? 'de ' + new Date(mk + '-01T12:00').toLocaleDateString('pt-BR', { month: 'long' }) : 'do ano ' + year}</div>
  <div class="card" style="padding:0;overflow:hidden">
  ${entries.length === 0 ? '<div class="empty">Nenhum lançamento neste período.</div>' : `<table class="table">
    <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Cliente</th><th>Forma</th><th style="text-align:right">Valor</th><th></th></tr></thead>
    <tbody>${entries.map(e => `<tr>
      <td class="muted">${fmtDate(e.date)}</td>
      <td><b>${esc(e.description)}</b>${e.forecast ? ' <span class="badge yellow">previsto</span>' : ''}${e.auto ? ' <span class="badge">fixo</span>' : ''}</td>
      <td class="muted">${esc(e.category || '—')}</td>
      <td class="muted">${esc(e.clientId ? Finance.clientName(e.clientId) : '')}</td>
      <td class="muted">${esc(e.method || '')}</td>
      <td class="mono" style="text-align:right;color:${e.type === 'income' ? 'var(--good)' : 'var(--bad)'}">${e.type === 'income' ? '+' : '−'}${fmtMoney(e.amount)}</td>
      <td style="text-align:right"><button class="btn danger small" data-del="${e.id}">✕</button></td>
    </tr>`).join('')}</tbody>
  </table>`}
  </div>`;
};

function incomeBySource(mk) {
  const map = {};
  Store.data.finance.entries.forEach(e => {
    if (e.type === 'income' && Finance.monthKey(e.date) === mk) {
      const k = e.clientId ? Finance.clientName(e.clientId) : (e.category || 'Avulso');
      map[k] = (map[k] || 0) + Number(e.amount || 0);
    }
  });
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return rows.length ? rows.map(([k, v]) => `<div class="hrow"><span>${esc(k)}</span><b>${fmtMoney(v)}</b></div>`).join('')
    : '<div class="hrow">Sem entradas</div>';
}

Pages.finance_after = function () {
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { FinPeriod.mode = b.dataset.mode; App.render(); });
  document.getElementById('finPrev').onclick = () => shiftPeriod(-1);
  document.getElementById('finNext').onclick = () => shiftPeriod(1);
  document.getElementById('btnNewEntry').onclick = () => entryModal();
  document.getElementById('btnRecurring').onclick = () => recurringModal();
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    Store.data.finance.entries = Store.data.finance.entries.filter(e => e.id !== b.dataset.del);
    Store.save(); App.render();
  });
  const year = FinPeriod.year;
  const months = Finance.monthList(year);
  const el = document.getElementById('finChart');
  if (el) App.chart(Charts.bar(el.getContext('2d'), months.map(m => new Date(m + '-01T12:00').toLocaleDateString('pt-BR', { month: 'short' })), [
    { label: 'Entradas', data: months.map(m => Finance.inMonth(m, 'income')), backgroundColor: 'rgba(95,211,154,.7)', borderRadius: 6 },
    { label: 'Saídas', data: months.map(m => Finance.inMonth(m, 'expense')), backgroundColor: 'rgba(242,123,123,.6)', borderRadius: 6 },
    { label: 'Saldo', data: months.map(m => Finance.inMonth(m, 'income') - Finance.inMonth(m, 'expense')), type: 'line', borderColor: '#a78bfa', backgroundColor: '#a78bfa', tension: .35, pointRadius: 3 }
  ]));
  const dn = document.getElementById('finDonut');
  const catMap = {};
  Store.data.finance.entries.forEach(e => {
    if (e.type === 'expense' && e.date.startsWith(String(year))) {
      const c = e.category || 'Outros';
      catMap[c] = (catMap[c] || 0) + Number(e.amount || 0);
    }
  });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  if (dn) App.chart(Charts.donut(dn.getContext('2d'), cats.map(c => c[0]), cats.map(c => c[1]),
    ['#a78bfa', '#7c5ce0', '#c4b5fd', '#5fd39a', '#f2c14e', '#7cc5f2', '#f27b7b', '#6f6a80'].slice(0, Math.max(3, cats.length))));
};
function shiftPeriod(d) {
  if (FinPeriod.mode === 'year') FinPeriod.year += d;
  else {
    const dt = new Date(FinPeriod.month + '-01T12:00');
    dt.setMonth(dt.getMonth() + d);
    FinPeriod.month = dt.toISOString().slice(0, 7);
  }
  App.render();
}

function entryModal(entry) {
  const isNew = !entry;
  entry = entry || { type: 'income', description: '', amount: '', category: '', clientId: '', method: 'PIX', date: todayISO(), forecast: false };
  const clients = Store.data.clients;
  const cats = ['Serviços', 'Consultoria', 'Assinaturas/Ferramentas', 'Hospedagem', 'Domínios', 'Educação', 'Impostos', 'Equipamento', 'Outros'];
  UI.modal({
    title: isNew ? 'Novo lançamento' : 'Editar lançamento',
    body: `<div class="pill-toggle" id="eType" style="margin-bottom:14px">
        <button data-t="income" class="${entry.type === 'income' ? 'active' : ''}">Entrada</button>
        <button data-t="expense" class="${entry.type === 'expense' ? 'active' : ''}">Saída</button>
      </div>
      <div class="form-grid">
        <label class="field full"><span>Descrição*</span><input type="text" id="eDesc" value="${esc(entry.description)}" placeholder="Ex.: Contrato Ana Paula — landing page"></label>
        <label class="field"><span>Valor (R$)*</span><input type="number" id="eAmount" step="0.01" value="${entry.amount || ''}"></label>
        <label class="field"><span>Data</span><input type="date" id="eDate" value="${entry.date}"></label>
        <label class="field"><span>Categoria</span><select id="eCat">${UI.selectOptions(cats, entry.category)}</select></label>
        <label class="field"><span>Forma de pagamento</span><select id="eMethod">${UI.selectOptions(Store.data.finance.methods, entry.method)}</select></label>
        <label class="field full"><span>Cliente (se entrada)</span>
          <select id="eClient"><option value="">— avulso —</option>${UI.selectOptions(clients, entry.clientId, 'id', x => x.name)}</select></label>
        <label class="checkline full" style="border:none"><div class="box ${entry.forecast ? 'done' : ''}" id="eForecast">${entry.forecast ? '✓' : ''}</div>
          <span>É previsão (ainda não caiu na conta)</span></label>
      </div>`,
    onMount(m, ov) {
      let type = entry.type;
      m.querySelectorAll('#eType button').forEach(b => b.onclick = () => {
        type = b.dataset.t;
        m.querySelectorAll('#eType button').forEach(x => x.classList.toggle('active', x === b));
      });
      m.querySelector('#eForecast').onclick = e => {
        const done = e.currentTarget.classList.toggle('done');
        e.currentTarget.textContent = done ? '✓' : '';
      };
      const foot = document.createElement('div');
      foot.className = 'modal-foot';
      foot.innerHTML = `<button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      m.appendChild(foot);
      foot.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      foot.querySelector('[data-s]').onclick = () => {
        const description = m.querySelector('#eDesc').value.trim();
        const amount = Number(m.querySelector('#eAmount').value);
        if (!description || !amount) return UI.toast('Preencha descrição e valor', true);
        const obj = {
          id: entry.id || uid(), type, description, amount,
          category: m.querySelector('#eCat').value, method: m.querySelector('#eMethod').value,
          date: m.querySelector('#eDate').value, clientId: m.querySelector('#eClient').value,
          forecast: m.querySelector('#eForecast').classList.contains('done'), recurringId: entry.recurringId
        };
        if (isNew) Store.data.finance.entries.push(obj); else Object.assign(entry, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Lançamento salvo ✓');
      };
    }
  });
}

function recurringModal() {
  const recs = Store.data.finance.recurring;
  UI.modal({
    title: 'Assinaturas e custos fixos mensais',
    lg: true,
    body: `<p class="muted" style="font-size:12px;margin-bottom:12px">Cada item é lançado automaticamente todo mês (você vê como “fixo” no financeiro). Ex.: Canva, HostGator, domínio, internet.</p>
      <div id="recList">${recs.length ? recs.map(r => `<div class="checkline" data-rec="${r.id}">
        <span style="flex:1"><b style="color:var(--text)">${esc(r.description)}</b>
        <small class="muted" style="display:block">${esc(r.category)} · vence dia ${r.day}</small></span>
        <b class="mono" style="color:${r.type === 'income' ? 'var(--good)' : 'var(--bad)'}">${fmtMoney(r.amount)}</b>
        <button class="del" data-del-rec="${r.id}">🗑</button></div>`).join('') : '<div class="empty">Nenhum custo fixo cadastrado</div>'}</div>
      <div class="form-grid" style="margin-top:14px;border-top:1px solid var(--border);padding-top:14px">
        <label class="field full"><span>Nome</span><input type="text" id="rDesc" placeholder="Ex.: Canva Pro"></label>
        <label class="field"><span>Valor mensal</span><input type="number" id="rAmount" step="0.01"></label>
        <label class="field"><span>Dia do mês</span><input type="number" id="rDay" min="1" max="28" value="5"></label>
        <label class="field"><span>Categoria</span><select id="rCat"><option>Assinaturas/Ferramentas</option><option>Hospedagem</option><option>Domínios</option><option>Outros</option></select></label>
        <label class="field"><span>Tipo</span><select id="rType"><option value="expense">Saída</option><option value="income">Entrada (renda fixa)</option></select></label>
      </div>`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn" data-a style="margin-right:auto">+ Adicionar</button><button class="btn ghost" data-c>Fechar</button>`;
      f.querySelector('[data-c]').onclick = () => { UI.closeModal(ov); App.render(); };
      f.querySelector('[data-a]').onclick = () => {
        const description = ov.querySelector('#rDesc').value.trim();
        const amount = Number(ov.querySelector('#rAmount').value);
        if (!description || !amount) return UI.toast('Preencha nome e valor', true);
        Store.data.finance.recurring.push({
          id: uid(), description, amount, type: ov.querySelector('#rType').value,
          category: ov.querySelector('#rCat').value, day: Number(ov.querySelector('#rDay').value) || 5
        });
        Store.save(); UI.closeModal(ov); recurringModal(); App.render();
      };
      ov.querySelectorAll('[data-del-rec]').forEach(b => b.onclick = () => {
        Store.data.finance.recurring = Store.data.finance.recurring.filter(r => r.id !== b.dataset.delRec);
        Store.save(); UI.closeModal(ov); recurringModal();
      });
    }
  });
}
