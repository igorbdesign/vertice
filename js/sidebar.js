/* ===== Vértice — definição do menu ===== */
const NAV_DEFS = [
  { id: 'dashboard', label: 'Dashboard', ico: '◎' },
  { id: 'tasks',     label: 'Tarefas',     ico: '▤' },
  { id: 'clients',   label: 'Clientes',    ico: '👥' },
  { id: 'contracts', label: 'Contratos',   ico: '📝' },
  { id: 'services',  label: 'Serviços',    ico: '✦' },
  { id: 'finance',   label: 'Financeiro',  ico: '💰' },
  { id: 'goals',     label: 'Metas',       ico: '🎯' },
  { id: 'habits',    label: 'Hábitos',     ico: '🔥' },
  { id: 'wishlist',  label: 'Wishlist',    ico: '💜' },
  { id: 'projects',  label: 'Projetos',    ico: '🧩' },
  { id: 'calendar',  label: 'Calendário',  ico: '📅' },
  { id: 'moments',   label: 'Momentos',    ico: '✨' },
  { id: 'prospection', label: 'Prospecção', ico: '🚀' },
  { id: 'content',   label: 'Conteúdo',    ico: '🎨' }
];

const Sidebar = {
  order() {
    const saved = Store.data.settings.navOrder || [];
    const valid = saved.filter(id => NAV_DEFS.some(n => n.id === id));
    const missing = NAV_DEFS.map(n => n.id).filter(id => !valid.includes(id));
    return [...valid, ...missing];
  },
  render() {
    const nav = document.getElementById('navList');
    const collapsed = Store.data.settings.sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed', collapsed);
    const current = App.current;
    nav.innerHTML = this.order().map(id => {
      const n = NAV_DEFS.find(d => d.id === id);
      return `<button class="nav-item ${current === id ? 'active' : ''}" data-nav="${id}" draggable="true">
        <span class="drag-dots">⣿</span><span class="nav-ico">${n.ico}</span>
        <span class="nav-label">${esc(n.label)}</span></button>`;
    }).join('');
    nav.querySelectorAll('[data-nav]').forEach(btn => {
      btn.onclick = () => App.go(btn.dataset.nav);
      btn.ondragstart = e => { e.dataTransfer.setData('nav', btn.dataset.nav); btn.style.opacity = .4; };
      btn.ondragend = () => { btn.style.opacity = 1; };
      btn.ondragover = e => { e.preventDefault(); btn.classList.add('drag-over'); };
      btn.ondragleave = () => btn.classList.remove('drag-over');
      btn.ondrop = e => {
        e.preventDefault(); btn.classList.remove('drag-over');
        const dragged = e.dataTransfer.getData('nav');
        if (!dragged || dragged === btn.dataset.nav) return;
        const order = Sidebar.order();
        order.splice(order.indexOf(dragged), 1);
        order.splice(order.indexOf(btn.dataset.nav), 0, dragged);
        Store.data.settings.navOrder = order;
        Store.save(); Sidebar.render();
      };
    });
  },
  toggleReorder(on) {
    document.getElementById('navList').classList.toggle('reordering', on);
    const b = document.getElementById('btnReorderMode');
    b.textContent = on ? 'Concluir reorganização' : 'Reorganizar menu';
    b.style.color = on ? 'var(--accent-soft)' : '';
  }
};
