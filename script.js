
// Variables and State
const expectedHeaders = ['date','type','category','amount'];
let parsedData = [];
let charts = { pie: null, bar: null };

// DOM EleMents (DOM ManiPulation)
const fileInput = document.getElementById('fileInput');
const useSampleBtn = document.getElementById('useSample');  
const downloadSampleBtn = document.getElementById('downloadSample'); 
const statusEl = document.getElementById('status');
const skippedRowsEl = document.getElementById('skippedRows');
const mappingModal = document.getElementById('mappingModal');
const dateCol = document.getElementById('dateCol');
const typeCol = document.getElementById('typeCol');
const catCol = document.getElementById('catCol');
const amtCol = document.getElementById('amtCol');
const mappingForm = document.getElementById('mappingForm');
const cancelMapping = document.getElementById('cancelMapping');

const tranTableBody = document.querySelector('#tranTable tbody');
const pieC = document.getElementById('pieChart').getContext('2d');
const barC = document.getElementById('barChart').getContext('2d');


function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? 'var(--Loss)' : 'var(--grey)';
}

function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase();
}

function formatCurrency(num) {
  if (!isFinite(num)) num = 0;
  return '₹' + Number(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// DownLoad or Use saMple data
function downloadSample() {
  const wb = XLSX.utils.book_new();
  const data = [
    ['Date','Type','Category','Amount'],
    ['2025-01-01','Income','Salary',5000],
    ['2025-01-02','Expense','Grocery',200],
    ['2025-01-03','Expense','Transport',50],
    ['2025-01-04','Expense','Entertainment',300],
    ['2025-01-05','Income','Freelance',1200]
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, 'sample_finance.xlsx');
}

// Implementing event listeners
downloadSampleBtn.addEventListener('click', downloadSample);

useSampleBtn.addEventListener('dblclick', () => {
  const rows = [
    ['Date','Type','Category','Amount'],
    ['2025-01-01','Income','Salary',5000],
    ['2025-01-02','Expense','Grocery',200],
    ['2025-01-03','Expense','Transport',50],
    ['2025-01-04','Expense','Entertainment',300],
    ['2025-01-05','Income','Freelance',1200]
  ];
  // Directly process AoA (array-of-arrays)
  processParsedSheet(rows);
  setStatus('Sample data loaded into dashboard.');
});

// Parse RowS -> ReTurn ObjEcts WitH CapiTalized KeYs UseD By The Rest Of The LoGic
function parseToObjects(headers, rows, mapping) {
  return rows.map(row => {
    const Date = row[mapping.date] ?? '';
    const Type = row[mapping.type] ?? '';
    const Category = row[mapping.category] ?? '';
    const Amount = row[mapping.amount] ?? '';
    return { Date, Type, Category, Amount };
  });
}

// HanDle File Input AnD ParSing
fileInput.addEventListener('change', handleFile);

function handleFile(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    setStatus('No file selected', true); 
    return; 
  }
  setStatus('Reading file...');
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function(ev) {
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetAoA = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
      processParsedSheet(sheetAoA);
    } catch(err) {
      console.error(err);
      setStatus('Error parsing file', true);
    }
  };
 
}

function processParsedSheet(sheetAoA) {
  if (!sheetAoA || sheetAoA.length === 0) { setStatus('Empty or invalid sheet', true); return; }
  const headers = sheetAoA[0].map(normalizeHeader);
  const rows = sheetAoA.slice(1);
  const found = {};
  expectedHeaders.forEach(h => {
    const idx = headers.indexOf(h);
    if (idx !== -1) found[h] = idx;
  });
  const complete = expectedHeaders.every(h => found.hasOwnProperty(h));
  if (complete) {
    // use the indices found for mapping (keys: date,type,category,amount)
    parsedData = parseToObjects(headers, rows, {
      date: found.date,
      type: found.type,
      category: found.category,
      amount: found.amount
    });
    finalizeParsing();
  } else {
    showMapping(headers, rows);
  }
}

// FiNal ValiDation AnD CleaNup
function finalizeParsing() {
  const cleaned = [];
  const skipped = [];

  parsedData.forEach((r, i) => {
    // r.Amount might be number or string from SheetJS or user file
    let amtRaw = r.Amount;
    if (typeof amtRaw === 'string') {
      amtRaw = amtRaw.replace(/[^0-9.-]+/g, '').trim();
    }
    const amt = Number(amtRaw);
    const typeRaw = String(r.Type || '').toLowerCase().trim();

    // Finite amount (not 0) and type must be income/expense
    if (!isFinite(amt) || amt === 0 || (typeRaw !== 'income' && typeRaw !== 'expense')) {
      skipped.push(i + 2); // +2 to map to Excel row (header + 1-based)
    } else {
      cleaned.push({
        Date: r.Date || '',
        Type: typeRaw === 'income' ? 'Income' : 'Expense',
        Category: r.Category || 'Uncategorized',
        Amount: amt
      });
    }
  });

  parsedData = cleaned;
  localStorage.setItem('financeData', JSON.stringify(parsedData));
  setStatus(`Loaded ${parsedData.length} rows. ${skipped.length ? skipped.length + ' rows skipped.' : ''}`);
  if (skipped.length) {
    skippedRowsEl.style.color = 'var(--Loss)';
    skippedRowsEl.textContent = `Skipped rows due to invalid data: ${skipped.join(', ')}`;
  } else {
    skippedRowsEl.textContent = '';
  }

  showAll();
}

// Show Summary, Charts, Table
function showAll() {
  showSummary();
  showCharts();
  showTable();
}

function showSummary() {
  const totalIncome = parsedData.filter(t => t.Type === 'Income').reduce((s,x) => s + Number(x.Amount), 0);
  const totalExpense = parsedData.filter(t => t.Type === 'Expense').reduce((s,x) => s + Number(x.Amount), 0);
  const balance = totalIncome - totalExpense;
  const savings = balance;
  const expensePct = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0;

  document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
  document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
  document.getElementById('netBalance').textContent = formatCurrency(balance);
  document.getElementById('savings').textContent = formatCurrency(savings);
  document.getElementById('expensePct').textContent = `${expensePct}%`;

  const profitLossEl = document.getElementById('profitLoss');
  profitLossEl.textContent = `${balance >= 0 ? 'Profit: ' : 'Loss: '}${formatCurrency(Math.abs(balance))}`;
  const prolosscard = document.getElementById('profitLossCard');
  if (balance >= 0) { prolosscard.classList.add('positive'); prolosscard.classList.remove('negative'); }
  else { prolosscard.classList.remove('positive'); prolosscard.classList.add('negative'); }
}

function showCharts() {
  // DestRoy PreVious
  if (charts.pie) charts.pie.destroy();
  if (charts.bar) charts.bar.destroy();

  const totalIncome = parsedData.filter(t => t.Type === 'Income').reduce((s,x) => s + Number(x.Amount), 0);
  const totalExpense = parsedData.filter(t => t.Type === 'Expense').reduce((s,x) => s + Number(x.Amount), 0);
  const savings = Math.max(0, totalIncome - totalExpense);

  const expenseByCat = {};
  parsedData.filter(t => t.Type === 'Expense').forEach(r => {
    expenseByCat[r.Category] = (expenseByCat[r.Category] || 0) + Number(r.Amount);
  });

  let entries = Object.entries(expenseByCat).sort((a,b) => b[1] - a[1]);
  const TOP = 8;
  const top = entries.slice(0, TOP);
  const othersVal = entries.slice(TOP).reduce((s,e) => s + e[1], 0);

  const labels = top.map(e => e[0]);
  const data = top.map(e => e[1]);
  if (othersVal > 0) { labels.push('Other'); data.push(othersVal); }
  if (savings > 0) { labels.push('Savings'); data.push(savings); }

  charts.pie = new Chart(pieC, {
    type: 'pie',
    data: { labels, datasets: [{ data }] },
    options: { maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } } }
  });

  const barLabels = top.map(e => e[0]);
  const barData = top.map(e => e[1]);

  charts.bar = new Chart(barC, {
    type: 'bar',
    data: { labels: barLabels, datasets: [{ label: 'Expense Amount', data: barData }] },
    options: { 
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }, 
        plugins: { legend: { display: false } } }
  });
}

function showTable() {
  tranTableBody.innerHTML = '';
  parsedData.forEach((r,index) => {
    const tr = document.createElement('tr');
    // Serial Number
    const srTd = document.createElement('td');
    srTd.textContent = index + 1; // for 1-based numbering
    tr.appendChild(srTd);
    const dateTd = document.createElement('td'); 
    dateTd.textContent = r.Date || ''; tr.appendChild(dateTd);
    const typeTd = document.createElement('td'); 
    typeTd.textContent = r.Type; tr.appendChild(typeTd);
    const catTd = document.createElement('td'); 
    catTd.textContent = r.Category; tr.appendChild(catTd);
    const amtTd = document.createElement('td'); 
    amtTd.textContent = formatCurrency(r.Amount); tr.appendChild(amtTd);
    tranTableBody.appendChild(tr);
  });
}

// MoDal For MaPPing ColuMns
function showMapping(headers, rows) {
  [dateCol, typeCol, catCol, amtCol].forEach(sel => {
    sel.innerHTML = '';
    headers.forEach((h, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = h || `Column ${i+1}`;
      sel.appendChild(opt);
    });
  });
  mappingModal.classList.remove('hidden');

  mappingForm.onsubmit = (ev) => {
    ev.preventDefault();
    const mapping = {
      date: Number(dateCol.value),
      type: Number(typeCol.value),
      category: Number(catCol.value),
      amount: Number(amtCol.value)
    };
    parsedData = parseToObjects(headers, rows, mapping);
    mappingModal.classList.add('hidden');
    finalizeParsing();
  };

  cancelMapping.onclick = () => { mappingModal.classList.add('hidden'); setStatus('Mapping cancelled'); };
}

function loadFromStorage() {
  const raw = localStorage.getItem('financeData');
  if (raw) {
    try {
      parsedData = JSON.parse(raw) || [];
      showAll();
      setStatus('Loaded data from previous session');
    } catch(e) {
      console.warn('Failed to load saved data', e);
    }
  }
}

loadFromStorage();
setStatus('Ready. Please upload an Excel file or use sample data.');