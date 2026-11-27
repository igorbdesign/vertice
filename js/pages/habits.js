/* ===== Vértice — Hábitos ===== */
window.Pages = window.Pages || {};
function habitStreak(h) {
  let s = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const key = d.toISOString().slice(0, 10);
    if (h.records && h.records[key]) { s++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); }
    else break;
  }
  return s;
}
Pages.habits = function () {
  const list = Store.data.habits;
  const today = todayISO();
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last7.push(d.toISOString().slice(0, 10));
  }
  return `
  <div class="toolbar"><span class="muted" style="font-size:13px">Marque hoje e acompanhe a sequência 🔥</span>
    <span class="spacer"></span><button class="btn" id="btnAddHabit">+ Novo hábito</button></div>
  ${list.length === 0 ? '<div class="empty">Ex.: postar no Instagram todos os dias, 30 min de estudo, beber 2L de água...</div>' :
  `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">
    ${list.map(h => {
      const streak = habitStreak(h);
      const total = Object.values(h.records || {}).filter(Boolean).length;
      return `<div class="card" data-id="${h.id}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <b style="flex:1;font-size:14px">${esc(h.name)}</b>
          <span class="badge purple">🔥 ${streak} dia(s)</span>
          <button class="icon-btn" data-edit-habit>✏️</button>
        </div>
        <div style="display:flex;gap:6px">
          ${last7.map(k => {
            const done = h.records && h.records[k];
            const dname = new Date(k + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'narrow' });
            return `<button data-habit-day="${k}" title="${fmtDate(k)}" style="flex:1;padding:9px 0;border-radius:9px;border:1px solid var(--border);
              background:${done ? 'var(--accent)' : 'transparent'};color:${done ? '#17141f' : 'var(--muted-2)'};font-weight:700;font-size:12px;cursor:pointer">
              ${dname}<br>${done ? '✓' : '·'}</button>`;
          }).join('')}
        </div>
        <div class="muted" style="font-size:11.5px;margin-top:10px">${total} marcação(ões) no total</div>
      </div>`;
    }).join('')}
  </div>`}`;
};
Pages.habits_after = function () {
  document.getElementById('btnAddHabit').onclick = () => habitModal();
  document.querySelectorAll('[data-edit-habit]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    habitModal(Store.data.habits.find(h => h.id === e.target.closest('.card').dataset.id));
  });
  document.querySelectorAll('[data-habit-day]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const card = e.target.closest('.card');
    const h = Store.data.habits.find(x => x.id === card.dataset.id);
    h.records = h.records || {};
    if (h.records[b.dataset.habitDay]) delete h.records[b.dataset.habitDay];
    else h.records[b.dataset.habitDay] = true;
    Store.save(); App.render();
  });
};
function habitModal(h) {
  const isNew = !h;
  h = h || { name: '', targetDays: 30 };
  UI.modal({
    title: isNew ? 'Novo hábito' : 'Editar hábito',
    body: `<div class="form-grid">
      <label class="field full"><span>Hábito*</span><input type="text" id="hName" value="${esc(h.name)}" placeholder="Ex.: postar 1 conteúdo por dia"></label>
      <label class="field"><span>Período para acompanhar (dias)</span><input type="number" id="hTarget" value="${h.targetDays || 30}"></label>
    </div>`,
    foot(f, ov) {
      f.innerHTML = `${!isNew ? '<button class="btn danger" data-d style="margin-right:auto">Excluir</button>' : ''}
        <button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      if (f.querySelector('[data-d]')) f.querySelector('[data-d]').onclick = () =>
        UI.confirm('Excluir este hábito?', () => {
          Store.data.habits = Store.data.habits.filter(x => x.id !== h.id);
          Store.save(); UI.closeModal(ov); App.render();
        });
      f.querySelector('[data-s]').onclick = () => {
        const name = ov.querySelector('#hName').value.trim();
        if (!name) return UI.toast('Informe o hábito', true);
        const obj = { id: h.id || uid(), name, targetDays: Number(ov.querySelector('#hTarget').value) || 30, records: h.records || {} };
        if (isNew) Store.data.habits.push(obj); else Object.assign(h, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Hábito salvo ✓');
      };
    }
  });
}
