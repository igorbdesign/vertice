/* ===== Vértice — UI helpers ===== */
const UI = {
  modal(opts) {
    const root = document.getElementById('modalRoot');
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = `<div class="modal ${opts.lg ? 'lg' : ''}">
      <div class="modal-head"><h2>${esc(opts.title || '')}</h2>
        <button class="icon-btn" data-close>✕</button></div>
      <div class="modal-body">${opts.body || ''}</div>
      ${opts.foot === false ? '' : `<div class="modal-foot"></div>`}
    </div>`;
    root.appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov) UI.closeModal(ov); });
    ov.querySelector('[data-close]').onclick = () => UI.closeModal(ov);
    const foot = ov.querySelector('.modal-foot');
    if (foot && opts.foot) opts.foot(foot, ov);
    if (opts.onMount) opts.onMount(ov);
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
