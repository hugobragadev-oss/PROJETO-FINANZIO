// Funções Utilitárias: Formatação e Sanitização
function formatCurrency(val) {
  return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCurrencyString(str) {
  if (typeof str === 'number') return str;
  const clean = (str || '0').replace(/[^\d,-]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

function formatCurrencyInput(input) {
  let v = input.value.replace(/\D/g, '');
  if (!v) { input.value = ''; return; }
  v = (parseInt(v, 10) / 100).toFixed(2);
  v = v.replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  input.value = v;
}

function formatFriendlyDate(dateStr, includeDayName = false) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return includeDayName
    ? d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    : `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}