/* ===== Vértice — Tarefas (Kanban estilo Notion/Trello) ===== */
window.Pages = window.Pages || {};
Pages.tasks = function () {
  const t = Store.data.tasks;
  const cols = [...t.columns].sort((a, b) => a.order - b.order);
  const today = todayISO();
  const doneIds = cols.filter(c => /feito|conclu|done/i.test(c.title)).map(c => c.id);
  const overdue = t.cards.filter(c => c.dueDate && c.dueDate < today && !doneIds.includes(c.columnId)).length;
  return `
  <div class="toolbar">
    <span class="muted" style="font-size:13px">Arraste cards entre colunas · clique no card para detalhes · checklist direto no card</span>
    <span class="spacer"></span>
    ${overdue ? `<button class="btn danger small" id="btnSeeOverdue">🔴 ${overdue} atrasada(s)</button>` : ''}
    <button class="btn ghost" id="btnAddCol">+ Coluna</button>
  </div>
  <div class="kanban" id="kanban">
    ${cols.map(col => {
      const cards = t.cards.filter(c => c.columnId === col.id).sort((a, b) => (a.order || 0) - (b.order || 0));
      const doneCount = cards.filter(c => (c.checklist || []).length && c.checklist.every(x => x.done)).length;
      return `<div class="kcol" data-col="${col.id}" data-order="${col.order}">
        <div class="kcol-head" style="${col.image ? `background-image:linear-gradient(rgba(20,19,24,.55),rgba(20,19,24,.55)),url(${esc(col.image)})` : ''}">
          ${col.image ? `<img class="col-img" src="${esc(col.image)}" alt="">` : ''}
          <span class="col-title"><span class="dot" style="background:${col.color}"></span>${esc(col.title)}</span>
          <span class="col-count">${cards.length}</span>
          <span class="spacer" style="flex:1"></span>
          <button class="icon-btn" data-col-menu="${col.id}" title="Opções da coluna" style="width:26px;height:26px">⋯</button>
        </div>
        <div class="kcol-body" data-drop="${col.id}">
          ${cards.map(c => cardHtml(c, col)).join('') || '<div style="text-align:center;color:var(--muted-2);font-size:11.5px;padding:12px 0">Arraste cards para cá</div>'}
        </div>
        <div class="kcol-foot"><button data-add-card="${col.id}">+ Novo card</button></div>
      </div>`;
    }).join('')}
  </div>`;
};

function cardHtml(c, col) {
  const today = todayISO();
  const doneIds = Store.data.tasks.columns.filter(x => /feito|conclu|done/i.test(x.title)).map(x => x.id);
  const isDone = doneIds.includes(c.columnId);
  const late = c.dueDate && c.dueDate < today && !isDone;
  const startsSoon = c.startDate && c.startDate > today && !isDone;
  const cl = c.checklist || [];
  const clDone = cl.filter(x => x.done).length;
  return `<div class="kcard ${late ? 'overdue' : ''}" draggable="true" data-card="${c.id}" data-col="${col.id}"
      ${c.color ? `style="border-left-color:${c.color}"` : ''}>
    <div class="k-title">${late ? '🔴 ' : ''}${startsSoon ? '🕐 ' : ''}${esc(c.title)}</div>
    ${c.desc ? `<div class="muted" style="font-size:11.5px;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(c.desc)}</div>` : ''}
    ${cl.length ? `<div style="margin-top:7px">
      <div class="muted" style="font-size:10.5px;margin-bottom:3px">☐ ${clDone}/${cl.length}</div>
      ${cl.slice(0, 4).map((it, i) => `<div class="kcheck ${it.done ? 'done' : ''}" data-toggle="${c.id}|${i}">
        <span class="box">${it.done ? '✓' : ''}</span><span class="kcheck-text">${esc(it.text)}</span></div>`).join('')}
      ${cl.length > 4 ? `<div class="muted" style="font-size:10.5px">+${cl.length - 4} item(ns)...</div>` : ''}
    </div>` : ''}
    <div class="k-dates">
      ${c.startDate ? `<span>▶ ${fmtDate(c.startDate)}</span>` : ''}
      ${c.dueDate ? `<span class="${late ? 'due-late' : ''}">⏰ ${fmtDate(c.dueDate)}</span>` : ''}
    </div>
    <div class="k-meta">${c.clientId ? `<span class="badge">👤 ${esc(Finance.clientName(c.clientId))}</span>` : ''}</div>
  </div>`;
}

Pages.tasks_after = function () {
  bindCards();
  bindColumns();
  document.getElementById('btnAddCol').onclick = () => {
    const t = Store.data.tasks;
    t.columns.push({ id: uid(), title: 'Nova coluna', color: '#a78bfa', image: '', order: t.columns.length });
    Store.save(); App.render();
  };
  const over = document.getElementById('btnSeeOverdue');
  if (over) over.onclick = () => {
    const today = todayISO();
    const doneIds = Store.data.tasks.columns.filter(c => /feito|conclu|done/i.test(c.title)).map(c => c.id);
    const list = Store.data.tasks.cards.filter(c => c.dueDate && c.dueDate < today && !doneIds.includes(c.columnId));
    UI.modal({
      title: 'Tarefas atrasadas', body: list.map(c => `<div class="checkline" style="border-bottom:1px solid var(--border-soft)">
        <span style="text-decoration:none;color:var(--text)">🔴 ${esc(c.title)}</span>
        <small class="muted">${fmtDate(c.dueDate)} · ${Math.abs(daysBetween(c.dueDate, today))} dia(s)</small></div>`).join('')
    });
  };
};

function bindCards() {
  document.querySelectorAll('.kcard').forEach(el => {
    const card = Store.data.tasks.cards.find(c => c.id === el.dataset.card);
    el.ondragstart = e => { e.dataTransfer.setData('card', card.id); el.classList.add('dragging'); };
    el.ondragend = () => el.classList.remove('dragging');
    el.onclick = e => {
      const tg = e.target.closest('[data-toggle]');
      if (tg) {
        const [cid, idx] = tg.dataset.toggle.split('|');
        const c = Store.data.tasks.cards.find(x => x.id === cid);
        c.checklist[Number(idx)].done = !c.checklist[Number(idx)].done;
        Store.save(); App.render();
        return;
      }
      cardModal(card);
    };
  });
  document.querySelectorAll('[data-drop]').forEach(zone => {
    zone.ondragover = e => { e.preventDefault(); zone.closest('.kcol').classList.add('drag-over'); };
    zone.ondragleave = () => zone.closest('.kcol').classList.remove('drag-over');
    zone.ondrop = e => {
      e.preventDefault();
      zone.closest('.kcol').classList.remove('drag-over');
      const id = e.dataTransfer.getData('card');
      if (!id) return;
      const card = Store.data.tasks.cards.find(c => c.id === id);
      card.columnId = zone.dataset.drop;
      Store.save(); App.render();
      const col = Store.data.tasks.columns.find(c => c.id === card.columnId);
      if (/feito|conclu|done/i.test(col.title)) UI.toast('Boa! Tarefa concluída 🎉');
    };
  });
  document.querySelectorAll('[data-add-card]').forEach(b => b.onclick = () => {
    const t = Store.data.tasks;
    t.cards.push({ id: uid(), title: 'Nova tarefa', desc: '', columnId: b.dataset.addCard, color: '',
      startDate: '', dueDate: '', checklist: [], order: Date.now(), clientId: '' });
    Store.save(); App.render();
    const created = t.cards[t.cards.length - 1];
    setTimeout(() => cardModal(created), 60);
  });
}

function bindColumns() {
  document.querySelectorAll('.kcol').forEach(colEl => {
    const head = colEl.querySelector('.kcol-head');
    head.draggable = true;
    head.addEventListener('dragstart', e => {
      e.dataTransfer.setData('colOrder', colEl.dataset.col);
      head.style.opacity = .5;
    });
    head.addEventListener('dragend', () => head.style.opacity = 1);
    colEl.ondragover = e => { e.preventDefault(); };
    colEl.ondrop = e => {
      const dragged = e.dataTransfer.getData('colOrder');
      if (!dragged) return;
      e.preventDefault();
      const t = Store.data.tasks;
      const from = t.columns.find(c => c.id === dragged);
      const toEl = colEl;
      const to = t.columns.find(c => c.id === toEl.dataset.col);
      if (!from || !to || from.id === to.id) return;
      const fromOrder = from.order; from.order = to.order; to.order = fromOrder;
      Store.save(); App.render();
    };
  });
  document.querySelectorAll('[data-col-menu]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    columnMenu(b.dataset.colMenu, b);
  });
}

function columnMenu(colId, anchor) {
  const t = Store.data.tasks;
  const col = t.columns.find(c => c.id === colId);
  ddClose();
  const dd = document.createElement('div');
  dd.className = 'alert-dropdown';
  dd.id = 'colDD';
  dd.style.cssText = 'position:absolute;z-index:80;';
  const rect = anchor.getBoundingClientRect();
  dd.style.top = (rect.bottom + 4) + 'px';
  dd.style.left = Math.min(rect.left, window.innerWidth - 350) + 'px';
  dd.innerHTML = `
    <div style="padding:6px 8px"><b style="font-size:13px">Coluna: ${esc(col.title)}</b></div>
    <label class="field" style="padding:6px 8px"><span>Nome</span><input type="text" id="colName" value="${esc(col.title)}"></label>
    <label class="field" style="padding:6px 8px"><span>Cor</span><input type="color" id="colColor" value="${col.color}" style="height:36px;padding:4px"></label>
    <div class="field" style="padding:6px 8px"><span>Imagem do título</span>
      <div class="img-pick">
        ${col.image ? `<img src="${esc(col.image)}">` : ''}
        <input type="url" id="colImgUrl" placeholder="URL da imagem" value="${col.image.startsWith('data:') ? '' : esc(col.image)}" style="flex:1">
        <label class="btn ghost small" style="white-space:nowrap">Arquivo<input type="file" id="colImgFile" accept="image/*" hidden></label>
      </div></div>
    <div style="display:flex;gap:8px;padding:8px">
      <button class="btn small" id="colSave" style="flex:1">Salvar</button>
      <button class="btn danger small" id="colDel">Excluir</button>
    </div>`;
  document.body.appendChild(dd);
  const file = dd.querySelector('#colImgFile');
  file.onchange = () => {
    const f = file.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { dd.querySelector('#colImgUrl').value = r.result; dd.querySelector('.img-pick img')?.remove();
      dd.querySelector('.img-pick').insertAdjacentHTML('afterbegin', `<img src="${r.result}">`); };
    r.readAsDataURL(f);
  };
  dd.querySelector('#colSave').onclick = () => {
    col.title = dd.querySelector('#colName').value.trim() || col.title;
    col.color = dd.querySelector('#colColor').value;
    col.image = dd.querySelector('#colImgUrl').value.trim();
    Store.save(); ddClose(); App.render();
  };
  dd.querySelector('#colDel').onclick = () => {
    const count = Store.data.tasks.cards.filter(c => c.columnId === colId).length;
    UI.confirm(count ? `Esta coluna tem ${count} card(s). Excluir tudo mesmo assim?` : 'Excluir esta coluna?', () => {
      Store.data.tasks.columns = Store.data.tasks.columns.filter(c => c.id !== colId);
      Store.data.tasks.cards = Store.data.tasks.cards.filter(c => c.columnId !== colId);
      Store.save(); ddClose(); App.render();
    });
  };
  setTimeout(() => document.addEventListener('mousedown', colDDCloser), 10);
}
function colDDCloser(e) { if (!e.target.closest('#colDD')) ddClose(); }
function ddClose() { document.getElementById('colDD')?.remove(); document.removeEventListener('mousedown', colDDCloser); }

function cardModal(card) {
  const clients = Store.data.clients;
  const cols = Store.data.tasks.columns;
  UI.modal({
    title: 'Detalhes da tarefa', lg: true,
    body: `<div class="form-grid">
      <label class="field full"><span>Título</span><input type="text" id="kTitle" value="${esc(card.title)}"></label>
      <label class="field"><span>Coluna</span><select id="kCol">${UI.selectOptions(cols, card.columnId, 'id', c => c.title)}</select></label>
      <label class="field"><span>Cor do card</span><input type="color" id="kColor" value="${card.color || '#a78bfa'}" style="height:36px;padding:4px"></label>
      <label class="field"><span>Início</span><input type="date" id="kStart" value="${card.startDate || ''}"></label>
      <label class="field"><span>Prazo / término</span><input type="date" id="kDue" value="${card.dueDate || ''}"></label>
      <label class="field full"><span>Cliente / projeto</span>
        <select id="kClient"><option value="">— nenhum —</option>${UI.selectOptions(clients, card.clientId, 'id', c => c.name)}</select></label>
      <label class="field full"><span>Descrição / informações extra</span>
        <textarea id="kDesc" style="min-height:90px" placeholder="Briefing, links de referência, acessos, decisões...">${esc(card.desc || '')}</textarea></label>
    </div>
    <b style="font-size:12.5px;display:block;margin:16px 0 8px">Checklist</b>
    <div id="kChecks">${(card.checklist || []).map((it, i) => `<div class="checkline">
      <div class="box ${it.done ? 'done' : ''}" data-k-done="${i}">${it.done ? '✓' : ''}</div>
      <input type="text" data-k-text="${i}" value="${esc(it.text)}" style="background:transparent;border:none">
      <button class="del" data-k-del="${i}">🗑</button></div>`).join('')}</div>
    <button class="btn ghost small" id="btnKAdd">+ Item de checklist</button>`,
    foot(f, ov) {
      f.innerHTML = `<button class="btn danger" data-d style="margin-right:auto">Excluir</button>
        <button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      f.querySelector('[data-d]').onclick = () => UI.confirm('Excluir esta tarefa?', () => {
        Store.data.tasks.cards = Store.data.tasks.cards.filter(c => c.id !== card.id);
        Store.save(); UI.closeModal(ov); App.render();
      });
      f.querySelector('[data-s]').onclick = () => {
        const checks = [...ov.querySelectorAll('[data-k-text]')].map((inp, i) => ({
          text: inp.value.trim(), done: inp.closest('.checkline').querySelector('[data-k-done]').classList.contains('done')
        })).filter(x => x.text);
        Object.assign(card, {
          title: ov.querySelector('#kTitle').value.trim() || card.title,
          columnId: ov.querySelector('#kCol').value,
          color: ov.querySelector('#kColor').value,
          startDate: ov.querySelector('#kStart').value,
          dueDate: ov.querySelector('#kDue').value,
          clientId: ov.querySelector('#kClient').value,
          desc: ov.querySelector('#kDesc').value.trim(),
          checklist: checks
        });
        Store.save(); UI.closeModal(ov); App.render(); App.updateAlertBadge();
      };
      ov.querySelector('#btnKAdd').onclick = () => {
        const list = ov.querySelector('#kChecks');
        const i = list.querySelectorAll('.checkline').length;
        list.insertAdjacentHTML('beforeend', `<div class="checkline">
          <div class="box" data-k-done="${i}"></div>
          <input type="text" data-k-text="${i}" placeholder="O que precisa ser feito?" style="background:transparent;border:none">
          <button class="del" data-k-del="${i}">🗑</button></div>`);
        bindK(ov);
      };
      bindK(ov);
      function bindK(scope) {
        scope.querySelectorAll('[data-k-done]').forEach(b => b.onclick = () => {
          const done = b.classList.toggle('done'); b.textContent = done ? '✓' : '';
        });
        scope.querySelectorAll('[data-k-del]').forEach(b => b.onclick = () => b.closest('.checkline').remove());
      }
    }
  });
}
