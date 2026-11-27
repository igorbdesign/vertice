/* ===== Vértice — UI helpers ===== */
const UI = {
  modal(opts) {
    let root = document.getElementById('modalRoot');
    if (!root) { root = document.createElement('div'); root.id = 'modalRoot'; document.body.appendChild(root); }
    const IN = 'box-sizing:border-box;margin:0;font-family:inherit;';
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,9,14,.72);z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px;';
    const md = document.createElement('div');
    md.className = 'modal' + (opts.lg ? ' lg' : '');
    md.style.cssText = IN + 'background:#1e1d26;color:#e8e6ef;border:1px solid #37344a;border-radius:16px;width:100%;max-width:' + (opts.lg ? '820' : '560') + 'px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,.35);overflow:hidden;';
    const head = document.createElement('div');
    head.className = 'modal-head';
    head.style.cssText = IN + 'display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #2c2a38;flex-shrink:0;';
    const h2 = document.createElement('h2');
    h2.textContent = opts.title || '';
    h2.style.cssText = IN + 'font-size:15px;font-weight:700;color:#e8e6ef;';
    const x = document.createElement('button');
    x.className = 'icon-btn'; x.setAttribute('data-close', ''); x.textContent = '✕';
    x.style.cssText = IN + 'background:transparent;border:none;color:#9b97ab;font-size:15px;cursor:pointer;padding:4px 8px;border-radius:8px;';
    x.onmouseenter = () => x.style.color = '#e8e6ef';
    x.onmouseleave = () => x.style.color = '#9b97ab';
    head.appendChild(h2); head.appendChild(x);
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.style.cssText = IN + 'padding:18px 20px;overflow-y:auto;font-size:13.5px;';
    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    foot.style.cssText = IN + 'padding:14px 20px;border-top:1px solid #2c2a38;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;';
    try { body.innerHTML = opts.body || ''; }
    catch (e) { body.innerHTML = '<p>Erro ao montar o conteúdo: ' + esc(e.message) + '</p>'; }
    md.appendChild(head); md.appendChild(body);
    if (opts.foot) md.appendChild(foot);
    ov.appendChild(md);
    root.appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov) UI.closeModal(ov); });
    x.onclick = () => UI.closeModal(ov);
    if (foot && opts.foot) {
      try { opts.foot(foot, ov); }
      catch (e) { console.error('Modal foot:', e); UI.toast('Erro nos botões do modal: ' + e.message, true); }
    }
    if (opts.onMount) {
      try { opts.onMount(ov, ov); }
      catch (e) { console.error('Modal onMount:', e); UI.toast('Erro ao abrir: ' + e.message, true); }
    }
    return ov;
  },
  closeModal(ov) { (ov || document.querySelector('.modal-overlay'))?.remove(); },
  toast(msg, isErr) {
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.textContent = msg;
    document.getElementById('toastRoot').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  },
  confirm(msg, onYes) {
    UI.modal({
      title: 'Confirmar',
      body: `<p style="font-size:13.5px">${esc(msg)}</p>`,
      foot(f, ov) {
        f.innerHTML = `<button class="btn ghost" data-c>Cancelar</button><button class="btn" data-y>Confirmar</button>`;
        f.querySelector('[data-c]').onclick = () => UI.closeModal(ov);
        f.querySelector('[data-y]').onclick = () => { UI.closeModal(ov); onYes(); };
      }
    });
  },
  copy(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      UI.toast('Copiado para a área de transferência ✓');
      if (btn) { const o = btn.textContent; btn.textContent = 'Copiado!'; setTimeout(() => btn.textContent = o, 1400); }
    }).catch(() => UI.toast('Não foi possível copiar', true));
  },
  download(filename, content, mime) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime || 'text/plain;charset=utf-8' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  selectOptions(list, selected, valueKey, labelFn) {
    return list.map(x => {
      const v = valueKey ? x[valueKey] : x;
      const l = labelFn ? labelFn(x) : x;
      return `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`;
    }).join('');
  },
  pageHead(title, actionsHtml) {
    return `<div class="toolbar"><h2 style="font-size:16px;font-weight:700">${esc(title)}</h2>
      <span class="spacer"></span>${actionsHtml || ''}</div>`;
  }
};
UI.version = 5;

/* ===== Charts (Chart.js wrapper) ===== */
const Charts = {
  applyDefaults() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.color = '#9d98ae';
    Chart.defaults.borderColor = 'rgba(120,115,140,.15)';
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.font.size = 11;
  },
  line(ctx, labels, datasets, opts = {}) {
    if (typeof Chart === 'undefined') return null;
    return new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } },
          tooltip: { backgroundColor: '#262433', borderColor: '#312e40', borderWidth: 1, padding: 10 } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + (v >= 1000 ? (v / 1000) + 'k' : v) } } },
        ...opts
      }
    });
  },
  bar(ctx, labels, datasets, opts = {}) {
    if (typeof Chart === 'undefined') return null;
    return new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } },
          tooltip: { backgroundColor: '#262433', borderColor: '#312e40', borderWidth: 1, padding: 10 } },
        scales: { y: { beginAtZero: true } },
        ...opts
      }
    });
  },
  donut(ctx, labels, data, colors) {
    if (typeof Chart === 'undefined') return null;
    return new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } }
      }
    });
  }
};

window.UI = UI; window.Charts = Charts;
