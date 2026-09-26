const DEFAULT_CATEGORIES = [
  { id: 'housing', name: 'Casa', icon: '🏠', color: '#3b82f6', type: 'expense' },
  { id: 'food', name: 'Alimentação', icon: '🍽️', color: '#f59e0b', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#64748b', type: 'expense' },
  { id: 'health', name: 'Saúde', icon: '🏥', color: '#ec4899', type: 'expense' },
  { id: 'leisure', name: 'Lazer', icon: '🎬', color: '#8b5cf6', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: '#f97316', type: 'expense' },
  { id: 'income_salary', name: 'Salário Principal', icon: '💼', color: '#10b981', type: 'income' },
  { id: 'income_invest', name: 'Rendimentos', icon: '📈', color: '#06b6d4', type: 'income' },
  { id: 'income_extra', name: 'Renda Extra', icon: '⭐', color: '#eab308', type: 'income' }
];

const DEFAULT_ACCOUNTS = [
  { id: 'acc_1', name: 'Bradesco', type: 'bank', agency: '001', initialBalance: 3450.50, color: '#dc2626' },
  { id: 'acc_2', name: 'Santander', type: 'bank', agency: '033', initialBalance: 1280.00, color: '#ef4444' },
  { id: 'acc_3', name: 'Reserva Emergência', type: 'bank', agency: '260', initialBalance: 14500.00, color: '#10b981' },
  { id: 'card_1', name: 'Bradesco Elo', type: 'card', limit: 12000, initialBill: 0, due: 15, color: '#b91c1c' },
  { id: 'card_2', name: 'Itaú Personalité', type: 'card', limit: 25000, initialBill: 0, due: 20, color: '#ea580c' }
];

const DEFAULT_BUDGETS = [
  { id: 'b_1', categoryId: 'food', limit: 1800 },
  { id: 'b_2', categoryId: 'housing', limit: 3000 },
  { id: 'b_3', categoryId: 'transport', limit: 700 },
  { id: 'b_4', categoryId: 'leisure', limit: 600 },
  { id: 'b_5', categoryId: 'health', limit: 500 }
];

function normalizeBudget(budget, index = 0) {
  const categoryValues = [
    budget.categoryId,
    budget.category_id,
    budget.category,
    budget.cat,
    budget.categoryName,
    budget.category_name,
    budget.name
  ].map(value => value && typeof value === 'object' ? value.id ?? value.name : value)
    .filter(value => value !== undefined && value !== null && value !== '');
  const normalizedValues = categoryValues.map(value =>
    String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  );
  const category = AppState.categories.find(item => {
    const categoryId = String(item.id).toLowerCase();
    const categoryName = item.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return normalizedValues.includes(categoryId) || normalizedValues.includes(categoryName);
  });

  return {
    ...budget,
    id: String(budget.id ?? budget._id ?? `b_legacy_${index}`),
    categoryId: category ? category.id : String(categoryValues[0] ?? ''),
    limit: Number(budget.limit ?? budget.amount) || 0
  };
}

function normalizeAccount(account, index = 0) {
  const accountType = String(account.type || '').toLowerCase();
  const type = ['card', 'credit', 'credit-card', 'credit_card', 'cartao', 'cartão'].includes(accountType)
    || account.limit !== undefined
    ? 'card'
    : 'bank';
  const due = Number(account.due) || 15;

  return {
    ...account,
    id: String(account.id ?? account._id ?? `account_legacy_${index}`),
    type,
    initialBalance: Number(account.initialBalance ?? account.balance) || 0,
    initialBill: Number(account.initialBill ?? account.bill) || 0,
    ...(type === 'card' ? {
      limit: Number(account.limit) || 0,
      due,
      closingDay: Number(account.closingDay ?? account.closing ?? account.closeDay) || due
    } : {})
  };
}

const DEFAULT_GOALS = [
  { id: 'g_1', name: 'Viagem 2026', icon: '✈️', current: 14200, total: 25000, date: '2026-11', color: '#3b82f6' },
  { id: 'g_2', name: 'Reserva de Emergência', icon: '🛡️', current: 28000, total: 50000, date: '2027-06', color: '#10b981' },
  { id: 'g_3', name: 'Reserva de Oportunidades', icon: '💎', current: 18500, total: 20000, date: '2026-08', color: '#f59e0b' }
];

const DEFAULT_TRANSACTIONS = [
  { id: 'tx_1', name: 'Salário Hugo (Mensal)', type: 'income', amount: 5500.00, date: '2026-05-05', bank: 'Bradesco', category: 'income_salary', paid: true, obs: 'Crédito em conta' },
  { id: 'tx_2', name: 'Salário Itamara', type: 'income', amount: 3800.00, date: '2026-05-06', bank: 'Santander', category: 'income_salary', paid: true, obs: '' },
  { id: 'tx_3', name: 'Parcela Apartamento (14/360)', type: 'expense', amount: 2350.00, date: '2026-05-10', bank: 'Bradesco', category: 'housing', paid: true, obs: 'Financiamento habitacional' },
  { id: 'tx_4', name: 'Supermercado Mensal', type: 'expense', amount: 890.40, date: '2026-05-12', bank: 'Bradesco Elo', category: 'food', paid: true, obs: '' },
  { id: 'tx_5', name: 'Plano de Saúde', type: 'expense', amount: 620.00, date: '2026-05-15', bank: 'Bradesco', category: 'health', paid: true, obs: '' },
  { id: 'tx_6', name: 'Gasolina & Posto', type: 'expense', amount: 240.00, date: '2026-05-18', bank: 'Bradesco Elo', category: 'transport', paid: true, obs: '' },
  { id: 'tx_7', name: 'Jantar Restaurante Italiano', type: 'expense', amount: 180.00, date: '2026-05-20', bank: 'Itaú Personalité', category: 'food', paid: true, obs: '' },
  { id: 'tx_8', name: 'Rendimentos Fundos', type: 'income', amount: 480.00, date: '2026-05-22', bank: 'Reserva Emergência', category: 'income_invest', paid: true, obs: '' },
  { id: 'tx_9', name: 'Energia Elétrica', type: 'expense', amount: 310.20, date: '2026-05-26', bank: 'Bradesco', category: 'housing', paid: false, obs: 'Vence no fim do mês' },
  { id: 'tx_10', name: 'Condomínio Residencial', type: 'expense', amount: 480.00, date: '2026-05-28', bank: 'Bradesco', category: 'housing', paid: false, obs: '' },
  { id: 'tx_11', name: 'Internet Fibra 600MB', type: 'expense', amount: 119.90, date: '2026-05-29', bank: 'Santander', category: 'housing', paid: false, obs: '' }
];

let AppState = {
  theme: 'dark',
  currentScreen: 'transactions',
  selectedYear: 2026,
  selectedMonth: 4,
  categories: [],
  accounts: [],
  budgets: [],
  goals: [],
  transactions: [],
  activeDrawerTxId: null,
  modalTxType: 'expense',
  modalRecurMode: 'none',
  charts: { flow: null, donut: null, reports: null }
};

let transactionSyncRevision = 0;
let pendingTransactionSyncWrites = 0;

function fbReady() { return window._fbReady && window._fbDB; }

async function waitForFirebase(timeout = 6000) {
  if (fbReady()) return true;
  return new Promise(resolve => {
    const t = setTimeout(() => resolve(false), timeout);
    document.addEventListener('firebase-ready', () => {
      clearTimeout(t);
      resolve(true);
    }, { once: true });
  });
}

async function fbSave(colName, docId, data) {
  const tracksTransactions = colName === 'transactions';
  if (tracksTransactions) transactionSyncRevision++;
  if (!fbReady()) return;
  if (tracksTransactions) pendingTransactionSyncWrites++;
  try {
    const clean = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) clean[k] = v === '' ? null : v;
    });
    await window._fbDB.collection(colName).doc(String(docId)).set(clean, { merge: true });
  } catch (e) {
    console.warn(`Erro ao salvar no Firebase [${colName}]:`, e);
  } finally {
    if (tracksTransactions) pendingTransactionSyncWrites--;
  }
}

async function fbDelete(colName, docId) {
  const tracksTransactions = colName === 'transactions';
  if (tracksTransactions) transactionSyncRevision++;
  if (!fbReady()) return;
  if (tracksTransactions) pendingTransactionSyncWrites++;
  try {
    await window._fbDB.collection(colName).doc(String(docId)).delete();
  } catch (e) {
    console.warn(`Erro ao excluir do Firebase [${colName}]:`, e);
  } finally {
    if (tracksTransactions) pendingTransactionSyncWrites--;
  }
}

async function fbGetAll(colName) {
  if (!fbReady()) return null;
  try {
    const snap = await window._fbDB.collection(colName).get();
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (e) {
    console.warn(`Erro ao buscar [${colName}]:`, e);
    return null;
  }
}

async function syncFromFirebase() {
  const syncRevision = transactionSyncRevision;
  const pendingWritesAtSyncStart = pendingTransactionSyncWrites;
  const ready = await waitForFirebase();
  if (!ready) return;

  try {
    const [fbTx, fbGoals, fbBudgets, fbAccounts] = await Promise.all([
      fbGetAll('transactions'),
      fbGetAll('goals'),
      fbGetAll('budgets'),
      fbGetAll('accounts')
    ]);

    let updated = false;

    const transactionsUnchangedDuringSync = transactionSyncRevision === syncRevision
      && pendingWritesAtSyncStart === 0
      && pendingTransactionSyncWrites === 0;
    if (fbTx && fbTx.length > 0 && transactionsUnchangedDuringSync) {
      AppState.transactions = fbTx.map(t => {
        let d = t.date;
        if (d && d.includes('/')) {
          const p = d.split('/');
          if (p.length === 3) d = (p[2].length === 2 ? '20' + p[2] : p[2]) + '-' + p[1].padStart(2, '0') + '-' + p[0].padStart(2, '0');
        }
        return {
          id: t.id || t._id || ('tx_' + Math.random().toString(36).slice(2)),
          name: t.name || 'Sem título',
          type: t.type || (t.amount < 0 ? 'expense' : 'income'),
          amount: Math.abs(t.amount || 0),
          date: d || new Date().toISOString().split('T')[0],
          bank: t.bank || 'Bradesco',
          accountId: t.accountId ? String(t.accountId) : '',
          category: t.cat || t.category || 'housing',
          paid: !!t.paid,
          obs: t.obs || '',
          createdAt: t.createdAt || '',
          installments: t.sub || (t.instTotal ? `${t.instNum || 1}/${t.instTotal}` : ''),
          installmentGroupId: t.installmentGroupId || ''
        };
      });
      updated = true;
    }

    if (fbGoals && fbGoals.length > 0) {
      AppState.goals = fbGoals;
      updated = true;
    }

    if (fbBudgets) {
      AppState.budgets = fbBudgets.map((budget, index) => normalizeBudget(budget, index));
      updated = true;
    }

    if (fbAccounts) {
      AppState.accounts = fbAccounts.map((account, index) => normalizeAccount(account, index));
      updated = true;
    }

    if (updated) {
      persistState();
      populateSelectOptions();
      updateDashboardMetrics();
      renderTransactionsList();
      showToast('☁️ Dados sincronizados com o banco!');
    }
  } catch (err) {
    console.error('Falha ao sincronizar dados do Firebase:', err);
  }
}

function initStorage() {
  const savedTheme = localStorage.getItem('finanzio_theme') || 'dark';
  AppState.theme = savedTheme;
  applyTheme(savedTheme);

  AppState.categories = JSON.parse(localStorage.getItem('finanzio_categories')) || DEFAULT_CATEGORIES;
  
  const storedAccounts = JSON.parse(localStorage.getItem('finanzio_accounts'));
  if (storedAccounts) {
    AppState.accounts = storedAccounts.map((account, index) => normalizeAccount(account, index));
  } else {
    AppState.accounts = DEFAULT_ACCOUNTS;
  }

  const storedBudgets = JSON.parse(localStorage.getItem('finanzio_budgets'));
  AppState.budgets = (storedBudgets || DEFAULT_BUDGETS).map((budget, index) => normalizeBudget(budget, index));
  AppState.goals = JSON.parse(localStorage.getItem('finanzio_goals')) || DEFAULT_GOALS;
  AppState.transactions = JSON.parse(localStorage.getItem('finanzio_transactions')) || DEFAULT_TRANSACTIONS;
}

function persistState() {
  try {
    localStorage.setItem('finanzio_categories', JSON.stringify(AppState.categories));
    localStorage.setItem('finanzio_accounts', JSON.stringify(AppState.accounts));
    localStorage.setItem('finanzio_budgets', JSON.stringify(AppState.budgets));
    localStorage.setItem('finanzio_goals', JSON.stringify(AppState.goals));
    localStorage.setItem('finanzio_transactions', JSON.stringify(AppState.transactions));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

function getDynamicAccountBalance(acc) {
  if (acc.type === 'bank') {
    let bal = acc.initialBalance || 0;
    AppState.transactions.forEach(t => {
      if (!t.paid) return;
      if (transactionBelongsToAccount(t, acc)) {
        if (t.type === 'income') bal += t.amount;
        else if (t.type === 'expense') bal -= t.amount;
        else if (t.type === 'transfer') bal -= t.amount;
      }
      if (t.type === 'transfer' && t.destinationBank === acc.name) {
        bal += t.amount;
      }
    });
    return bal;
  } else {
    let bill = acc.initialBill || 0;
    const currentInvoicePeriod = getCardCurrentInvoicePeriod(acc);
    AppState.transactions.forEach(t => {
      if (transactionBelongsToAccount(t, acc) && t.type === 'expense'
        && getCardInvoicePeriod(acc, t.date) === currentInvoicePeriod) {
        bill += t.amount;
      }
    });
    return bill;
  }
}

function getCardOutstandingBalance(account, today = new Date()) {
  const currentInvoicePeriod = getCardCurrentInvoicePeriod(account, today);
  return (Number(account.initialBill) || 0) + AppState.transactions.reduce((total, transaction) => {
    const invoicePeriod = getCardInvoicePeriod(account, transaction.date);
    if (transactionBelongsToAccount(transaction, account)
      && transaction.type === 'expense'
      && invoicePeriod >= currentInvoicePeriod) {
      return total + (Number(transaction.amount) || 0);
    }
    return total;
  }, 0);
}

function transactionBelongsToAccount(transaction, account) {
  return (transaction.accountId && String(transaction.accountId) === String(account.id))
    || transaction.bank === account.name;
}

function getCardInvoicePeriod(account, date) {
  if (!date) return '';
  const [yearValue, monthValue, dayValue] = date.split('-').map(Number);
  if (!yearValue || !monthValue || !dayValue) return '';

  const closingDay = Number(account.closingDay ?? account.due) || 15;
  const invoiceDate = new Date(yearValue, monthValue - 1 + (dayValue > closingDay ? 1 : 0), 1);
  return `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
}

function getCardCurrentInvoicePeriod(account, today = new Date()) {
  const closingDay = Number(account.closingDay ?? account.due) || 15;
  const invoiceDate = new Date(today.getFullYear(), today.getMonth() + (today.getDate() > closingDay ? 1 : 0), 1);
  return `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
}

function getCategoryCurrentSpending(categoryId, year, month) {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return AppState.transactions
    .filter(t => t.type === 'expense' && t.category === categoryId && t.date.startsWith(monthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);
}