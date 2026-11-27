/* ===== Vértice — Tipos de serviços ===== */
window.Pages = window.Pages || {};
const SERVICE_ICONS = { 'Social Media': '📱', 'Landing Page': '🚀', 'Site': '🌐', 'Página': '📄', 'Identidade': '🎨', 'Outro': '✦' };
function svcIcon(name) {
  for (const k in SERVICE_ICONS) if (name.toLowerCase().includes(k.toLowerCase())) return SERVICE_ICONS[k];
  return '✦';
}
Pages.services = function () {
  const list = Store.data.services;
  return `
  <div class="toolbar"><span class="muted" style="font-size:13px">Catálogo do que você presta — usado nos contratos, financeiro e propostas.</span>
    <span class="spacer"></span><button class="btn" id="btnAddSvc">+ Novo serviço</button></div>
  ${list.length === 0 ? '<div class="empty">Cadastre seus serviços: post criativo, landing page, site institucional, página de captura, página de obrigado...</div>' :
    `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
    ${list.map(s => `<div class="card svc-card" data-id="${s.id}" style="cursor:pointer">
      <div style="font-size:22px;margin-bottom:8px">${svcIcon(s.name)}</div>
      <b style="font-size:14px">${esc(s.name)}</b>
      <p class="muted" style="font-size:12px;margin:6px 0 10px;min-height:32px">${esc(s.description || '')}</p>
      <span class="badge purple">a partir de ${fmtMoney(s.basePrice)}</span>
      ${s.delivery ? `<span class="badge">⏱ ${esc(s.delivery)}</span>` : ''}
    </div>`).join('')}
  </div>`}`;
};
Pages.services_after = function () {
  document.getElementById('btnAddSvc').onclick = () => svcModal();
  document.querySelectorAll('.svc-card').forEach(el => el.onclick = () => svcModal(Store.data.services.find(s => s.id === el.dataset.id)));
};
function svcModal(s) {
  const isNew = !s;
  s = s || { name: '', description: '', basePrice: '', delivery: '', includes: '' };
  UI.modal({
    title: isNew ? 'Novo serviço' : 'Editar serviço',
    body: `<div class="form-grid">
      <label class="field full"><span>Nome do serviço*</span>
        <input type="text" id="sName" placeholder="Ex.: Post criativo para social media" value="${esc(s.name)}"></label>
      <label class="field full"><span>Descrição</span>
        <textarea id="sDesc" style="min-height:60px" placeholder="O que está incluso...">${esc(s.description)}</textarea></label>
      <label class="field"><span>Preço base (R$)</span><input type="number" id="sPrice" value="${esc(s.basePrice)}"></label>
      <label class="field"><span>Prazo típico</span><input type="text" id="sDelivery" placeholder="Ex.: 3 dias úteis" value="${esc(s.delivery)}"></label>
      <label class="field full"><span>Escopo incluso (itens separados por vírgula)</span>
        <input type="text" id="sIncludes" placeholder="2 artes, texto, 1 revisão" value="${esc(s.includes)}"></label>
    </div>`,
    foot(f, ov) {
      f.innerHTML = `${!isNew ? '<button class="btn danger" data-d style="margin-right:auto">Excluir</button>' : ''}
        <button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      if (f.querySelector('[data-d]')) f.querySelector('[data-d]').onclick = () =>
        UI.confirm('Excluir este serviço?', () => {
          Store.data.services = Store.data.services.filter(x => x.id !== s.id);
          Store.save(); UI.closeModal(ov); App.render();
        });
      f.querySelector('[data-s]').onclick = () => {
        const name = ov.querySelector('#sName').value.trim();
        if (!name) return UI.toast('Informe o nome do serviço', true);
        const obj = { id: s.id || uid(), name, description: ov.querySelector('#sDesc').value.trim(),
          basePrice: Number(ov.querySelector('#sPrice').value) || 0, delivery: ov.querySelector('#sDelivery').value.trim(),
          includes: ov.querySelector('#sIncludes').value.trim() };
        if (isNew) Store.data.services.push(obj); else Object.assign(s, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Serviço salvo ✓');
      };
    }
  });
}
