/* ===== Vértice — Clientes ===== */
window.Pages = window.Pages || {};
Pages.clients = function () {
  const list = Store.data.clients;
  return `
  <div class="toolbar">
    <input type="text" id="cliSearch" placeholder="Buscar cliente..." style="max-width:260px">
    <span class="spacer"></span>
    <button class="btn" id="btnAddClient">+ Novo cliente</button>
  </div>
  ${list.length === 0 ? '<div class="empty">Nenhum cliente ainda. Clique em “Novo cliente” para começar.</div>' : `
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(270px,1fr))">
    ${list.map(c => {
      const total = Finance.sum(Store.data.finance.entries.filter(e => e.clientId === c.id && e.type === 'income'));
      const contracts = Store.data.contracts.filter(x => x.clientId === c.id).length;
      return `<div class="card cli-card" data-id="${c.id}" style="cursor:pointer">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
          <div style="width:42px;height:42px;border-radius:12px;background:var(--accent-dim);color:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">${esc(String(c.name || '?').trim()[0] || '?').toUpperCase()}</div>
          <div style="min-width:0">
            <b style="font-size:14px">${esc(c.name)}</b>
            <div class="muted" style="font-size:11.5px">${esc(c.company || c.niche || '')} ${c.city ? '· ' + esc(c.city) : ''}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <span class="badge purple">${fmtMoney(total)} faturado</span>
          ${contracts ? `<span class="badge">${contracts} contrato(s)</span>` : ''}
          ${c.phone ? `<span class="badge">📞 ${esc(c.phone)}</span>` : ''}
        </div>
        <div class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.email || '')}</div>
      </div>`;
    }).join('')}
  </div>`}
  <div class="section-title">Perfil do profissional</div>
  <div class="card" style="max-width:620px">
    <div class="form-grid">
      <label class="field"><span>Seu nome</span><input type="text" id="pName" value="${esc(Store.data.profile.name)}"></label>
      <label class="field"><span>Nome comercial / marca</span><input type="text" id="pBusiness" value="${esc(Store.data.profile.business)}"></label>
      <label class="field"><span>CPF/CNPJ</span><input type="text" id="pDoc" value="${esc(Store.data.profile.doc || '')}"></label>
      <label class="field"><span>Endereço completo</span><input type="text" id="pAddr" value="${esc(Store.data.profile.address || '')}"></label>
      <label class="field"><span>Cidade (usada em contratos e prospecção)</span><input type="text" id="pCity" value="${esc(Store.data.profile.city)}"></label>
      <label class="field"><span>E-mail</span><input type="text" id="pEmail" value="${esc(Store.data.profile.email)}"></label>
    </div>
    <button class="btn small" style="margin-top:14px" id="btnSaveProfile">Salvar perfil</button>
  </div>`;
};

Pages.clients_after = function () {
  const search = document.getElementById('cliSearch');
  if (search) search.oninput = () => {
    const q = search.value.toLowerCase();
    document.querySelectorAll('.cli-card').forEach(el => {
      const c = Store.data.clients.find(x => x.id === el.dataset.id);
      el.style.display = c && (c.name + ' ' + (c.company || '') + ' ' + (c.city || '')).toLowerCase().includes(q) ? '' : 'none';
    });
  };
  document.getElementById('btnAddClient').onclick = () => clientModal();
  document.querySelectorAll('.cli-card').forEach(el => el.onclick = () => clientModal(Store.data.clients.find(c => c.id === el.dataset.id)));
  document.getElementById('btnSaveProfile').onclick = () => {
    const p = Store.data.profile;
    p.name = val('pName'); p.business = val('pBusiness'); p.doc = val('pDoc');
    p.address = val('pAddr'); p.city = val('pCity'); p.email = val('pEmail');
    Store.save(); UI.toast('Perfil salvo ✓');
  };
};
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

function clientModal(c) {
  const isNew = !c;
  c = c || { name: '', company: '', email: '', phone: '', city: '', niche: '', address: '', doc: '', notes: '' };
  UI.modal({
    title: isNew ? 'Novo cliente' : 'Editar cliente',
    body: `<div class="form-grid">
      <label class="field"><span>Nome*</span><input type="text" id="cName" value="${esc(c.name)}"></label>
      <label class="field"><span>Empresa</span><input type="text" id="cCompany" value="${esc(c.company)}"></label>
      <label class="field"><span>E-mail</span><input type="email" id="cEmail" value="${esc(c.email)}"></label>
      <label class="field"><span>WhatsApp / telefone</span><input type="tel" id="cPhone" value="${esc(c.phone)}"></label>
      <label class="field"><span>Cidade</span><input type="text" id="cCity" value="${esc(c.city)}"></label>
      <label class="field"><span>Nicho</span><input type="text" id="cNiche" value="${esc(c.niche)}"></label>
      <label class="field"><span>CPF/CNPJ</span><input type="text" id="cDoc" value="${esc(c.doc)}"></label>
      <label class="field"><span>Endereço</span><input type="text" id="cAddr" value="${esc(c.address)}"></label>
      <label class="field full"><span>Observações</span><textarea id="cNotes" style="min-height:60px">${esc(c.notes)}</textarea></label>
    </div>`,
    foot(f, ov) {
      f.innerHTML = `${!isNew ? '<button class="btn danger" data-d style="margin-right:auto">Excluir</button>' : ''}
        <button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      if (f.querySelector('[data-d]')) f.querySelector('[data-d]').onclick = () =>
        UI.confirm('Excluir este cliente?', () => {
          Store.data.clients = Store.data.clients.filter(x => x.id !== c.id);
          Store.save(); UI.closeModal(ov); App.render();
        });
      f.querySelector('[data-s]').onclick = () => {
        const name = ov.querySelector('#cName').value.trim();
        if (!name) return UI.toast('Informe o nome', true);
        const obj = {
          id: c.id || uid(), name,
          company: ov.querySelector('#cCompany').value.trim(),
          email: ov.querySelector('#cEmail').value.trim(),
          phone: ov.querySelector('#cPhone').value.trim(),
          city: ov.querySelector('#cCity').value.trim(),
          niche: ov.querySelector('#cNiche').value.trim(),
          doc: ov.querySelector('#cDoc').value.trim(),
          address: ov.querySelector('#cAddr').value.trim(),
          notes: ov.querySelector('#cNotes').value.trim(),
          createdAt: c.createdAt || todayISO()
        };
        if (isNew) Store.data.clients.push(obj);
        else Object.assign(c, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Cliente salvo ✓');
      };
    }
  });
}
