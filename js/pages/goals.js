/* ===== Vértice — Metas (flexíveis: numérica, checklist ou por data) ===== */
window.Pages = window.Pages || {};
function GoalPct(g) {
  if (g.type === 'checklist') {
    const t = (g.steps || []).length;
    return t ? Math.round((g.steps.filter(s => s.done).length / t) * 100) : 0;
  }
  return g.target ? Math.min(100, Math.round(((g.progress || 0) / g.target) * 100)) : 0;
}
function GoalLabel(g) {
  if (g.type === 'checklist') {
    const t = (g.steps || []).length;
    return `${(g.steps || []).filter(s => s.done).length}/${t} etapas`;
  }
  return `${g.progress || 0} de ${g.target} ${g.unit || ''}`;
}
function goalDaysLeft(g) {
  if (!g.deadline) return null;
  const d = daysBetween(todayISO(), g.deadline);
  return d;
}

Pages.goals = function () {
  const list = Store.data.goals;
  return `
  <div class="toolbar">
    <span class="muted" style="font-size:13px">Metas numéricas, de etapas ou de aprendizado com prazo — você escolhe os campos.</span>
    <span class="spacer"></span><button class="btn" id="btnAddGoal">+ Nova meta</button>
  </div>
  ${list.length === 0 ? '<div class="empty">Ex.: “Aprender Figma avançado até 30/06”, “Faturar R$ 5.000/mês”, “Fechar 3 clientes novos”...</div>' :
  `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
    ${list.map(g => {
      const pct = GoalPct(g); const dl = goalDaysLeft(g);
      return `<div class="card goal-card" data-id="${g.id}" style="cursor:pointer">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <b style="font-size:14.5px;flex:1">${esc(g.title)}</b>
          <span class="badge ${g.type === 'checklist' ? 'blue' : 'purple'}">${g.type === 'checklist' ? 'etapas' : g.type === 'date' ? '📅' : 'nº'}</span>
        </div>
        ${g.description ? `<p class="muted" style="font-size:12px;margin:6px 0">${esc(g.description)}</p>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:12px;margin:10px 0 6px">
          <span class="mono">${GoalLabel(g)}</span>
          <span class="muted">${dl !== null ? (dl >= 0 ? '⏳ ' + dl + ' dia(s) restantes' : '⚠️ ' + Math.abs(dl) + ' dia(s) de atraso') : 'sem prazo'}</span>
        </div>
        <div class="progress ${pct >= 100 ? 'green' : ''}"><div style="width:${pct}%"></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
          <span class="badge ${pct >= 100 ? 'green' : ''}">${pct}%</span>
          ${g.type === 'numeric' ? `<button class="btn ghost small" data-plus>+ 1 ${esc(g.unit || '')}</button>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`}`;
};
Pages.goals_after = function () {
  document.getElementById('btnAddGoal').onclick = () => goalModal();
  document.querySelectorAll('.goal-card').forEach(el => el.onclick = e => {
    if (e.target.closest('[data-plus]')) return;
    goalModal(Store.data.goals.find(g => g.id === el.dataset.id));
  });
  document.querySelectorAll('[data-plus]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const id = e.target.closest('.goal-card').dataset.id;
    const g = Store.data.goals.find(x => x.id === id);
    g.progress = (g.progress || 0) + 1;
    Store.save(); App.render();
  });
};
function goalModal(g) {
  const isNew = !g;
  g = g || { type: 'numeric', title: '', description: '', target: '', unit: '', progress: 0, steps: [], deadline: '' };
  UI.modal({
    title: isNew ? 'Nova meta' : 'Editar meta',
    body: `<label class="field full" style="margin-bottom:12px"><span>Tipo de meta</span>
      <div class="pill-toggle" id="gType">
        <button data-t="numeric" class="${g.type === 'numeric' ? 'active' : ''}">Contador</button>
        <button data-t="checklist" class="${g.type === 'checklist' ? 'active' : ''}">Por etapas</button>
        <button data-t="date" class="${g.type === 'date' ? 'active' : ''}">Aprender até data</button>
      </div></label>
      <div class="form-grid">
        <label class="field full"><span>Qual é a meta?*</span>
          <input type="text" id="gTitle" value="${esc(g.title)}" placeholder="Ex.: Aprender motion design no After Effects"></label>
        <label class="field full"><span>Descrição / por quê</span>
          <textarea id="gDesc" style="min-height:55px">${esc(g.description)}</textarea></label>
        <div data-num-fields style="display:contents">
          <label class="field"><span>Quantidade alvo</span><input type="number" id="gTarget" value="${esc(g.target)}"></label>
          <label class="field"><span>Unidade (você escolhe)</span><input type="text" id="gUnit" value="${esc(g.unit)}" placeholder="clientes, R$, cursos, livros..."></label>
        </div>
        <label class="field"><span>Prazo (até quando)</span><input type="date" id="gDeadline" value="${g.deadline || ''}"></label>
        <label class="field"><span>Progresso atual</span><input type="number" id="gProgress" value="${esc(g.progress)}"></label>
      </div>
      <div data-steps style="margin-top:12px">
        <b style="font-size:12.5px">Etapas / marcos</b>
        <p class="muted" style="font-size:11.5px;margin:4px 0 8px">Quebre a meta em passos (ex.: ver curso X, praticar 3 animações, montar 1 reel mostrando o resultado).</p>
        <div id="stepList">${(g.steps || []).map((s, i) => `<div class="checkline"><div class="box ${s.done ? 'done' : ''}" data-step-done="${i}">${s.done ? '✓' : ''}</div>
          <input type="text" data-step-text="${i}" value="${esc(s.text)}" style="background:transparent;border:none;padding:2px"><button class="del" data-step-del="${i}">🗑</button></div>`).join('')}</div>
        <button class="btn ghost small" id="btnAddStep" style="margin-top:8px">+ Adicionar etapa</button>
      </div>`,
    lg: true,
    onMount(m, ov) {
      let type = g.type;
      function refreshType() {
        m.querySelector('[data-num-fields]').style.display = type === 'checklist' ? 'none' : 'contents';
        m.querySelector('[data-steps]').style.display = type === 'numeric' ? 'none' : 'block';
        m.querySelector('[data-steps]').style.display = type === 'checklist' || type === 'date' ? 'block' : 'none';
      }
      m.querySelectorAll('#gType button').forEach(b => b.onclick = () => {
        type = b.dataset.t;
        m.querySelectorAll('#gType button').forEach(x => x.classList.toggle('active', x === b));
        refreshType();
      });
      refreshType();
      let steps = JSON.parse(JSON.stringify(g.steps || []));
      function addStep() {
        const stepList = m.querySelector('#stepList');
        const i = stepList.querySelectorAll('.checkline').length;
        const div = document.createElement('div');
        div.className = 'checkline';
        div.innerHTML = `<div class="box" data-step-done="${i}"></div>
          <input type="text" data-step-text="${i}" placeholder="Descreva a etapa" style="background:transparent;border:none;padding:2px">
          <button class="del" data-step-del="${i}">🗑</button>`;
        stepList.appendChild(div);
        bindSteps();
      }
      function bindSteps() {
        m.querySelectorAll('[data-step-done]').forEach(b => b.onclick = () => {
          const done = b.classList.toggle('done');
          b.textContent = done ? '✓' : '';
        });
        m.querySelectorAll('[data-step-del]').forEach(b => b.onclick = () => b.closest('.checkline').remove());
      }
      bindSteps();
      m.querySelector('#btnAddStep').onclick = addStep;
      const foot = document.createElement('div');
      foot.className = 'modal-foot';
      foot.innerHTML = `${!isNew ? '<button class="btn danger" data-d style="margin-right:auto">Excluir</button>' : ''}
        <button class="btn ghost" data-c>Cancelar</button><button class="btn" data-s>Salvar</button>`;
      m.appendChild(foot);
      foot.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
      if (foot.querySelector('[data-d]')) foot.querySelector('[data-d]').onclick = () =>
        UI.confirm('Excluir esta meta?', () => {
          Store.data.goals = Store.data.goals.filter(x => x.id !== g.id);
          Store.save(); UI.closeModal(ov); App.render();
        });
      foot.querySelector('[data-s]').onclick = () => {
        const title = m.querySelector('#gTitle').value.trim();
        if (!title) return UI.toast('Dê um título à meta', true);
        const stepsArr = [...m.querySelectorAll('[data-step-text]')].map((inp, i) => ({
          text: inp.value.trim(), done: inp.closest('.checkline').querySelector('[data-step-done]').classList.contains('done')
        })).filter(s => s.text);
        let st = type;
        if (type === 'date') st = (stepsArr.length || m.querySelector('#gTarget').value) ? 'date' : 'date';
        const obj = {
          id: g.id || uid(), type: st, title,
          description: m.querySelector('#gDesc').value.trim(),
          target: Number(m.querySelector('#gTarget').value) || 0,
          unit: m.querySelector('#gUnit').value.trim(),
          progress: Number(m.querySelector('#gProgress').value) || 0,
          steps: stepsArr, deadline: m.querySelector('#gDeadline').value,
          createdAt: g.createdAt || todayISO()
        };
        if (st === 'date' && !obj.target) obj.type = 'checklist';
        if (isNew) Store.data.goals.push(obj); else Object.assign(g, obj);
        Store.save(); UI.closeModal(ov); App.render(); UI.toast('Meta salva ✓');
      };
    }
  });
}
