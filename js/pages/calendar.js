/* ===== Vértice — Calendário ===== */
window.Pages = window.Pages || {};
let CalRef = { y: new Date().getFullYear(), m: new Date().getMonth() };

Pages.calendar = function () {
  const first = new Date(CalRef.y, CalRef.m, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const today = todayISO();
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const other = d.getMonth() !== CalRef.m;
    const events = Store.data.events.filter(e => e.date === iso);
    const tasksDue = Store.data.tasks.cards.filter(c => c.dueDate === iso);
    const moments = Store.data.moments.filter(m => m.date === iso);
    cells += `<div class="cal-day ${other ? 'other' : ''} ${iso === today ? 'today' : ''}" data-date="${iso}">
      <div class="d-num">${d.getDate()}</div>
      ${events.slice(0, 3).map(e => `<div class="cal-event" title="${esc(e.title)}">${e.time ? e.time + ' ' : ''}${esc(e.title)}</div>`).join('')}
      ${tasksDue.slice(0, 2).map(t => `<div class="cal-event task" title="Tarefa: ${esc(t.title)}">⏰ ${esc(t.title)}</div>`).join('')}
      ${moments.slice(0, 2).map(m => `<div class="cal-event moment" title="Momento: ${esc(m.title)}">✨ ${esc(m.title)}</div>`).join('')}
      ${events.length + tasksDue.length + moments.length > 3 ? `<div class="muted" style="font-size:10px">+${events.length + tasksDue.length + moments.length - 3}</div>` : ''}
    </div>`;
  }
  const monthName = new Date(CalRef.y, CalRef.m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return `
  <div class="toolbar">
    <button class="btn ghost small" id="calPrev">‹</button>
    <b style="text-transform:capitalize;font-size:15px">${monthName}</b>
    <button class="btn ghost small" id="calNext">›</button>
    <button class="btn ghost small" id="calToday">Hoje</button>
    <span class="spacer"></span>
    <span class="chip"><span class="dot" style="background:var(--accent)"></span> evento</span>
    <span class="chip"><span class="dot" style="background:var(--warn)"></span> prazo</span>
    <span class="chip"><span class="dot" style="background:var(--info)"></span> momento</span>
  </div>
  <div class="cal-grid">
    ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => `<div class="cal-dow">${d}</div>`).join('')}
    ${cells}
  </div>`;
};
Pages.calendar_after = function () {
  document.getElementById('calPrev').onclick = () => { CalRef.m--; if (CalRef.m < 0) { CalRef.m = 11; CalRef.y--; } App.render(); };
  document.getElementById('calNext').onclick = () => { CalRef.m++; if (CalRef.m > 11) { CalRef.m = 0; CalRef.y++; } App.render(); };
  document.getElementById('calToday').onclick = () => {
    const n = new Date(); CalRef = { y: n.getFullYear(), m: n.getMonth() }; App.render();
  };
  document.querySelectorAll('.cal-day').forEach(el => el.onclick = () => eventModal(null, el.dataset.date));
};
function eventModal(ev, presetDate) {
  const isNew = !ev;
  ev = ev || { date: presetDate || todayISO(), title: '', time: '', desc: '', color: 'purple' };
  const dayEvents = Store.data.events.filter(e => e.date === ev.date);
  UI.modal({
    title: fmtDate(ev.date),
    body: `${dayEvents.filter(e => e.id !== ev.id).length ? `<b style="font-size:12px">Outros eventos do dia</b>
      ${dayEvents.filter(e => e.id !== ev.id).map(e => `<div class="checkline" style="border-bottom:1px solid var(--border-soft)">
        <span style="text-decoration:none;color:var(--text)">${esc(e.time || '')} ${esc(e.title)}</span>
        <button class="del" data-open-ev="${e.id}">✏️</button></div>`).join('')}
      <hr style="border-color:var(--border);margin:12px 0">` : ''}
    <div class="form-grid">
      <label class="field full"><span>Evento*</span><input type="text" id="evTitle" value="${esc(ev.title)}" placeholder="Ex.: reunião de alinhamento"></label>
      <label class="field"><span>Hora</span><input type="time" id="evTime" value="${esc(ev.time)}"></label>
      <label class="field"><span>Data</span><input type="date" id="evDate" value="${ev.date}"></label>
      <label class="field full"><span>Detalhes</span><textarea id="evDesc" style="min-height:55px">${esc(ev.desc)}</textarea></label>
    </div>`,
    foot(f, ov) {
      f.innerHTML = `${!isNew ? '<button class="btn danger" data-d style="margin-right:auto">Excluir</button>' : ''}
        <button class="btn ghost" data-c>Fechar</button><button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      if (f.querySelector('[data-d]')) f.querySelector('[data-d]').onclick = () => {
        Store.data.events = Store.data.events.filter(e => e.id !== ev.id);
        Store.save(); UI.closeModal(ov); App.render();
      };
      f.querySelector('[data-s]').onclick = () => {
        const title = ov.querySelector('#evTitle').value.trim();
        if (!title) return UI.toast('Informe o evento', true);
        const obj = { id: ev.id || uid(), date: ov.querySelector('#evDate').value, title,
          time: ov.querySelector('#evTime').value, desc: ov.querySelector('#evDesc').value.trim() };
        if (isNew) Store.data.events.push(obj); else Object.assign(ev, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Evento salvo ✓');
      };
      ov.querySelectorAll('[data-open-ev]').forEach(b => b.onclick = () => {
        UI.closeModal(ov);
        eventModal(Store.data.events.find(e => e.id === b.dataset.openEv));
      });
    }
  });
}
