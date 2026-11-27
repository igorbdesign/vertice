/* ===== Vértice — store (persistência em localStorage) ===== */
const STORE_KEY = 'vertice_state_v1';
const Store = {
  data: null,
  load() {
    let raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) {}
    const def = Store.defaults();
    let parsed = raw ? JSON.parse(raw) : {};
    Store.data = deepMerge(def, parsed);
    Store.migrate();
    Store.save();
  },
  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(Store.data)); }
    catch (e) { console.warn('Falha ao salvar', e); }
  },
  reset() { localStorage.removeItem(STORE_KEY); Store.load(); },
  migrate() { Finance.ensureRecurring(); },
  defaults() {
    return {
      profile: {
        name: '', business: '', email: '', phone: '', city: '',
        tone: { about: '', expressions: '', avoid: '', ctas: 'Chama no WhatsApp que eu te explico melhor 👇\nComenta AQUI que eu te mando o passo a passo.\nSalva esse post pra não esquecer.' }
      },
      clients: [],
      services: [],
      contracts: [],
      finance: { entries: [], recurring: [], methods: ['PIX','Transferência','Cartão','Boleto','Dinheiro'] },
      goals: [],
      tasks: {
        columns: [
          { id: 'c1', title: 'A fazer', color: '#a78bfa', image: '', order: 0 },
          { id: 'c2', title: 'Em andamento', color: '#f2c14e', image: '', order: 1 },
          { id: 'c3', title: 'Feito', color: '#5fd39a', image: '', order: 2 }
        ],
        cards: []
      },
      habits: [],
      wishlist: [],
      projects: [],
      events: [],
      moments: [],
      prospection: {
        leads: [],
        results: [],
        lastSearch: null,
        stages: [
          { id: 'f1', title: '📌 Novo lead' },
          { id: 'f2', title: '💬 Primeiro contato' },
          { id: 'f3', title: '🔄 Em conversa' },
          { id: 'f4', title: '📄 Proposta enviada' },
          { id: 'f5', title: '🏆 Fechou' },
          { id: 'f6', title: '❄️ Perdido' }
        ],
        waTemplate: 'Oi {{nome}}, tudo bem? 👋\n\nSou {{meunome}}, designer web aqui de {{minhacidade}}. Pesquisei {{nicho}} em {{cidade}} e encontrei o seu negócio — curti bastante o que vi!\n\nNotei algumas coisas que podem estar afastando clientes:\n{{problemas}}\n\nAcredito que dá pra mudar isso rápido e transformar isso em contato novo no WhatsApp todo dia.\n\nTopa uma conversa de 10 minutinhos, sem compromisso? Posso te mostrar exatamente o que melhorar.'
      },
      content: {
        posts: [], reels: [], carousels: [], suggestions: [],
        radar: { sources: ['https://tecnoblog.net/feed/','https://m3.midia.mouseinterativo.com.br/xml/feedr/v2/8m3.xml'], items: [], lastFetch: null }
      },
      settings: {
        navOrder: ['dashboard','tasks','clients','contracts','services','finance','goals','habits','wishlist','projects','calendar','moments','prospection','content'],
        sidebarCollapsed: false,
        placesKey: '',
        alertRules: { tasksOverdue: { enabled: true, everyDays: 2 } },
        alertRead: []
      }
    };
  }
};

function deepMerge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (typeof base === 'object' && base !== null) {
    const out = { ...base };
    if (typeof over === 'object' && over !== null) {
      for (const k of Object.keys(over)) {
        out[k] = k in base ? deepMerge(base[k], over[k]) : over[k];
      }
    }
    return out;
  }
  return over === undefined ? base : over;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('pt-BR');
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/* ===== Financeiro: recorrentes ===== */
const Finance = {
  entries() { return Store.data.finance.entries; },
  recurring() { return Store.data.finance.recurring; },
  ensureRecurring() {
    const f = Store.data?.finance;
    if (!f) return;
    const month = todayISO().slice(0, 7);
    f.recurring.forEach(r => {
      const exists = f.entries.some(e => e.recurringId === r.id && e.date.slice(0, 7) === month);
      if (!exists) {
        f.entries.push({
          id: uid(), type: r.type, description: r.description, amount: r.amount,
          category: r.category, date: month + '-' + String(r.day || 5).padStart(2, '0'),
          recurringId: r.id, auto: true
        });
      }
    });
    Store.save();
  },
  sum(list) { return list.reduce((s, e) => s + (Number(e.amount) || 0), 0); },
  monthKey(dateStr) { return (dateStr || '').slice(0, 7); },
  monthList(year) {
    const out = [];
    for (let m = 1; m <= 12; m++) out.push(year + '-' + String(m).padStart(2, '0'));
    return out;
  },
  byMonth(year, type) {
    const map = {};
    Store.data.finance.entries.forEach(e => {
      const k = this.monthKey(e.date);
      if (k.slice(0, 4) === String(year) && (!type || e.type === type)) {
        map[k] = (map[k] || 0) + (Number(e.amount) || 0);
      }
    });
    return map;
  },
  inMonth(monthKey, type) {
    return this.sum(Store.data.finance.entries.filter(e =>
      this.monthKey(e.date) === monthKey && (!type || e.type === type)));
  },
  forecast(monthKey) {
    return this.sum(Store.data.finance.entries.filter(e =>
      this.monthKey(e.date) === monthKey && e.type === 'income' && e.forecast));
  },
  clientName(id) {
    const c = Store.data.clients.find(x => x.id === id);
    return c ? c.name : '';
  }
};

/* ===== Contratos ===== */
const ContractTemplate = {
  header: `CONTRATO PRESTAÇÃO DE SERVIÇOS DE DESIGN\n\n{{contratado}}, inscrita(o) sob CPF/CNPJ nº {{documento}}, residente/estabelecido em {{enderecocompleto}}, doravante denominada CONTRATADO(A) DESIGNER;\n\n{{contratante}}, inscrita(o) sob CPF/CNPJ nº {{doccontratante}}, residente/estabelecido em {{enderecocliente}}, doravante denominado CONTRATANTE, celebram o presente contrato, que se regerá pelas cláusulas seguintes.\n`,
  clauses: [
    { id: 'cl1', title: 'CLÁUSULA 1ª — DO OBJETO', text: 'O presente contrato tem como objeto a prestação de serviços de design gráfico e/ou web design, compreendendo: {{servicos}}. Todo o material desenvolvido respeitará a identidade visual do CONTRATANTE e as definições de escopo acordadas entre as partes.' },
    { id: 'cl2', title: 'CLÁUSULA 2ª — DO PRAZO E DAS ENTREGAS', text: 'Os serviços terão início em {{datainicio}}, com prazo de entrega estimado em {{prazo}} dias corridos, contados a partir do recebimento de todos os materiais necessários (textos, imagens, acessos). Entregas parciais poderão ser solicitadas e acordadas entre as partes.' },
    { id: 'cl3', title: 'CLÁUSULA 3ª — DO VALOR E DA FORMA DE PAGAMENTO', text: 'Pelo(s) serviço(s) descrito(s), o CONTRATANTE pagará ao CONTRATADO o valor total de R$ {{valor}} ({{valextenso}}), sendo {{pagamento}}. Em caso de atraso superior a 10 (dez) dias, incidirá multa de 2% sobre o valor em aberto, acrescido de juros de 1% ao mês.' },
    { id: 'cl4', title: 'CLÁUSULA 4ª — DAS REVISÕES', text: 'Estão incluídas {{revisoes}} rodadas de revisão dentro do escopo contratado. Alterações que expandam o escopo inicial (novas páginas, novas artes, funcionalidades adicionais) serão orçadas à parte mediante aprovação prévia do CONTRATANTE.' },
    { id: 'cl5', title: 'CLÁUSULA 5ª — DA COLABORAÇÃO DO CONTRATANTE', text: 'O CONTRATANTE se compromete a fornecer, em prazo hábil, todos os materiais, informações e aprovações necessários à execução dos serviços. Atrasos causados pela falta de retorno do CONTRATANTE poderão prorrogar os prazos de entrega proporcionalmente.' },
    { id: 'cl6', title: 'CLÁUSULA 6ª — DA PROPRIEDADE INTELECTUAL', text: 'A propriedade integral do material final aprovado será transferida ao CONTRATANTE somente após a quitação total do valor acordado. O CONTRATADO poderá exibir o trabalho realizado em seu portfólio e redes profissionais, salvo oposição expressa e por escrito do CONTRATANTE.' },
    { id: 'cl7', title: 'CLÁUSULA 7ª — DA RESCISÃO', text: 'O presente contrato poderá ser rescindido por qualquer das partes mediante aviso por escrito. Em caso de rescisão por iniciativa do CONTRATANTE após o início dos trabalhos, serão devidos os valores proporcionais ao trabalho já realizado, não inferior a 50% do total contratado.' }
  ],
  footer: `\nE, por estarem justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.\n\n{{cidadecontrato}}, {{datacontrato}}.\n\n\n________________________________\nCONTRATADO(A): {{contratado}}\n\n________________________________\nCONTRATANTE: {{contratante}}`
};

window.Store = Store; window.Finance = Finance; window.ContractTemplate = ContractTemplate;
