/* ===== Vértice — Projetos pessoais ===== */
window.Pages = window.Pages || {};
const PRJ_STATUS = ['💡 Ideia', '🚧 Em desenvolvimento', '⏸️ Pausado', '✅ Concluído', '🚀 Lançado'];
Pages.projects = function () {
  const list = Store.data.projects;
  return `
  <div class="toolbar"><span class="muted" style="font-size:13px">Seus projetos autorais — com checklist próprio de evolução.</span>
    <span class="spacer"></span><button class="btn" id="btnAddProject">+ Novo projeto</button></div>
  ${list.length === 0 ? '<div class="empty">Ex.: seu portfólio, um template vendável, um jogo, um canal no YouTube...</div>' :
  `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
    ${list.map(p => {
      const pct = p.steps && p.steps.length ? Math.round(p.steps.filter(s => s.done).length / p.steps.length * 100) : 0;
      return `<div class="card" data-id="${p.id}" style="cursor:pointer">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <b style="font-size:14px;flex:1">${esc(p.name)}</b>
          <span class="badge purple" style="white-space:nowrap">${esc(p.status)}</span>
        </div>
        <p class="muted" style="font-size:12px;margin:8px 0;min-height:30px">${esc(p.description || '')}</p>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:8px">
          <span class="muted" style="font-size:11.5px">${p.steps ? p.steps.filter(s => s.done).length + '/' + p.steps.length + ' etapas' : ''}</span>
          ${p.link ? `<a href="${esc(p.link)}" target="_blank" style="font-size:11.5px">🔗 abrir</a>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`}`;
};
Pages.projects_after = function () {
  document.getElementById('btnAddProject').onclick = () => prjModal();
  document.querySelectorAll('.card[data-id]').forEach(el => el.onclick = () => prjModal(Store.data.projects.find(p => p.id === el.dataset.id)));
};
function prjModal(p) {
  const isNew = !p;
  p = p || { name: '', description: '', status: PRJ_STATUS[0], link: '', steps: [], deadline: '' };
  UI.modal({
    title: isNew ? 'Novo projeto' : 'Editar projeto', lg: true,
    body: `<div class="form-grid">
      <label class="field full"><span>Nome*</span><input type="text" id="pName" value="${esc(p.name)}"></label>
      <label class="field full"><span>Descrição</span><textarea id="pDesc" style="min-height:60px">${esc(p.description)}</textarea></label>
      <label class="field"><span>Status</span><select id="pStatus">${UI.selectOptions(PRJ_STATUS, p.status)}</select></label>
      <label class="field"><span>Prazo</span><input type="date" id="pDeadline" value="${p.deadline || ''}"></label>
      <label class="field full"><span>Link</span><input type="url" id="pLink" value="${esc(p.link)}" placeholder="github, figma, site..."></label>
    </div>
    <b style="font-size:12.5px;display:block;margin:14px 0 6px">Etapas do projeto</b>
    <div id="prjSteps">${(p.steps || []).map((s, i) => `<div class="checkline"><div class="box ${s.done ? 'done' : ''}" data-sd="${i}">${s.done ? '✓' : ''}</div>
      <input type="text" data-st="${i}" value="${esc(s.text)}" style="background:transparent;border:none"><button class="del" data-sx="${i}">🗑</button></div>`).join('')}</div>
    <button class="btn ghost small" id="btnAddPrjStep">+ Etapa</button>`,
    foot(f, ov) {
      f.innerHTML = `${!isNew ? '<button class="btn danger" data-d style="margin-right:auto">Excluir</button>' : ''}
        <button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      if (f.querySelector('[data-d]')) f.querySelector('[data-d]').onclick = () =>
        UI.confirm('Excluir este projeto?', () => {
          Store.data.projects = Store.data.projects.filter(x => x.id !== p.id);
          Store.save(); UI.closeModal(ov); App.render();
        });
      f.querySelector('[data-s]').onclick = () => {
        const name = ov.querySelector('#pName').value.trim();
        if (!name) return UI.toast('Informe o nome', true);
        const steps = [...ov.querySelectorAll('[data-st]')].map((inp, i) => ({
          text: inp.value.trim(), done: inp.closest('.checkline').querySelector('[data-sd]').classList.contains('done')
        })).filter(s => s.text);
        const obj = { id: p.id || uid(), name, description: ov.querySelector('#pDesc').value.trim(),
          status: ov.querySelector('#pStatus').value, link: ov.querySelector('#pLink').value.trim(),
          deadline: ov.querySelector('#pDeadline').value, steps };
        if (isNew) Store.data.projects.push(obj); else Object.assign(p, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Projeto salvo ✓');
      };
      ov.querySelector('#btnAddPrjStep').onclick = () => {
        const list = ov.querySelector('#prjSteps');
        const i = list.querySelectorAll('.checkline').length;
        const div = document.createElement('div');
        div.className = 'checkline';
        div.innerHTML = `<div class="box" data-sd="${i}"></div><input type="text" data-st="${i}" placeholder="Descreva a etapa" style="background:transparent;border:none"><button class="del" data-sx="${i}">🗑</button>`;
        list.appendChild(div);
        bindPrj(ov);
      };
      bindPrj(ov);
      function bindPrj(scope) {
        scope.querySelectorAll('[data-sd]').forEach(b => b.onclick = () => {
          const done = b.classList.toggle('done'); b.textContent = done ? '✓' : '';
        });
        scope.querySelectorAll('[data-sx]').forEach(b => b.onclick = () => b.closest('.checkline').remove());
      }
    }
  });
}
