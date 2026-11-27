/* ===== Vértice — Wishlist ===== */
window.Pages = window.Pages || {};
const WL_STATUS = ['Sonho', 'Pesquisando', 'Juntando dinheiro', 'Comprado'];
const WL_PRIO = { alta: 'red', média: 'yellow', baixa: 'blue' };
Pages.wishlist = function () {
  const list = [...Store.data.wishlist].sort((a, b) =>
    (a.status === 'Comprado') - (b.status === 'Comprado') ||
    ({ alta: 0, média: 1, baixa: 2 })[a.priority] - ({ alta: 0, média: 1, baixa: 2 })[b.priority]);
  const total = list.filter(w => w.status !== 'Comprado').reduce((s, w) => s + Number(w.price || 0), 0);
  return `
  <div class="toolbar"><span class="badge purple">Faltam ${fmtMoney(total)} para realizar todos os desejos</span>
    <span class="spacer"></span><button class="btn" id="btnAddWish">+ Novo desejo</button></div>
  ${list.length === 0 ? '<div class="empty">Aquela placa de vídeo, monitor novo, curso,viagem... anote tudo aqui com preço e prioridade.</div>' :
  `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">
    ${list.map(w => `<div class="card" data-id="${w.id}" style="cursor:pointer;${w.status === 'Comprado' ? 'opacity:.6' : ''}">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
        <b style="font-size:14px;flex:1">${w.status === 'Comprado' ? '✅ ' : ''}${esc(w.name)}</b>
        <span class="badge ${WL_PRIO[w.priority] || ''}">${esc(w.priority)}</span>
      </div>
      <div class="mono" style="font-size:17px;font-weight:800;margin:10px 0;color:var(--accent-soft)">${fmtMoney(w.price)}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <span class="badge ${w.status === 'Comprado' ? 'green' : ''}">${esc(w.status)}</span>
        ${w.link ? `<a href="${esc(w.link)}" target="_blank" class="badge" style="text-decoration:none">🔗 link</a>` : ''}
      </div>
      ${w.notes ? `<p class="muted" style="font-size:12px;margin-top:8px">${esc(w.notes)}</p>` : ''}
    </div>`).join('')}
  </div>`}`;
};
Pages.wishlist_after = function () {
  document.getElementById('btnAddWish').onclick = () => wishModal();
  document.querySelectorAll('.card[data-id]').forEach(el => el.onclick = () => wishModal(Store.data.wishlist.find(w => w.id === el.dataset.id)));
};
function wishModal(w) {
  const isNew = !w;
  w = w || { name: '', price: '', priority: 'média', status: 'Sonho', link: '', notes: '' };
  UI.modal({
    title: isNew ? 'Novo desejo' : 'Editar desejo',
    body: `<div class="form-grid">
      <label class="field full"><span>O que é?*</span><input type="text" id="wName" value="${esc(w.name)}"></label>
      <label class="field"><span>Preço (R$)</span><input type="number" id="wPrice" step="0.01" value="${esc(w.price)}"></label>
      <label class="field"><span>Prioridade</span><select id="wPrio">${UI.selectOptions(['alta', 'média', 'baixa'], w.priority)}</select></label>
      <label class="field"><span>Status</span><select id="wStatus">${UI.selectOptions(WL_STATUS, w.status)}</select></label>
      <label class="field"><span>Link (loja, referência)</span><input type="url" id="wLink" value="${esc(w.link)}"></label>
      <label class="field full"><span>Notas</span><textarea id="wNotes" style="min-height:55px">${esc(w.notes)}</textarea></label>
    </div>`,
    foot(f, ov) {
      f.innerHTML = `${!isNew ? '<button class="btn danger" data-d style="margin-right:auto">Excluir</button>' : ''}
        <button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      if (f.querySelector('[data-d]')) f.querySelector('[data-d]').onclick = () =>
        UI.confirm('Excluir este item?', () => {
          Store.data.wishlist = Store.data.wishlist.filter(x => x.id !== w.id);
          Store.save(); UI.closeModal(ov); App.render();
        });
      f.querySelector('[data-s]').onclick = () => {
        const name = ov.querySelector('#wName').value.trim();
        if (!name) return UI.toast('Informe o item', true);
        const obj = { id: w.id || uid(), name, price: Number(ov.querySelector('#wPrice').value) || 0,
          priority: ov.querySelector('#wPrio').value, status: ov.querySelector('#wStatus').value,
          link: ov.querySelector('#wLink').value.trim(), notes: ov.querySelector('#wNotes').value.trim() };
        if (isNew) Store.data.wishlist.push(obj); else Object.assign(w, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Salvo ✓');
      };
    }
  });
}
