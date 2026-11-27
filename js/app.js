/* ===== Vértice — app / router ===== */
const App = {
  current: 'dashboard',
  charts: [],
  go(id) {
    this.current = id;
    const def = NAV_DEFS.find(n => n.id === id);
    document.getElementById('pageTitle').textContent = def ? def.label : 'Vértice';
    Sidebar.render();
    this.render();
    document.getElementById('pageRoot').scrollTop = 0;
  },
  render() {
    this.charts.forEach(c => { try { c.destroy(); } catch (e) {} });
    this.charts = [];
    const root = document.getElementById('pageRoot');
    const fn = Pages[this.current];
    root.innerHTML = fn ? fn() : '<div class="empty">Módulo não encontrado.</div>';
    if (fn && Pages[this.current + '_after']) Pages[this.current + '_after'](root);
  },
  chart(ch) { this.charts.push(ch); return ch; },
  updateAlertBadge() {
    const n = Alerts.list().length;
    const b = document.getElementById('alertBadge');
    b.hidden = n === 0;
    b.textContent = n;
  },
  init() {
    Store.load();
    Charts.applyDefaults();
    window.addEventListener('error', e => {
      if (e && e.message) UI.toast('Erro: ' + e.message, true);
    });
    Sidebar.render();
    document.getElementById('todayLabel').textContent =
      new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    document.getElementById('btnCollapseSidebar').onclick = () => {
      Store.data.settings.sidebarCollapsed = !Store.data.settings.sidebarCollapsed;
      Store.save(); Sidebar.render();
    };
    document.getElementById('btnToggleSidebar').onclick = () =>
      document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('btnReorderMode').onclick = () => {
      const on = !document.getElementById('navList').classList.contains('reordering');
      Sidebar.toggleReorder(on);
    };
    const bell = document.getElementById('btnAlerts'), dd = document.getElementById('alertDropdown');
    bell.onclick = e => {
      e.stopPropagation();
      dd.hidden = !dd.hidden;
      if (!dd.hidden) Alerts.renderDropdown();
    };
    document.addEventListener('click', e => {
      if (!dd.hidden && !dd.contains(e.target) && e.target !== bell) dd.hidden = true;
    });
    dd.addEventListener('click', e => {
      if (e.target.closest('[data-dismiss]') || e.target.closest('#alertCfg')) return;
      const item = e.target.closest('.alert-item');
      if (item && item.dataset.nav) { dd.hidden = true; App.go(item.dataset.nav); }
    });
    this.updateAlertBadge();
    const vEl = document.getElementById('appVersion');
    if (vEl) vEl.textContent = 'Vértice v' + (window.UI ? UI.version : '?');
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') UI.closeModal();
    });
    this.go('dashboard');
  }
};
window.addEventListener('DOMContentLoaded', () => App.init());
