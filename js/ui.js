const TABELA_MODALIDADES = {
  cartao: [
    { count: 2, label: '2x' },
    { count: 3, label: '3x' },
    { count: 6, label: '6x' },
    { count: 10, label: '10x' },
    { count: 12, label: '12x (1 ano)' },
    { count: 18, label: '18x' },
    { count: 24, label: '24x (2 anos)' }
  ],
  emprestimos: [
    { count: 36, label: '36x (3 anos)' },
    { count: 48, label: '48x (4 anos)' },
    { count: 60, label: '60x (5 anos)' }
  ],
  imobiliario: [
    { count: 120, label: '120x (10 anos)' },
    { count: 180, label: '180x (15 anos)' },
    { count: 240, label: '240x (20 anos)' },
    { count: 300, label: '300x (25 anos)' },
    { count: 360, label: '360x (30 anos - Imóvel)' }
  ]
};

let modalidadeSelecionada = 'cartao';
let drawerPaidState = false;
let accModalCurrentType = 'bank';
let currentCatTab = 'expense';

function applyTheme(theme) {
  const html = document.documentElement;
  const dot = document.getElementById('theme-toggle-dot');
  if (theme === 'dark') {
    html.classList.add('dark');
    if (dot) dot.style.transform = 'translateX(12px)';
  } else {
    html.classList.remove('dark');
    if (dot) dot.style.transform = 'translateX(0px)';
  }
  localStorage.setItem('finanzio_theme', theme);
  AppState.theme = theme;
}

function toggleTheme() {
  applyTheme(AppState.theme === 'dark' ? 'light' : 'dark');
  renderCashflowChart();
  renderGastosDonut();
  if (AppState.currentScreen === 'reports') renderReportsChart();
}

function toggleSidebarCollapse() {
  const sb = document.getElementById('sidebar');
  const texts = document.querySelectorAll('.sidebar-text');
  const isCollapsed = sb.classList.contains('w-20');

  if (isCollapsed) {
    sb.classList.remove('w-20');
    sb.classList.add('w-64');
    texts.forEach(t => t.classList.remove('hidden'));
  } else {
    sb.classList.remove('w-64');
    sb.classList.add('w-20');
    texts.forEach(t => t.classList.add('hidden'));
  }
}

function toggleMobileSidebar() {
  const sb = document.getElementById('sidebar');
  const bdrop = document.getElementById('mobile-backdrop');
  const isClosed = sb.classList.contains('-translate-x-full');
  if (isClosed) {
    sb.classList.remove('-translate-x-full');
    bdrop.classList.remove('hidden');
  } else {
    sb.classList.add('-translate-x-full');
    bdrop.classList.add('hidden');
  }
}

function toggleNewActionMenu() {
  const menu = document.getElementById('new-action-menu');
  menu.classList.toggle('hidden');
}

function updateDashboardMetrics() {
  const currentMonthStr = `${AppState.selectedYear}-${String(AppState.selectedMonth + 1).padStart(2, '0')}`;
  const monthTx = AppState.transactions.filter(t => t.date.startsWith(currentMonthStr));

  const paidIncomes = monthTx.filter(t => t.type === 'income' && t.paid).reduce((s, t) => s + t.amount, 0);
  const allIncomes = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const paidIncomeCount = monthTx.filter(t => t.type === 'income' && t.paid).length;

  const paidExpenses = monthTx.filter(t => t.type === 'expense' && t.paid).reduce((s, t) => s + t.amount, 0);
  const allExpenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const paidExpenseCount = monthTx.filter(t => t.type === 'expense' && t.paid).length;

  const netPaid = paidIncomes - paidExpenses;
  const netPlanned = allIncomes - allExpenses;

  document.getElementById('dash-receitas-val').textContent = formatCurrency(paidIncomes);
  document.getElementById('dash-receitas-count').textContent = `${paidIncomeCount} recebida(s)`;
  document.getElementById('dash-receitas-prev').textContent = `Previsto: ${formatCurrency(allIncomes)}`;

  document.getElementById('dash-despesas-val').textContent = formatCurrency(paidExpenses);
  document.getElementById('dash-despesas-count').textContent = `${paidExpenseCount} paga(s)`;
  document.getElementById('dash-despesas-prev').textContent = `Previsto: ${formatCurrency(allExpenses)}`;

  const saldoEl = document.getElementById('dash-saldo-val');
  saldoEl.textContent = formatCurrency(netPaid);
  saldoEl.className = `text-2xl font-bold tracking-tight ${netPaid >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
  document.getElementById('dash-saldo-prev').textContent = `Previsto: ${formatCurrency(netPlanned)}`;

  const recentContainer = document.getElementById('dash-recent-tx');
  const sortedTx = [...AppState.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  
  recentContainer.innerHTML = sortedTx.map(tx => {
    const cat = AppState.categories.find(c => c.id === tx.category) || { icon: '💳', name: 'Geral' };
    const isIncome = tx.type === 'income';
    return `
      <div onclick="openDrawer('${tx.id}')" class="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-xs ${isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}">
            ${cat.icon}
          </div>
          <div>
            <p class="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">${tx.name}</p>
            <p class="text-[11px] text-slate-400">${formatFriendlyDate(tx.date)} · ${tx.bank}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
            ${isIncome ? '+' : '-'} ${formatCurrency(tx.amount)}
          </p>
          <span class="text-[10px] ${tx.paid ? 'text-emerald-500' : 'text-amber-500'} font-medium">
            ${tx.paid ? '✓ Pago' : '⏳ Pendente'}
          </span>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('tx-badge-count').textContent = AppState.transactions.length;
}

function renderTransactionsList() {
  const typeFilter = document.getElementById('tx-filter-type')?.value || 'all';
  const statusFilter = document.getElementById('tx-filter-status')?.value || 'all';
  const accountFilter = document.getElementById('tx-filter-account')?.value || 'all';
  const categoryFilter = document.getElementById('tx-filter-category')?.value || 'all';

  const monthsNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  document.getElementById('tx-current-period-display').textContent = `${monthsNames[AppState.selectedMonth]} ${AppState.selectedYear}`;

  const currentPeriodPrefix = `${AppState.selectedYear}-${String(AppState.selectedMonth + 1).padStart(2, '0')}`;
  const periodTx = AppState.transactions.filter(t => t.date.startsWith(currentPeriodPrefix));

  const paidIncomes = periodTx.filter(t => t.type === 'income' && t.paid).reduce((s, t) => s + t.amount, 0);
  const allIncomes = periodTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const paidExpenses = periodTx.filter(t => t.type === 'expense' && t.paid).reduce((s, t) => s + t.amount, 0);
  const allExpenses = periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const netBalance = paidIncomes - paidExpenses;
  const plannedBalance = allIncomes - allExpenses;

  document.getElementById('tx-summary-inc-val').textContent = formatCurrency(paidIncomes);
  document.getElementById('tx-summary-inc-prev').textContent = `Previsto: ${formatCurrency(allIncomes)}`;

  document.getElementById('tx-summary-exp-val').textContent = formatCurrency(paidExpenses);
  document.getElementById('tx-summary-exp-prev').textContent = `Previsto: ${formatCurrency(allExpenses)}`;

  const balValEl = document.getElementById('tx-summary-bal-val');
  const balCardEl = document.getElementById('tx-summary-balance-card');
  const balIconWrap = document.getElementById('tx-summary-bal-icon-wrap');
  const balPrevEl = document.getElementById('tx-summary-bal-prev');

  balValEl.textContent = formatCurrency(netBalance);
  balPrevEl.textContent = `Previsto: ${formatCurrency(plannedBalance)}`;

  if (netBalance < 0) {
    balValEl.className = 'text-lg font-bold text-rose-600 dark:text-rose-400';
    balCardEl.className = 'bg-rose-50/50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/60 rounded-xl p-3 shadow-xs flex items-center justify-between transition-colors';
    balIconWrap.className = 'w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center';
  } else {
    balValEl.className = 'text-lg font-bold text-emerald-600 dark:text-emerald-400';
    balCardEl.className = 'bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex items-center justify-between transition-colors';
    balIconWrap.className = 'w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center';
  }

  let filtered = periodTx.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (statusFilter === 'paid' && !t.paid) return false;
    if (statusFilter === 'pending' && t.paid) return false;
    if (accountFilter !== 'all' && t.bank !== accountFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const groups = {};
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(tx => {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  });

  const container = document.getElementById('tx-grouped-container');
  if (Object.keys(groups).length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <svg class="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Nenhum lançamento encontrado</p>
        <p class="text-[11px] text-slate-400">Tente ajustar os filtros ou adicione um novo registro.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = Object.keys(groups).map(dateKey => {
    const items = groups[dateKey];
    return `
      <div class="space-y-1">
        <div class="flex items-center justify-between px-2 pt-1">
          <span class="text-[11px] font-bold text-slate-400 tracking-wider uppercase">${formatFriendlyDate(dateKey, true)}</span>
          <span class="text-[10px] text-slate-400 font-medium">${items.length} item(s)</span>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 shadow-xs">
          ${items.map(tx => {
            const cat = AppState.categories.find(c => c.id === tx.category) || { icon: '💳', name: 'Geral' };
            const isIncome = tx.type === 'income';
            return `
              <div class="py-2 px-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer" onclick="openDrawer('${tx.id}')">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 shadow-xs ${isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}">
                    ${cat.icon}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5 leading-tight">
                      <p class="text-xs font-bold text-slate-900 dark:text-white">${tx.name}</p>${tx.installments ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">${tx.installments}</span>` : ''}
                    </div>
                    <p class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>${cat.name}</span>
                      <span>•</span>
                      <span>${tx.bank}</span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <p class="text-xs font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                      ${isIncome ? '+' : '-'} ${formatCurrency(tx.amount)}
                    </p>
                    <span class="text-[10px] font-semibold ${tx.paid ? 'text-emerald-500' : 'text-amber-500'}">
                      ${tx.paid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                  <button onclick="event.stopPropagation(); quickTogglePaid('${tx.id}')" class="p-1.5 rounded-lg text-xs ${tx.paid ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'} transition-colors" title="${tx.paid ? 'Efetivado' : 'Pendente'}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function quickTogglePaid(txId) {
  const tx = AppState.transactions.find(t => t.id === txId);
  if (!tx) return;
  tx.paid = !tx.paid;
  persistState();
  fbSave('transactions', tx.id, tx);
  updateDashboardMetrics();
  if (AppState.currentScreen === 'transactions') renderTransactionsList();
  showToast(tx.paid ? 'Lançamento efetivado com sucesso!' : 'Lançamento alterado para pendente!');
}

function openDrawer(txId) {
  const tx = AppState.transactions.find(t => t.id === txId);
  if (!tx) return;
  AppState.activeDrawerTxId = txId;

  document.getElementById('drawer-id-label').textContent = `#${tx.id}`;
  document.getElementById('drawer-title').value = tx.name;
  document.getElementById('drawer-amount').value = (tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  document.getElementById('drawer-date').value = tx.date;
  document.getElementById('drawer-obs').value = tx.obs || '';

  const badge = document.getElementById('drawer-type-badge');
  if (tx.type === 'income') {
    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600';
    badge.textContent = 'Receita';
  } else {
    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600';
    badge.textContent = 'Despesa';
  }

  populateSelectOptions();
  document.getElementById('drawer-account').value = tx.bank;
  document.getElementById('drawer-category').value = tx.category;

  setDrawerPaidStatus(tx.paid);

  document.getElementById('drawer-backdrop').classList.remove('hidden');
  document.getElementById('drawer').classList.remove('translate-x-full');
}

function closeDrawer() {
  document.getElementById('drawer-backdrop').classList.add('hidden');
  document.getElementById('drawer').classList.add('translate-x-full');
  AppState.activeDrawerTxId = null;
}

function setDrawerPaidStatus(isPaid) {
  drawerPaidState = isPaid;
  const bPaid = document.getElementById('drawer-btn-paid');
  const bUnpaid = document.getElementById('drawer-btn-unpaid');

  if (isPaid) {
    bPaid.className = 'flex-1 py-2 rounded-xl text-xs font-semibold border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center gap-1.5';
    bUnpaid.className = 'flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center gap-1.5';
  } else {
    bPaid.className = 'flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center gap-1.5';
    bUnpaid.className = 'flex-1 py-2 rounded-xl text-xs font-semibold border border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center gap-1.5';
  }
}

function saveDrawerTransaction() {
  if (!AppState.activeDrawerTxId) return;
  const tx = AppState.transactions.find(t => t.id === AppState.activeDrawerTxId);
  if (!tx) return;

  tx.name = document.getElementById('drawer-title').value.trim() || tx.name;
  tx.amount = parseCurrencyString(document.getElementById('drawer-amount').value);
  tx.date = document.getElementById('drawer-date').value;
  tx.bank = document.getElementById('drawer-account').value;
  tx.category = document.getElementById('drawer-category').value;
  tx.paid = drawerPaidState;
  tx.obs = document.getElementById('drawer-obs').value;

  persistState();
  fbSave('transactions', tx.id, tx);
  closeDrawer();
  updateDashboardMetrics();
  if (AppState.currentScreen === 'transactions') renderTransactionsList();
  showToast('Transação atualizada com sucesso!');
}

function deleteDrawerTransaction() {
  if (!AppState.activeDrawerTxId) return;
  const idToDelete = AppState.activeDrawerTxId;
  AppState.transactions = AppState.transactions.filter(t => t.id !== idToDelete);
  persistState();
  fbDelete('transactions', idToDelete);
  closeDrawer();
  updateDashboardMetrics();
  if (AppState.currentScreen === 'transactions') renderTransactionsList();
  showToast('Lançamento removido com sucesso!');
}

function openModal(modalType) {
  if (modalType === 'expense' || modalType === 'income') {
    populateSelectOptions();
    setModalTxType(modalType);
    document.getElementById('modal-tx-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-tx-name').value = '';
    document.getElementById('modal-tx-value').value = '';
    setRecurMode('installments');
    setInstallmentMode('cartao');
    document.getElementById('modal-tx').classList.remove('hidden');
  } else if (modalType === 'transfer') {
    populateSelectOptions();
    document.getElementById('transfer-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('transfer-val').value = '';
    document.getElementById('modal-transfer').classList.remove('hidden');
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function setModalTxType(type) {
  AppState.modalTxType = type;
  const bExp = document.getElementById('modal-type-expense');
  const bInc = document.getElementById('modal-type-income');
  const heading = document.getElementById('modal-tx-heading');

  if (type === 'expense') {
    bExp.className = 'flex-1 py-1.5 rounded-lg bg-[#29354d] text-rose-400 shadow-sm transition-all text-center';
    bInc.className = 'flex-1 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all text-center';
    heading.textContent = 'Nova Despesa';
  } else {
    bInc.className = 'flex-1 py-1.5 rounded-lg bg-[#29354d] text-emerald-400 shadow-sm transition-all text-center';
    bExp.className = 'flex-1 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all text-center';
    heading.textContent = 'Nova Receita';
  }
  populateSelectOptions();
}

function setRecurMode(mode) {
  AppState.modalRecurMode = mode;
  const bNone = document.getElementById('recur-btn-none');
  const bFixed = document.getElementById('recur-btn-fixed');
  const bInst = document.getElementById('recur-btn-inst');
  const instBlock = document.getElementById('installment-options');

  [bNone, bFixed].forEach(b => {
    b.className = 'py-1.5 rounded-xl border border-slate-700/60 text-slate-400 bg-[#182033]';
  });
  bInst.className = 'py-1.5 rounded-xl border border-slate-700/60 text-slate-400 bg-[#182033]';

  if (mode === 'none') {
    bNone.className = 'py-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-950/20 text-emerald-400 font-bold';
    instBlock.classList.add('hidden');
  } else if (mode === 'fixed') {
    bFixed.className = 'py-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-950/20 text-emerald-400 font-bold';
    instBlock.classList.add('hidden');
  } else {
    bInst.className = 'py-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-950/20 text-emerald-400 font-bold';
    instBlock.classList.remove('hidden');
    setInstallmentMode(modalidadeSelecionada);
  }
}

function setInstallmentMode(mode) {
  modalidadeSelecionada = mode;
  const keys = ['cartao', 'emprestimos', 'imobiliario'];
  
  keys.forEach(k => {
    const btn = document.getElementById(`mod-tab-${k}`);
    if (btn) {
      if (k === mode) {
        btn.className = 'py-1 rounded-lg bg-[#27354f] text-white text-center shadow-xs';
      } else {
        btn.className = 'py-1 rounded-lg text-slate-400 hover:text-white text-center transition-colors';
      }
    }
  });

  const shortcutSelect = document.getElementById('modal-tx-shortcut-select');
  const manualInput = document.getElementById('modal-tx-manual-count');
  const list = TABELA_MODALIDADES[mode] || [];

  shortcutSelect.innerHTML = list.map(item => `<option value="${item.count}">${item.label}</option>`).join('');

  if (list.length > 0) {
    manualInput.value = list[0].count;
    shortcutSelect.value = list[0].count;
  }
  updateInstallmentPreview();
}

function handleShortcutSelect(val) {
  document.getElementById('modal-tx-manual-count').value = val;
  updateInstallmentPreview();
}

function handleManualInstallmentInput(val) {
  let n = parseInt(val, 10);
  const sel = document.getElementById('modal-tx-shortcut-select');
  if (sel) sel.value = n;
  updateInstallmentPreview();
}

function updateInstallmentPreview() {
  const val = parseCurrencyString(document.getElementById('modal-tx-value').value);
  const count = parseInt(document.getElementById('modal-tx-manual-count')?.value, 10) || 2;
  const preview = document.getElementById('installment-calc-preview');
  const datePreview = document.getElementById('installment-date-preview');
  const startDateVal = document.getElementById('modal-tx-date').value;

  if (val > 0) {
    const par = (val / count).toFixed(2);
    preview.textContent = `${count} parcelas de R$ ${par.replace('.', ',')}`;
  } else {
    preview.textContent = `${count} parcelas de R$ 0,00`;
  }

  if (startDateVal) {
    const [ano, mes, dia] = startDateVal.split('-').map(Number);
    const dataFim = new Date(ano, mes - 1 + (count - 1), dia);
    const mesesExtenso = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    datePreview.textContent = `Término previsto: ${mesesExtenso[dataFim.getMonth()]} de ${dataFim.getFullYear()}`;
  } else {
    datePreview.textContent = 'Término previsto: —';
  }
}

function submitNewTransaction() {
  const name = document.getElementById('modal-tx-name').value.trim();
  const val = parseCurrencyString(document.getElementById('modal-tx-value').value);
  const date = document.getElementById('modal-tx-date').value;
  const bank = document.getElementById('modal-tx-account').value;
  const category = document.getElementById('modal-tx-category').value;

  if (!name || val <= 0 || !date) {
    showToast('Preencha descrição, valor e data válida!');
    return;
  }

  if (AppState.modalRecurMode === 'installments') {
    let count = parseInt(document.getElementById('modal-tx-manual-count').value, 10) || 2;
    if (count < 2) count = 2;
    if (count > 360) count = 360;

    const parcelAmt = parseFloat((val / count).toFixed(2));
    const [year, month, day] = date.split('-').map(n => parseInt(n, 10));

    const createdInstallments = [];
    for (let i = 1; i <= count; i++) {
      const parcelDate = new Date(year, month - 1 + (i - 1), day);
      const dateStr = parcelDate.toISOString().split('T')[0];
      const newTx = {
        id: 'tx_' + Date.now() + '_' + i,
        name: `${name} (${i}/${count})`,
        type: AppState.modalTxType,
        amount: parcelAmt,
        date: dateStr,
        bank,
        category,
        paid: i === 1,
        installments: `${i}/${count}`,
        obs: `Parcelamento em ${count}x`
      };
      AppState.transactions.push(newTx);
      createdInstallments.push(newTx);
    }
    persistState();
    createdInstallments.forEach(t => fbSave('transactions', t.id, t));
  } else {
    const newTx = {
      id: 'tx_' + Date.now(),
      name,
      type: AppState.modalTxType,
      amount: val,
      date,
      bank,
      category,
      paid: false,
      obs: AppState.modalRecurMode === 'fixed' ? 'Recorrência fixa mensal' : ''
    };
    AppState.transactions.push(newTx);
    persistState();
    fbSave('transactions', newTx.id, newTx);
  }

  closeModal('modal-tx');
  updateDashboardMetrics();
  if (AppState.currentScreen === 'transactions') renderTransactionsList();
  showToast('Lançamento adicionado com sucesso!');
}

function submitTransfer() {
  const from = document.getElementById('transfer-from-account').value;
  const to = document.getElementById('transfer-to-account').value;
  const val = parseCurrencyString(document.getElementById('transfer-val').value);
  const date = document.getElementById('transfer-date').value;

  if (from === to) {
    showToast('Escolha contas de origem e destino diferentes!');
    return;
  }
  if (val <= 0 || !date) {
    showToast('Informe um valor e data válidos!');
    return;
  }

  const trTx = {
    id: 'tx_tr_' + Date.now(),
    name: `Transferência: ${from} → ${to}`,
    type: 'transfer',
    amount: val,
    date,
    bank: from,
    destinationBank: to,
    category: 'housing',
    paid: true,
    obs: 'Transferência entre contas'
  };

  AppState.transactions.push(trTx);
  persistState();
  fbSave('transactions', trTx.id, trTx);
  closeModal('modal-transfer');
  updateDashboardMetrics();
  showToast('Transferência efetuada com sucesso!');
}

function renderBudgetsScreen() {
  const container = document.getElementById('budgets-full-grid');
  container.innerHTML = AppState.budgets.map(b => {
    const cat = AppState.categories.find(c => c.id === b.categoryId) || { name: 'Geral', icon: '💳' };
    const spent = getCategoryCurrentSpending(b.categoryId, AppState.selectedYear, AppState.selectedMonth);
    const pct = Math.min(100, Math.round((spent / b.limit) * 100));
    const rem = b.limit - spent;

    let barColor = 'bg-emerald-500';
    let badgeColor = 'bg-emerald-500/10 text-emerald-600';
    if (pct >= 100) {
      barColor = 'bg-rose-500';
      badgeColor = 'bg-rose-500/10 text-rose-600';
    } else if (pct >= 80) {
      barColor = 'bg-amber-500';
      badgeColor = 'bg-amber-500/10 text-amber-600';
    }

    return `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">${cat.icon}</span>
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">${cat.name}</h4>
              <p class="text-xs text-slate-400">${pct}% consumido este mês</p>
            </div>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-full font-bold ${badgeColor}">
            ${pct >= 100 ? 'Limite Excedido' : 'Sob Controle'}
          </span>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-slate-500">
            <span>Gasto Real: ${formatCurrency(spent)}</span>
            <span>Teto: ${formatCurrency(b.limit)}</span>
          </div>
          <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 ${barColor}" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span class="text-slate-400">${rem >= 0 ? `Restam ${formatCurrency(rem)}` : `Estourou em ${formatCurrency(Math.abs(rem))}`}</span>
          <button onclick="deleteBudget('${b.id}')" class="text-rose-500 hover:text-rose-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openBudgetModal() {
  const select = document.getElementById('budget-category-select');
  const expenseCats = AppState.categories.filter(c => c.type === 'expense');
  select.innerHTML = expenseCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  document.getElementById('budget-limit').value = '';
  document.getElementById('modal-budget').classList.remove('hidden');
}

function saveBudgetFromModal() {
  const categoryId = document.getElementById('budget-category-select').value;
  const limit = parseCurrencyString(document.getElementById('budget-limit').value);

  if (!categoryId || limit <= 0) {
    showToast('Selecione uma categoria e um limite válido!');
    return;
  }

  let savedB;
  const existingIndex = AppState.budgets.findIndex(b => b.categoryId === categoryId);
  if (existingIndex >= 0) {
    AppState.budgets[existingIndex].limit = limit;
    savedB = AppState.budgets[existingIndex];
  } else {
    savedB = { id: 'b_' + Date.now(), categoryId, limit };
    AppState.budgets.push(savedB);
  }

  persistState();
  fbSave('budgets', savedB.id, savedB);
  closeModal('modal-budget');
  renderBudgetsScreen();
  updateDashboardMetrics();
  showToast('Orçamento salvo com sucesso!');
}

function deleteBudget(bId) {
  AppState.budgets = AppState.budgets.filter(b => b.id !== bId);
  persistState();
  fbDelete('budgets', bId);
  renderBudgetsScreen();
  updateDashboardMetrics();
  showToast('Orçamento excluído!');
}

function renderGoalsScreen() {
  const container = document.getElementById('goals-full-grid');
  container.innerHTML = AppState.goals.map(g => {
    const pct = Math.min(100, Math.round((g.current / g.total) * 100));
    return `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
            ${g.icon}
          </div>
          <span class="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full">
            ${pct}% concluído
          </span>
        </div>
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white">${g.name}</h4>
          <p class="text-xs text-slate-400">Previsão: ${g.date || 'Em breve'}</p>
        </div>
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-slate-500">
            <span>Guardado: ${formatCurrency(g.current)}</span>
            <span>Alvo: ${formatCurrency(g.total)}</span>
          </div>
          <div class="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-brand-500 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button onclick="deleteGoal('${g.id}')" class="text-rose-500 hover:text-rose-600 text-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openGoalModal() {
  document.getElementById('goal-name').value = '';
  document.getElementById('goal-current').value = '';
  document.getElementById('goal-total').value = '';
  document.getElementById('modal-goal').classList.remove('hidden');
}

function saveGoalFromModal() {
  const name = document.getElementById('goal-name').value.trim();
  const icon = document.getElementById('goal-icon').value.trim() || '🎯';
  const cur = parseCurrencyString(document.getElementById('goal-current').value);
  const tot = parseCurrencyString(document.getElementById('goal-total').value);
  const date = document.getElementById('goal-date').value;

  if (!name || tot <= 0) {
    showToast('Preencha os campos obrigatórios da meta!');
    return;
  }

  const newGoal = { id: 'g_' + Date.now(), name, icon, current: cur, total: tot, date };
  AppState.goals.push(newGoal);
  persistState();
  fbSave('goals', newGoal.id, newGoal);
  closeModal('modal-goal');
  renderGoalsScreen();
  showToast('Nova meta cadastrada!');
}

function deleteGoal(gId) {
  AppState.goals = AppState.goals.filter(g => g.id !== gId);
  persistState();
  fbDelete('goals', gId);
  renderGoalsScreen();
  showToast('Meta removida!');
}

function renderAccountsScreen() {
  const banks = AppState.accounts.filter(a => a.type === 'bank');
  const cards = AppState.accounts.filter(a => a.type === 'card');

  document.getElementById('accounts-banks-grid').innerHTML = banks.map(b => {
    const dynamicBal = getDynamicAccountBalance(b);
    return `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm" style="background-color: ${b.color || '#3b82f6'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>
          </div>
          <button onclick="deleteAccount('${b.id}')" class="text-rose-500 hover:text-rose-600 text-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white">${b.name}</h4>
          <p class="text-xs text-slate-400">Agência: ${b.agency || '001'} · Saldo Base: ${formatCurrency(b.initialBalance)}</p>
        </div>
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Saldo Atualizado em Conta</p>
          <p class="text-lg font-bold ${dynamicBal >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}">${formatCurrency(dynamicBal)}</p>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('accounts-cards-grid').innerHTML = cards.map(c => {
    const currentBill = getDynamicAccountBalance(c);
    const available = c.limit - currentBill;
    return `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm" style="background-color: ${c.color || '#ea580c'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <button onclick="deleteAccount('${c.id}')" class="text-rose-500 hover:text-rose-600 text-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white">${c.name}</h4>
          <p class="text-xs text-slate-400">Vencimento: Dia ${c.due || '15'}</p>
        </div>
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <div class="flex justify-between text-xs">
            <span class="text-slate-400">Fatura Atual:</span>
            <span class="font-bold text-rose-500">${formatCurrency(currentBill)}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400">Limite Disponível:</span>
            <span class="font-bold text-emerald-500">${formatCurrency(available)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openAccountModal() {
  setAccountModalType('bank');
  document.getElementById('acc-name').value = '';
  document.getElementById('acc-balance').value = '';
  document.getElementById('acc-limit').value = '';
  document.getElementById('acc-bill').value = '';
  document.getElementById('modal-account').classList.remove('hidden');
}

function setAccountModalType(t) {
  accModalCurrentType = t;
  const bBank = document.getElementById('acc-type-bank-btn');
  const bCard = document.getElementById('acc-type-card-btn');
  const bankBlock = document.getElementById('acc-bank-block');
  const cardBlock = document.getElementById('acc-card-block');

  if (t === 'bank') {
    bBank.className = 'flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm';
    bCard.className = 'flex-1 py-1.5 rounded-lg text-slate-500';
    bankBlock.classList.remove('hidden');
    cardBlock.classList.add('hidden');
  } else {
    bCard.className = 'flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm';
    bBank.className = 'flex-1 py-1.5 rounded-lg text-slate-500';
    bankBlock.classList.add('hidden');
    cardBlock.classList.remove('hidden');
  }
}

function saveAccountFromModal() {
  const name = document.getElementById('acc-name').value.trim();
  if (!name) {
    showToast('Informe o nome da instituição!');
    return;
  }

  let newAcc;
  if (accModalCurrentType === 'bank') {
    const bal = parseCurrencyString(document.getElementById('acc-balance').value);
    newAcc = {
      id: 'acc_' + Date.now(),
      name,
      type: 'bank',
      agency: '001',
      initialBalance: bal,
      color: '#0284c7'
    };
  } else {
    const limit = parseCurrencyString(document.getElementById('acc-limit').value);
    const bill = parseCurrencyString(document.getElementById('acc-bill').value);
    const due = parseInt(document.getElementById('acc-due-day').value, 10) || 15;
    newAcc = {
      id: 'card_' + Date.now(),
      name,
      type: 'card',
      limit,
      initialBill: bill,
      due,
      color: '#9333ea'
    };
  }

  AppState.accounts.push(newAcc);
  persistState();
  fbSave('accounts', newAcc.id, newAcc);
  closeModal('modal-account');
  renderAccountsScreen();
  updateDashboardMetrics();
  showToast('Conta cadastrada com sucesso!');
}

function deleteAccount(accId) {
  AppState.accounts = AppState.accounts.filter(a => a.id !== accId);
  persistState();
  fbDelete('accounts', accId);
  renderAccountsScreen();
  updateDashboardMetrics();
  showToast('Conta removida!');
}

function renderCategoriesScreen() {
  const list = AppState.categories.filter(c => c.type === currentCatTab);
  const container = document.getElementById('categories-grid');
  container.innerHTML = list.map(c => `
    <div class="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background-color: ${c.color}20; color: ${c.color}">
          ${c.icon}
        </div>
        <div>
          <p class="text-xs font-bold text-slate-900 dark:text-white">${c.name}</p>
          <p class="text-[10px] text-slate-400 capitalize">${c.type === 'expense' ? 'Despesa' : 'Receita'}</p>
        </div>
      </div>
      <span class="w-3 h-3 rounded-full" style="background-color: ${c.color}"></span>
    </div>
  `).join('');
}

function switchCategoryTab(tab) {
  currentCatTab = tab;
  const bExp = document.getElementById('cat-tab-expense');
  const bInc = document.getElementById('cat-tab-income');
  if (tab === 'expense') {
    bExp.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20';
    bInc.className = 'px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800';
  } else {
    bInc.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20';
    bExp.className = 'px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800';
  }
  renderCategoriesScreen();
}

function openCategoryModal() {
  document.getElementById('modal-cat-name').value = '';
  document.getElementById('modal-cat-icon').value = '🏷️';
  document.getElementById('modal-category').classList.remove('hidden');
}

function populateSelectOptions() {
  const accSelects = ['modal-tx-account', 'transfer-from-account', 'transfer-to-account', 'drawer-account', 'tx-filter-account'];
  const catSelects = ['modal-tx-category', 'drawer-category', 'tx-filter-category'];

  const accOptions = AppState.accounts.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
  accSelects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = id === 'tx-filter-account' ? '<option value="all">Todas as Contas</option>' + accOptions : accOptions;
    }
  });

  const cats = AppState.categories.filter(c => AppState.modalTxType ? c.type === AppState.modalTxType : true);
  const catOptions = cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  catSelects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = id === 'tx-filter-category' 
        ? '<option value="all">Todas as Categorias</option>' + AppState.categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')
        : catOptions;
    }
  });
}

function printFilteredReport() {
  const typeFilter = document.getElementById('tx-filter-type')?.value || 'all';
  const statusFilter = document.getElementById('tx-filter-status')?.value || 'all';
  const accountFilter = document.getElementById('tx-filter-account')?.value || 'all';
  const categoryFilter = document.getElementById('tx-filter-category')?.value || 'all';

  const currentPeriodPrefix = `${AppState.selectedYear}-${String(AppState.selectedMonth + 1).padStart(2, '0')}`;

  const items = AppState.transactions.filter(t => {
    if (!t.date.startsWith(currentPeriodPrefix)) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (statusFilter === 'paid' && !t.paid) return false;
    if (statusFilter === 'pending' && t.paid) return false;
    if (accountFilter !== 'all' && t.bank !== accountFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  renderPrintableWindow(items, 'Relatório de Lançamentos Filtrados');
}

function printPeriodReport() {
  const currentPeriodPrefix = `${AppState.selectedYear}-${String(AppState.selectedMonth + 1).padStart(2, '0')}`;
  const items = AppState.transactions.filter(t => t.date.startsWith(currentPeriodPrefix));
  renderPrintableWindow(items, `Relatório Geral — ${document.getElementById('tx-current-period-display').textContent}`);
}

function renderPrintableWindow(items, title) {
  if (items.length === 0) {
    showToast('Nenhum dado para emitir relatório!');
    return;
  }

  const totalIn = items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOut = items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const bal = totalIn - totalOut;

  const rows = items.map(t => {
    const cat = AppState.categories.find(c => c.id === t.category)?.name || 'Geral';
    return `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${formatFriendlyDate(t.date)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${t.name}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${cat}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${t.bank}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${t.paid ? 'Pago' : 'Pendente'}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; color: ${t.type === 'income' ? '#059669' : '#dc2626'}; font-weight: bold;">
          ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #1e293b; padding: 20px; }
        h2 { margin-bottom: 4px; }
        .meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; background: #f8fafc; padding: 8px 6px; border-bottom: 2px solid #cbd5e1; }
        .totals { margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; display: flex; gap: 20px; }
        .tot-item { font-size: 12px; font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      <div class="meta">Emitido em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')} · Total de registros: ${items.length}</div>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Conta</th>
            <th>Status</th>
            <th style="text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <span class="tot-item">Total Entradas: <span style="color: #059669;">${formatCurrency(totalIn)}</span></span>
        <span class="tot-item">Total Saídas: <span style="color: #dc2626;">${formatCurrency(totalOut)}</span></span>
        <span class="tot-item">Saldo Líquido: <span style="color: ${bal >= 0 ? '#059669' : '#dc2626'};">${formatCurrency(bal)}</span></span>
      </div>
      <script>
        window.onload = function() { window.print(); }
      <\/script>
    </body>
    </html>
  `;

  const printWin = window.open('', '', 'width=850,height=600');
  printWin.document.write(html);
  printWin.document.close();
}

function exportQuickStatement() {
  const monthsNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthName = monthsNames[AppState.selectedMonth];
  const yr = AppState.selectedYear;
  const currentPeriodPrefix = `${yr}-${String(AppState.selectedMonth + 1).padStart(2, '0')}`;

  // Filtra as transações pertencentes ao mês ativo no cabeçalho
  const data = AppState.transactions.filter(t => t.date && t.date.startsWith(currentPeriodPrefix));

  const fmt = v => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Verificação de atraso para status
  function getStatusInfo(t) {
    if (t.paid) return { text: '✓ Pago', color: '#1D9E75' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = t.date.split('-').map(Number);
    const txDate = new Date(y, m - 1, d);
    if (txDate < today) return { text: '✗ Atrasado', color: '#E24B4A' };
    return { text: '⏳ Pendente', color: '#BA7517' };
  }

  // Cálculos do Resumo
  const incPaid = data.filter(t => t.type === 'income' && t.paid).reduce((s, t) => s + t.amount, 0);
  const incAll = data.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expPaid = data.filter(t => t.type === 'expense' && t.paid).reduce((s, t) => s + t.amount, 0);
  const expAll = data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const incPaidCt = data.filter(t => t.type === 'income' && t.paid).length;
  const incPendCt = data.filter(t => t.type === 'income' && !t.paid).length;
  const expPaidCt = data.filter(t => t.type === 'expense' && t.paid).length;
  const expPendCt = data.filter(t => t.type === 'expense' && !t.paid).length;

  const saldoReal = incPaid - expPaid;
  const saldoPrev = incAll - expAll;
  const saldoRC = saldoReal >= 0 ? '#1D9E75' : '#E24B4A';
  const saldoPC = saldoPrev >= 0 ? '#1D9E75' : '#E24B4A';

  const typeNames = { income: 'Receita', expense: 'Despesa', transfer: 'Transferência' };

  // Agrupamento por Data (ordenado por dia decrescente)
  const groups = {};
  data.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  let rows = '';
  Object.keys(groups).forEach(dateStr => {
    const [y, m, d] = dateStr.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    rows += `<tr><td colspan="5" style="padding:10px 14px 4px;font-size:11px;font-weight:700;color:#999;letter-spacing:.5px;text-transform:uppercase;border-top:1px solid #f0f0ee">${formattedDate}</td></tr>`;
    
    groups[dateStr].forEach(t => {
      const isIncome = t.type === 'income';
      const amtColor = isIncome ? '#1D9E75' : '#E24B4A';
      const amtTxt = (isIncome ? '+ R$ ' : '- R$ ') + fmt(t.amount);
      const cat = AppState.categories.find(c => c.id === t.category) || { icon: '💳', color: '#1D9E75' };
      const iconBg = (cat.color || '#1D9E75') + '22';
      const iconFg = cat.color || '#1D9E75';
      const sub = t.installments ? `<span style="font-size:11px;color:#bbb;margin-left:4px;font-weight:400">${t.installments}</span>` : '';
      const status = getStatusInfo(t);

      rows += `
        <tr style="border-bottom:1px solid #f5f5f3">
          <td style="padding:10px 14px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:30px;height:30px;border-radius:50%;background:${iconBg};color:${iconFg};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${cat.icon || '💳'}</div>
              <div><span style="font-size:13px;font-weight:600">${t.name}</span>${sub}</div>
            </div>
          </td>
          <td style="padding:10px 14px;font-size:12px;color:#888">${typeNames[t.type] || t.type}</td>
          <td style="padding:10px 14px;font-size:12px;color:#555">${t.bank || '—'}</td>
          <td style="padding:10px 14px;font-size:12px;font-weight:600;color:${status.color}">${status.text}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:700;text-align:right;color:${amtColor}">${amtTxt}</td>
        </tr>
      `;
    });
  });

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const reportHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Extrato — ${monthName} ${yr}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a18; background: #f7f7f5; padding: 36px 40px; max-width: 920px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 2px solid #1D9E75; background: #f7f7f5; }
        .logo-wrap { display: flex; align-items: center; gap: 10px; }
        .logo-box { width: 34px; height: 34px; background: #1D9E75; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; }
        .logo-name { font-size: 18px; font-weight: 700; }
        .header-right { text-align: right; }
        .h-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        .h-badge { display: inline-block; background: #E1F5EE; color: #085041; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 99px; margin-bottom: 3px; }
        .h-date { font-size: 11px; color: #aaa; font-style: italic; }
        .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .card { border: 1px solid #e0e0de; border-radius: 10px; padding: 16px 18px; background: #fff; }
        .c-label { font-size: 9px; text-transform: uppercase; letter-spacing: .8px; color: #999; font-weight: 700; margin-bottom: 8px; }
        .c-real { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
        .c-sub { font-size: 11px; color: #aaa; margin-bottom: 12px; }
        .c-div { height: 1px; background: #eee; margin-bottom: 10px; }
        .c-plabel { font-size: 9px; color: #aaa; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
        .c-pval { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .c-psub { font-size: 10px; color: #aaa; }
        .green { color: #1D9E75; } .red { color: #E24B4A; }
        .table-wrap { background: #fff; border-radius: 10px; border: 1px solid #e0e0de; overflow: hidden; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid #e0e0de; background: #fafaf8; }
        thead th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #aaa; }
        thead th.right { text-align: right; }
        .footer { margin-top: 16px; display: flex; justify-content: space-between; font-size: 10px; color: #bbb; font-style: italic; }
        .no-print { text-align: center; margin-top: 22px; display: flex; gap: 12px; justify-content: center; }
        .btn-p { padding: 10px 28px; background: #1D9E75; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 700; }
        .btn-c { padding: 10px 22px; background: #f0f0ee; color: #555; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
        @media print { .no-print { display: none !important; } body { background: #fff; padding: 20px 28px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-wrap">
          <div class="logo-box">🌿</div>
          <span class="logo-name">Finanzio</span>
        </div>
        <div class="header-right">
          <div class="h-title">Extrato &mdash; ${monthName} ${yr}</div>
          <div class="h-badge">Todos os lançamentos</div><br>
          <span class="h-date">Gerado em ${today}</span>
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="c-label">Receitas realizadas</div>
          <div class="c-real green">R$ ${fmt(incPaid)}</div>
          <div class="c-sub">${incPaidCt} recebida${incPaidCt !== 1 ? 's' : ''}</div>
          <div class="c-div"></div>
          <div class="c-plabel">Previsto</div>
          <div class="c-pval">R$ ${fmt(incAll)}</div>
          <div class="c-psub">${incPendCt} a receber</div>
        </div>
        <div class="card">
          <div class="c-label">Despesas pagas</div>
          <div class="c-real red">R$ ${fmt(expPaid)}</div>
          <div class="c-sub">${expPaidCt} paga${expPaidCt !== 1 ? 's' : ''}</div>
          <div class="c-div"></div>
          <div class="c-plabel">Previsto</div>
          <div class="c-pval">R$ ${fmt(expAll)}</div>
          <div class="c-psub">${expPendCt} a pagar</div>
        </div>
        <div class="card">
          <div class="c-label">Saldo realizado</div>
          <div class="c-real" style="color:${saldoRC}">${saldoReal < 0 ? 'R$ - ' : 'R$ '}${fmt(Math.abs(saldoReal))}</div>
          <div class="c-sub">receitas - despesas pagas</div>
          <div class="c-div"></div>
          <div class="c-plabel">Saldo previsto</div>
          <div class="c-pval" style="color:${saldoPC}">${saldoPrev < 0 ? 'R$ - ' : 'R$ '}${fmt(Math.abs(saldoPrev))}</div>
          <div class="c-psub">incluindo pendentes</div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Conta</th>
              <th>Status</th>
              <th class="right">Valor</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888">Nenhum lançamento no período.</td></tr>'}</tbody>
        </table>
      </div>

      <div class="footer">
        <span>Finanzio &mdash; Controle Financeiro</span>
        <span>${data.length} lançamento${data.length !== 1 ? 's' : ''} &middot; Todos os lançamentos &middot; ${monthName} ${yr}</span>
      </div>

      <div class="no-print">
        <button class="btn-p" onclick="window.print()">Imprimir / Salvar PDF</button>
        <button class="btn-c" onclick="window.close()">Fechar</button>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) win.focus();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}