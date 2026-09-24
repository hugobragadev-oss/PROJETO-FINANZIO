function renderCashflowChart() {
  const canvas = document.getElementById('flowCanvas');
  if (!canvas) return;
  if (AppState.charts.flow) AppState.charts.flow.destroy();

  const isDark = AppState.theme === 'dark';
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const incData = Array(12).fill(0);
  const expData = Array(12).fill(0);

  AppState.transactions.forEach(t => {
    const parts = t.date.split('-');
    if (parts.length >= 2 && parseInt(parts[0]) === AppState.selectedYear) {
      const m = parseInt(parts[1]) - 1;
      if (t.type === 'income') incData[m] += t.amount;
      if (t.type === 'expense') expData[m] += t.amount;
    }
  });

  AppState.charts.flow = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Receitas', data: incData, backgroundColor: '#10b981', borderRadius: 6, barPercentage: 0.6 },
        { label: 'Despesas', data: expData, backgroundColor: '#f43f5e', borderRadius: 6, barPercentage: 0.6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: isDark ? '#94a3b8' : '#475569', font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }, boxWidth: 10, boxHeight: 10 }
        },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 10 } } },
        y: {
          grid: { color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
          ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 10 }, callback: (v) => `R$${v >= 1000 ? v / 1000 + 'k' : v}` }
        }
      }
    }
  });
}

function renderGastosDonut() {
  const canvas = document.getElementById('gastosDonutCanvas');
  if (!canvas) return;
  if (AppState.charts.donut) AppState.charts.donut.destroy();

  const currentMonthStr = `${AppState.selectedYear}-${String(AppState.selectedMonth + 1).padStart(2, '0')}`;
  const expenses = AppState.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr));
  const catTotals = {};

  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  const labels = [];
  const data = [];
  const colors = [];

  Object.entries(catTotals).forEach(([catId, total]) => {
    const c = AppState.categories.find(item => item.id === catId) || { name: 'Outros', color: '#94a3b8' };
    labels.push(c.name);
    data.push(total);
    colors.push(c.color);
  });

  if (data.length === 0) {
    labels.push('Sem gastos');
    data.push(1);
    colors.push('#334155');
  }

  AppState.charts.donut = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}` } } }
    }
  });

  const legendEl = document.getElementById('dash-gastos-legend');
  if (!legendEl) return;
  const totalAll = data.reduce((a, b) => a + b, 0) || 1;
  legendEl.innerHTML = labels.slice(0, 4).map((lbl, idx) => {
    const pct = Math.round((data[idx] / totalAll) * 100);
    return `
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${colors[idx]}"></span>
          <span class="text-slate-600 dark:text-slate-300 font-medium">${lbl}</span>
        </div>
        <span class="font-bold text-slate-800 dark:text-slate-200">${pct}%</span>
      </div>
    `;
  }).join('');
}

function renderReportsChart() {
  const canvas = document.getElementById('reportComparisonCanvas');
  if (!canvas) return;
  if (AppState.charts.reports) AppState.charts.reports.destroy();

  const isDark = AppState.theme === 'dark';
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const incData = Array(12).fill(0);
  const expData = Array(12).fill(0);
  const netData = Array(12).fill(0);

  AppState.transactions.forEach(t => {
    const parts = t.date.split('-');
    if (parts.length >= 2 && parseInt(parts[0]) === AppState.selectedYear) {
      const m = parseInt(parts[1]) - 1;
      if (t.type === 'income') incData[m] += t.amount;
      if (t.type === 'expense') expData[m] += t.amount;
    }
  });

  let accumulated = 0;
  for (let i = 0; i < 12; i++) {
    accumulated += (incData[i] - expData[i]);
    netData[i] = accumulated;
  }

  AppState.charts.reports = new Chart(canvas, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'Receitas (R$)', data: incData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.3, fill: true },
        { label: 'Despesas (R$)', data: expData, borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.1)', tension: 0.3, fill: true },
        { label: 'Resultado Acumulado', data: netData, borderColor: '#38bdf8', borderDash: [5, 5], tension: 0.3, fill: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: isDark ? '#94a3b8' : '#475569' } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: isDark ? '#64748b' : '#94a3b8' } },
        y: {
          grid: { color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)' },
          ticks: { color: isDark ? '#64748b' : '#94a3b8', callback: (v) => formatCurrency(v) }
        }
      }
    }
  });
}