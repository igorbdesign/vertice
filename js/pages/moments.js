/* ===== Vértice — Momentos importantes ===== */
window.Pages = window.Pages || {};
const MOODS = { '🏆': 'Conquista', '💜': 'Gratidão', '😮': 'Marco', '😢': 'Desafio', '🔥': 'Ponto alto', '💡': 'Aprendizado' };
Pages.moments = function () {
  const list = [...Store.data.moments].sort((a, b) => b.date.localeCompare(a.date));
  return `
  <div class="toolbar"><span class="muted" style="font-size:13px">Sua linha do tempo — o que merece ser lembrado.</span>
    <span class="spacer"></span><button class="btn" id="btnAddMoment">+ Registrar momento</button></div>
  ${list.length === 0 ? '<div class="empty">Primeiro cliente fechado, primeiro R$ 1.000, aquela elogiação do cliente... registre aqui.</div>' :
  `<div style="position:relative;max-width:680px;margin:0 auto;padding-left:26px">
    <div style="position:absolute;left:8px;top:6px;bottom:6px;width:2px;background:var(--border);border-radius:2px"></div>
    ${list.map(m => `<div style="position:relative;margin-bottom:20px">
      <span style="position:absolute;left:-26px;top:16px;font-size:17px">${m.mood || '✨'}</span>
      <div class="card">
        <div style="display:flex;justify-content:space-between;gap:10px">
          <b style="font-size:14px">${esc(m.title)}</b>
          <span class="muted" style="font-size:11.5px;white-space:nowrap">${fmtDate(m.date)}</span>
        </div>
        <p style="font-size:13px;margin-top:8px;color:#cdc9da;white-space:pre-wrap">${esc(m.text)}</p>
        <button class="btn ghost small" data-edit-moment="${m.id}" style="margin-top:10px">Editar</button>
      </div>
    </div>`).join('')}
  </div>`}`;
};
Pages.moments_after = function () {
  document.getElementById('btnAddMoment').onclick = () => momentModal();
  document.querySelectorAll('[data-edit-moment]').forEach(b => b.onclick = () =>
    momentModal(Store.data.moments.find(m => m.id === b.dataset.editMoment)));
};
function momentModal(m) {
  const isNew = !m;
  m = m || { date: todayISO(), title: '', text: '', mood: '✨' };
  UI.modal({
    title: isNew ? 'Registrar momento' : 'Editar momento',
    body: `<div class="form-grid">
      <label class="field"><span>Data</span><input type="date" id="mDate" value="${m.date}"></label>
      <label class="field"><span>Como foi?</span><select id="mMood">${Object.entries(MOODS).map(([k, v]) =>
        `<option value="${k}" ${m.mood === k ? 'selected' : ''}>${k} ${v}</option>`).join('')}</select></label>
      <label class="field full"><span>Título*</span><input type="text" id="mTitle" value="${esc(m.title)}"></label>
      <label class="field full"><span>O que aconteceu</span><textarea id="mText" style="min-height:100px">${esc(m.text)}</textarea></label>
    </div>`,
    foot(f, ov) {
      f.innerHTML = `${!isNew ? '<button class="btn danger" data-d style="margin-right:auto">Excluir</button>' : ''}
        <button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      if (f.querySelector('[data-d]')) f.querySelector('[data-d]').onclick = () =>
        UI.confirm('Excluir este momento?', () => {
          Store.data.moments = Store.data.moments.filter(x => x.id !== m.id);
          Store.save(); UI.closeModal(ov); App.render();
        });
      f.querySelector('[data-s]').onclick = () => {
        const title = ov.querySelector('#mTitle').value.trim();
        if (!title) return UI.toast('Dê um título', true);
        const obj = { id: m.id || uid(), date: ov.querySelector('#mDate').value, title,
          mood: ov.querySelector('#mMood').value, text: ov.querySelector('#mText').value };
        if (isNew) Store.data.moments.push(obj); else Object.assign(m, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Momento registrado ✨');
      };
    }
  });
}
