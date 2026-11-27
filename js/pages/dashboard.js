/* ===== Vértice — Dashboard ===== */
Pages = window.Pages || {};
Pages.dashboard = function () {
  const d = Store.data;
  const mk = todayISO().slice(0, 7);
  const income = Finance.inMonth(mk, 'income');
  const expense = Finance.inMonth(mk, 'expense');
  const balance = income - expense;
  const year = new Date().getFullYear();
  const yearIncome = Finance.inMonth(String(year), 'income');
  const overdue = Alerts.overdueCards().length;
  const openTasks = d.tasks.cards.filter(c => !/feito|conclu|done/i.test((d.tasks.columns.find(x => x.id === c.columnId) || {}).title || '')).length;
  const activeClients = d.clients.length;
  const goals = d.goals;
  const fc = d.finance.entries.filter(e => e.type === 'income' && e.forecast && e.date.slice(0, 7) === mk);

  const wk = d.habits.map(h => {
    const days = Object.keys(h.records || {}).filter(k => h.records[k]).length;
    return { name: h.name, pct: Math.min(100, Math.round(days / Math.max(1, h.targetDays || 30) * 100)) };
  });

  const upcoming = d.tasks.cards
    .filter(c => c.dueDate && !/feito|conclu|done/i.test((d.tasks.columns.find(x => x.id === c.columnId) || {}).title || ''))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);

  return `
  <div class="stat-row">
    <div class="stat hoverable"><span class="ico">💰</span>
      <div class="stat-label">Entradas do mês</div>
      <div class="stat-value" style="color:var(--good)">${fmtMoney(income)}</div>
      <div class="stat-extra">${fc.length ? fmtMoney(Finance.sum(fc)) + ' ainda previsto' : 'tudo confirmado'}</div>
      <div class="hover-pop"><b>Detalhe do mês</b>
        ${d.finance.entries.filter(e => e.type === 'income' && Finance.monthKey(e.date) === mk)
          .slice(0, 8).map(e => `<div class="hrow"><span>${esc(e.description || 'Receita')}</span><b>${fmtMoney(e.amount)}</b></div>`).join('') || '<div class="hrow">Sem entradas registradas</div>'}
      </div>
    </div>
    <div class="stat hoverable"><span class="ico">💸</span>
      <div class="stat-label">Saídas do mês</div>
      <div class="stat-value" style="color:var(--bad)">${fmtMoney(expense)}</div>
      <div class="stat-extra">${d.finance.recurring.length} assinatura(s)/custo fixo</div>
      <div class="hover-pop"><b>Para onde foi</b>
        ${catBreakdown(mk)}
      </div>
    </div>
    <div class="stat hoverable"><span class="ico">⚖️</span>
      <div class="stat-label">Saldo do mês</div>
      <div class="stat-value" style="color:${balance >= 0 ? 'var(--accent-soft)' : 'var(--bad)'}">${fmtMoney(balance)}</div>
      <div class="stat-extra">Ano ${year}: ${fmtMoney(yearIncome)} de entradas</div>
      <div class="hover-pop"><b>Ano ${year} mês a mês</b>
        ${Finance.monthList(year).map(m => {
          const i = Finance.inMonth(m, 'income'), o = Finance.inMonth(m, 'expense');
          return `<div class="hrow"><span>${new Date(m + '-01T12:00').toLocaleDateString('pt-BR', { month: 'short' })}</span><b style="color:${i - o >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmtMoney(i - o)}</b></div>`;
        }).join('')}
      </div>
    </div>
    <div class="stat"><span class="ico">👥</span>
      <div class="stat-label">Clientes ativos</div>
      <div class="stat-value">${activeClients}</div>
      <div class="stat-extra">${d.contracts.filter(c => c.status !== 'cancelado').length} contrato(s) registrado(s)</div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns:2fr 1fr;margin-top:14px">
    <div class="card">
      <h3>Entradas x Saídas — ${year}</h3>
      <div class="chart-box"><canvas id="dashChart"></canvas></div>
    </div>
    <div class="card">
      <h3>Tarefas</h3>
      ${overdue ? `<div class="chip" style="background:rgba(242,123,123,.14);color:var(--bad);margin-bottom:10px">🔴 ${overdue} atrasada(s)</div>` : ''}
      <div class="chip" style="margin-bottom:10px">▤ ${openTasks} em aberto</div>
      <h3 style="margin-top:16px">Próximos prazos</h3>
      ${upcoming.length ? upcoming.map(c => {
        const late = c.dueDate < todayISO();
        return `<div class="checkline" style="border:none;padding:5px 0">
          <span style="text-decoration:none;color:var(--text);font-size:12.5px;flex:1">${late ? '🔴 ' : '• '}${esc(c.title)}</span>
          <small class="muted">${fmtDate(c.dueDate)}</small></div>`;
      }).join('') : '<p class="muted" style="font-size:12.5px">Nada pendente 🎉</p>'}
    </div>
  </div>

  <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:14px">
    <div class="card">
      <h3>Metas em andamento</h3>
      ${goals.length ? goals.slice(0, 4).map(g => goalRow(g)).join('') : '<div class="empty">Defina sua primeira meta em Metas →</div>'}
    </div>
    <div class="card">
      <h3>Hábitos — consistência</h3>
      ${wk.length ? wk.map(h => `<div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px"><span>${esc(h.name)}</span><span class="muted">${h.pct}%</span></div>
          <div class="progress green"><div style="width:${h.pct}%"></div></div></div>`).join('')
        : '<div class="empty">Cadastre hábitos para acompanhar →</div>'}
    </div>
  </div>

  <div class="section-title">Prospecção — negócios mais precisando de você</div>
  <div class="card">
    ${topLeads()}
  </div>`;
};

function catBreakdown(mk) {
  const map = {};
  Store.data.finance.entries.forEach(e => {
    if (e.type === 'expense' && Finance.monthKey(e.date) === mk) {
      const c = e.category || 'Outros';
      map[c] = (map[c] || 0) + Number(e.amount || 0);
    }
  });
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return rows.length ? rows.map(([c, v]) => `<div class="hrow"><span>${esc(c)}</span><b>${fmtMoney(v)}</b></div>`).join('')
    : '<div class="hrow">Sem saídas registradas</div>';
}

function goalRow(g) {
  const pct = GoalPct(g);
  return `<div style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
      <span>${esc(g.title)} <span class="muted">· ${fmtDate(g.deadline)}</span></span>
      <span class="muted mono">${GoalLabel(g)}</span></div>
    <div class="progress"><div style="width:${pct}%"></div></div></div>`;
}

function topLeads() {
  const leads = [...Store.data.prospection.leads].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
  if (!leads.length) return `<div class="empty">Nenhum lead ainda — use <b>Prospecção</b> para auditar negócios da sua cidade</div>`;
  return leads.map(l => `<div class="checkline" style="border-bottom:1px solid var(--border-soft)">
    <div class="score-ring ${scoreClass(l.score)}">${l.score ?? '—'}</div>
    <span style="flex:1"><b style="color:var(--text)">${esc(l.name)}</b>
      <small class="muted" style="display:block">${esc(l.niche)} · ${esc(l.city)} · ${esc(stageOf(l))}</small></span>
  </div>`).join('');
}
function scoreClass(s) { return s >= 60 ? 'score-high' : s >= 30 ? 'score-mid' : 'score-low'; }
function stageOf(l) {
  const st = Store.data.prospection.stages.find(s => s.id === l.stage);
  return st ? st.title.replace(/^\S+\s/, '') : '';
}

Pages.dashboard_after = function (root) {
  const year = new Date().getFullYear();
  const labels = Finance.monthList(year).map(m => new Date(m + '-01T12:00').toLocaleDateString('pt-BR', { month: 'short' }));
  const inc = Finance.monthList(year).map(m => Finance.inMonth(m, 'income'));
  const exp = Finance.monthList(year).map(m => Finance.inMonth(m, 'expense'));
  const el = document.getElementById('dashChart');
  if (el) App.chart(Charts.bar(el.getContext('2d'), labels, [
    { label: 'Entradas', data: inc, backgroundColor: 'rgba(95,211,154,.7)', borderRadius: 6 },
    { label: 'Saídas', data: exp, backgroundColor: 'rgba(167,139,250,.65)', borderRadius: 6 }
  ], { scales: { y: { beginAtZero: true, ticks: { callback: v => 'R$' + (v >= 1000 ? (v / 1000) + 'k' : v) } } } }));
};
