function switchScreen(screenId) {
  AppState.currentScreen = screenId;
  if (screenId === 'transactions') {
    const today = new Date();
    AppState.selectedYear = today.getFullYear();
    AppState.selectedMonth = today.getMonth();
  }
  document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
  const activeSec = document.getElementById(`screen-${screenId}`);
  if (activeSec) activeSec.classList.remove('hidden');

  const isTx = (screenId === 'transactions');
  const showNewAction = isTx || screenId === 'dashboard';
  const periodCtrl = document.getElementById('header-period-controls');
  const actionBtn = document.getElementById('header-action-button-container');
  const filterBtn = document.getElementById('header-filter-btn');

  if (periodCtrl) periodCtrl.style.display = isTx ? 'flex' : 'none';
  if (actionBtn) actionBtn.style.display = showNewAction ? 'block' : 'none';
  if (filterBtn) filterBtn.style.display = isTx ? 'block' : 'none';

  document.querySelectorAll('.nav-item').forEach(btn => {
    const text = btn.querySelector('.sidebar-text')?.textContent?.toLowerCase() || '';
    const isMatch = (screenId === 'dashboard' && text.includes('dashboard')) ||
                    (screenId === 'transactions' && text.includes('lançamentos')) ||
                    (screenId === 'budgets' && text.includes('orçamentos')) ||
                    (screenId === 'goals' && text.includes('metas')) ||
                    (screenId === 'accounts' && text.includes('contas')) ||
                    (screenId === 'categories' && text.includes('categorias')) ||
                    (screenId === 'reports' && text.includes('relatórios'));

    btn.className = isMatch 
      ? 'nav-item active w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors text-brand-600 bg-brand-50/80 dark:bg-brand-500/10 dark:text-brand-400'
      : 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100';
  });

  const titles = {
    dashboard: 'Dashboard Geral',
    transactions: 'Livro de Lançamentos',
    budgets: 'Orçamentos & Tetos',
    goals: 'Metas Financeiras',
    accounts: 'Contas & Cartões',
    categories: 'Gerenciador de Categorias',
    reports: 'Relatórios & BI'
  };
  document.getElementById('page-title').textContent = titles[screenId] || 'Finanzio';

  if (screenId === 'dashboard') {
    updateDashboardMetrics();
  } else if (screenId === 'transactions') {
    renderTransactionsList();
  } else if (screenId === 'budgets') {
    renderBudgetsScreen();
  } else if (screenId === 'goals') {
    renderGoalsScreen();
  } else if (screenId === 'accounts') {
    renderAccountsScreen();
  } else if (screenId === 'categories') {
    renderCategoriesScreen();
  } else if (screenId === 'reports') {
    renderReportsChart();
  }

  const sb = document.getElementById('sidebar');
  if (!sb.classList.contains('-translate-x-full')) toggleMobileSidebar();
}

function changeTxPeriod(offset) {
  AppState.selectedMonth += offset;
  if (AppState.selectedMonth > 11) {
    AppState.selectedMonth = 0;
    AppState.selectedYear += 1;
  } else if (AppState.selectedMonth < 0) {
    AppState.selectedMonth = 11;
    AppState.selectedYear -= 1;
  }
  
  const monthsNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  document.getElementById('tx-current-period-display').textContent = `${monthsNames[AppState.selectedMonth]} ${AppState.selectedYear}`;
  renderTransactionsList();
  updateDashboardMetrics();
}

function toggleMonthPickerDropdown() {
  const drop = document.getElementById('month-picker-dropdown');
  const isHidden = drop.classList.contains('hidden');
  if (isHidden) {
    const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const container = document.getElementById('quick-month-selector');
    container.innerHTML = monthsShort.map((m, i) => `
      <button onclick="selectQuickMonth(${i})" class="py-1 px-2 rounded-lg ${i === AppState.selectedMonth ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}">
        ${m}
      </button>
    `).join('');
    drop.classList.remove('hidden');
  } else {
    drop.classList.add('hidden');
  }
}

function toggleTransactionFilters() {
  const filterBar = document.getElementById('tx-filter-bar-container');
  const headerFilterButton = document.getElementById('header-filter-btn');
  const filteredReportButton = document.getElementById('tx-filtered-report-btn');
  const periodReportButton = document.getElementById('tx-period-report-btn');
  if (!filterBar || !filteredReportButton || !periodReportButton) return;

  const isOpening = filterBar.classList.contains('hidden');
  filterBar.classList.toggle('hidden', !isOpening);
  if (headerFilterButton) {
    headerFilterButton.setAttribute('aria-expanded', String(isOpening));
  }

  periodReportButton.classList.toggle('hidden', isOpening);
  filteredReportButton.style.order = isOpening ? '2' : '1';
  periodReportButton.style.order = '2';
}

function selectQuickMonth(mIndex) {
  AppState.selectedMonth = mIndex;
  document.getElementById('month-picker-dropdown').classList.add('hidden');
  renderTransactionsList();
  updateDashboardMetrics();
}

function exportJSONBackup() {
  const data = {
    version: '1.2',
    exportDate: new Date().toISOString(),
    categories: AppState.categories,
    accounts: AppState.accounts,
    budgets: AppState.budgets,
    goals: AppState.goals,
    transactions: AppState.transactions
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Finanzio_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup JSON exportado com sucesso!');
}

function importJSONBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.transactions && parsed.accounts) {
        AppState.categories = parsed.categories || AppState.categories;
        AppState.accounts = parsed.accounts || AppState.accounts;
        AppState.budgets = parsed.budgets || AppState.budgets;
        AppState.goals = parsed.goals || AppState.goals;
        AppState.transactions = parsed.transactions || AppState.transactions;
        persistState();
        populateSelectOptions();
        updateDashboardMetrics();
        showToast('Dados restaurados com sucesso!');
      } else {
        showToast('Arquivo de backup inválido!');
      }
    } catch (err) {
      showToast('Erro ao ler arquivo JSON!');
    }
  };
  reader.readAsText(file);
}

// Fechamento de Menus e Popups ao clicar fora
document.addEventListener('click', (e) => {
  const actionContainer = document.getElementById('header-action-button-container');
  const actionMenu = document.getElementById('new-action-menu');
  if (actionContainer && actionMenu && !actionContainer.contains(e.target)) {
    actionMenu.classList.add('hidden');
  }

  const monthPicker = document.getElementById('month-picker-dropdown');
  const periodControls = document.getElementById('header-period-controls');
  if (monthPicker && periodControls && !periodControls.contains(e.target)) {
    monthPicker.classList.add('hidden');
  }
});

// Ponto de Entrada da Aplicação
window.addEventListener('DOMContentLoaded', () => {
  initStorage();
  updateValuesVisibilityButton();
  populateSelectOptions();
  switchScreen('transactions');
  updateDashboardMetrics();
  renderCashflowChart();
  renderGastosDonut();
  syncFromFirebase();
});