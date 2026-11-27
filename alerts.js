/* ===== Vértice — alertas (tarefas atrasadas e avisos configuráveis) ===== */
const Alerts = {
  rules() { return Store.data.settings.alertRules; },

  overdueCards() {
    const today = todayISO();
    const doneColIds = Store.data.tasks.columns
      .filter(c => /feito|conclu|pronto|done/i.test(c.title))
      .map(c => c.id);
    return Store.data.tasks.cards.filter(c =>
      c.dueDate && c.dueDate < today && !doneColIds.includes(c.columnId));
  },

  list() {
    const out = [];
    const rules = this.rules();
    if (rules.tasksOverdue?.enabled) {
      const every = Math.max(1, Number(rules.tasksOverdue.everyDays) || 1);
      const read = Store.data.settings.alertRead || [];
      this.overdueCards().forEach(c => {
        const late = daysBetween(c.dueDate, todayISO());
        const key = 'task:' + c.id + ':' + c.dueDate;
        const lastRead = read.find(r => r.key === key);
        const show = !lastRead || daysBetween(lastRead.at, todayISO()) >= every;
        if (show) {
          out.push({
            id: key, ico: '🔴', title: esc(c.title),
            text: `Atrasada há ${late} dia(s) — prazo era ${fmtDate(c.dueDate)}`,
            action: 'tasks'
          });
        }
      });
    }
    const m = todayISO().slice(0, 7);
    const fc = Store.data.finance.entries.filter(e => e.type === 'income' && e.forecast && e.date.slice(0, 7) === m);
    if (fc.length) {
      out.push({
        id: 'forecast-' + m, ico: '💰',
        title: `${fc.length} recebimento(s) previsto(s) este mês`,
        text: 'Total previsto: ' + fmtMoney(Finance.sum(fc)) + ' — confirme quando entrar',
        action: 'finance'
      });
    }
    const today = todayISO();
    Store.data.events.filter(e => e.date === today).forEach(e => {
      out.push({ id: 'ev-' + e.id, ico: '📅', title: 'Hoje: ' + esc(e.title), text: e.time || '', action: 'calendar' });
    });
    Store.data.tasks.cards.filter(c => c.dueDate === today &&
      !/feito|conclu|done/i.test((Store.data.tasks.columns.find(x => x.id === c.columnId) || {}).title || '')).forEach(c => {
      out.push({ id: 'due-' + c.id, ico: '⏳', title: 'Vence hoje: ' + esc(c.title), text: '', action: 'tasks' });
    });
    return out;
  },

  dismiss(key) {
    const read = Store.data.settings.alertRead = Store.data.settings.alertRead || [];
    const k = key.split(':')[1];
    read.push({ key, at: todayISO() });
    if (read.length > 60) read.splice(0, read.length - 60);
    Store.save();
    Alerts.renderDropdown();
    App.updateAlertBadge();
  },

  renderDropdown() {
    const dd = document.getElementById('alertDropdown');
    const items = this.list();
    const rules = this.rules();
    dd.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px 10px">
        <b style="font-size:13px">Avisos</b>
        <button class="btn ghost small" id="alertCfg">Configurar</button>
      </div>
      ${items.length === 0 ? '<div class="empty" style="margin:6px">Tudo em dia ✨</div>' :
        items.map(i => `<div class="alert-item" data-nav="${i.action}"><span class="a-ico">${i.ico}</span>
          <div style="flex:1"><b>${i.title}</b><small>${i.text || ''}</small></div>
          ${i.id.startsWith('task:') ? `<button class="icon-btn" data-dismiss="${esc(i.id)}" title="Silenciar (reavisa a cada ${rules.tasksOverdue?.everyDays || 1} dia(s))">✕</button>` : ''}
        </div>`).join('')}`;
    dd.querySelectorAll('[data-dismiss]').forEach(b => b.onclick = () => Alerts.dismiss(b.dataset.dismiss));
    dd.querySelector('#alertCfg').onclick = () => Alerts.configModal();
  },

  configModal() {
    const rules = this.rules();
    const r = rules.tasksOverdue || { enabled: true, everyDays: 2 };
    UI.modal({
      title: 'Configuração de avisos',
      body: `
        <label class="checkline" style="border:none">
          <div class="box ${r.enabled ? 'done' : ''}" id="cfgEnabled" style="${r.enabled ? 'background:var(--accent);border-color:var(--accent)' : ''}">${r.enabled ? '✓' : ''}</div>
          <span>Me avisar quando uma tarefa ficar atrasada</span>
        </label>
        <label class="field" style="margin-top:14px"><span>Repetir o aviso a cada quantos dias?</span>
          <input type="number" id="cfgEvery" min="1" max="30" value="${r.everyDays}">
          <span style="font-size:11px;color:var(--muted-2)">Ex.: 2 = avisa hoje e reaparece de 2 em 2 dias até você resolver. Ao fechar um aviso (✕), ele silencia e volta nesse intervalo.</span>
        </label>
        <label class="field" style="margin-top:14px"><span>Regras adicionais (opcional)</span>
          <input type="text" id="cfgCustom" placeholder="Ex.: me avisar quando o saldo do mês for negativo" disabled style="opacity:.5">
        </label>`,
      foot(f, ov) {
        f.innerHTML = `<button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
        f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
        f.querySelector('[data-s]').onclick = () => {
          const every = Math.max(1, Number(ov.querySelector('#cfgEvery').value) || 1);
          Store.data.settings.alertRules = {
            tasksOverdue: { enabled: ov.querySelector('#cfgEnabled').classList.contains('done'), everyDays: every }
          };
          Store.save();
          UI.closeModal(ov); Alerts.renderDropdown(); App.updateAlertBadge();
          UI.toast('Avisos atualizados ✓');
        };
        ov.querySelector('#cfgEnabled').onclick = e => {
          const done = e.target.classList.toggle('done');
          e.target.textContent = done ? '✓' : '';
          e.target.style.background = done ? 'var(--accent)' : 'transparent';
          e.target.style.borderColor = done ? 'var(--accent)' : '';
        };
      }
    });
  }
};

window.Alerts = Alerts;
