/* ===== Vértice — UI helpers ===== */
const UI = {
  modal(opts) {
    const root = document.getElementById('modalRoot');
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    const md = document.createElement('div');
    md.className = 'modal' + (opts.lg ? ' lg' : '');
    try {
      const head = document.createElement('div');
      head.className = 'modal-head';
      const h2 = document.createElement('h2');
      h2.textContent = opts.title || '';
      const x = document.createElement('button');
      x.className = 'icon-btn'; x.setAttribute('data-close', ''); x.textContent = '✕';
      head.appendChild(h2); head.appendChild(x);
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerHTML = opts.body || '';
      md.appendChild(head); md.appendChild(body);
      if (opts.foot) { const f = document.createElement('div'); f.className = 'modal-foot'; md.appendChild(f); }
      ov.appendChild(md);
    } catch (e) {
      console.error('Modal body:', e);
      ov.innerHTML = `<div class="modal"><div class="modal-head"><h2>Erro</h2><button class="icon-btn" data-close>✕</button></div>
        <div class="modal-body"><p>Algo deu errado ao abrir esta janela: ${esc(e.message)}</p></div></div>`;
    }
    root.appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov) UI.closeModal(ov); });
    const xb = ov.querySelector('[data-close]');
    if (xb) xb.onclick = () => UI.closeModal(ov);
    const foot = ov.querySelector('.modal-foot');
    if (foot && opts.foot) {
      try { opts.foot(foot, ov); }
      catch (e) { console.error('Modal foot:', e); UI.toast('Erro nos botões do modal: ' + e.message, true); }
    }
    if (opts.onMount) {
      try { opts.onMount(ov, ov); }
      catch (e) { console.error('Modal onMount:', e); UI.toast('Erro ao abrir: ' + e.message, true); }
    }
    setTimeout(() => {
      if (!ov.isConnected) return;
      const b = ov.querySelector('.modal-body');
      if (b && !b.children.length && !b.textContent.trim()) {
        b.innerHTML = `<div style="padding:18px;text-align:center">
          <p style="font-weight:700;margin-bottom:8px">⚠️ Esta janela não conseguiu renderizar</p>
          <p style="font-size:12.5px;color:var(--muted)">Navegador: ${esc((navigator.userAgent || '').slice(0, 80))}<br>Versão do app: v${UI.version}<br>Recarregue com Ctrl+Shift+R. Se persistir, envie um print desta janela.</p>
          <button class="btn" style="margin-top:12px" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
        </div>`;
      }
    }, 1200);
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
