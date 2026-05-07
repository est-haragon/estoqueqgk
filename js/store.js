/**
 * store.js — Camada de dados QGK Estoque
 * Fonte de verdade: Google Sheets | Cache: localStorage
 */

const Store = (() => {
  const KEYS = {
    products: 'qgk_products_v2',
    history:  'qgk_history_v2',
    pending:  'qgk_pending_v2',
    gsUrl:    'qgk_gs_url',
    lastSync: 'qgk_last_sync',
  };

  // ── Produtos ──────────────────────────────────────────────────────
  function _read() {
    try { const r = localStorage.getItem(KEYS.products); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }

  function setProducts(list) {
    localStorage.setItem(KEYS.products, JSON.stringify(list));
  }

  function _normalise(p, i) {
    return {
      id:       p.id       || 'p' + i,
      name:     p.name     || '',
      sku:      p.sku      || '',
      unit:     p.unit     || 'UN',
      qty:      Number(p.qty)      || 0,
      minAlert: Number(p.minAlert) || 0,
      bloco:    p.bloco    || '',
      corredor: p.corredor || '',
    };
  }

  function initFromCatalog() {
    const list = INITIAL_CATALOG.map((row, i) => ({
      id: 'p' + i, name: row[0], sku: row[1], unit: row[2] || 'UN',
      qty: 0, minAlert: 0, bloco: '', corredor: '',
    }));
    setProducts(list);
    return list;
  }

  function loadProducts() {
    const saved = _read();
    if (saved && saved.length > 0) return saved.map(_normalise);
    return initFromCatalog();
  }

  function saveProducts(list) {
    setProducts(list);
    _markPending();
  }

  function findBySku(sku, list) {
    const low = sku.toLowerCase();
    return list.find(p => p.sku.toLowerCase() === low) || null;
  }

  function findById(id, list) {
    return list.find(p => p.id === id) || null;
  }

  // ── Histórico ─────────────────────────────────────────────────────
  function getHistory() {
    try { const r = localStorage.getItem(KEYS.history); return r ? JSON.parse(r) : []; }
    catch { return []; }
  }

  function addHistoryEntry(product, delta, newQty) {
    const hist = getHistory();
    hist.unshift({ ts: Date.now(), id: product.id, name: product.name, sku: product.sku, delta, qty: newQty });
    if (hist.length > 1000) hist.length = 1000;
    localStorage.setItem(KEYS.history, JSON.stringify(hist));
  }

  function clearHistory() {
    localStorage.setItem(KEYS.history, JSON.stringify([]));
  }

  // ── Sync pendente ─────────────────────────────────────────────────
  function _markPending() {
    localStorage.setItem(KEYS.pending, '1');
    _setSyncUI('pending');
  }

  function clearPending() {
    localStorage.removeItem(KEYS.pending);
    localStorage.setItem(KEYS.lastSync, new Date().toISOString());
    _setSyncUI('synced');
  }

  function hasPending() { return !!localStorage.getItem(KEYS.pending); }

  function _setSyncUI(state) {
    const el    = document.getElementById('sync-indicator');
    const label = el?.querySelector('.sync-label');
    if (!el) return;
    el.className = 'sync-indicator';
    const map = {
      synced:  { cls: 'synced',  txt: 'Sheets ✓' },
      error:   { cls: 'error',   txt: 'Erro sync' },
      pending: { cls: 'pending', txt: 'Pendente'  },
      syncing: { cls: 'syncing', txt: 'Sincronizando…' },
    };
    const s = map[state] || { cls: '', txt: 'Local' };
    if (s.cls) el.classList.add(s.cls);
    if (label) label.textContent = s.txt;
  }

  function setSyncState(state) { _setSyncUI(state); }

  // ── URL do Sheets ─────────────────────────────────────────────────
  function getGsUrl() { return localStorage.getItem(KEYS.gsUrl) || ''; }
  function setGsUrl(url) { localStorage.setItem(KEYS.gsUrl, url); }

  // ── Mutações de quantidade ────────────────────────────────────────
  function adjustQty(list, id, delta) {
    const p = findById(id, list);
    if (!p) return null;
    p.qty = Math.max(0, p.qty + delta);
    saveProducts(list);
    addHistoryEntry(p, delta, p.qty);
    return p;
  }

  function setQty(list, id, newQty) {
    const p = findById(id, list);
    if (!p) return null;
    const delta = newQty - p.qty;
    p.qty = Math.max(0, newQty);
    saveProducts(list);
    addHistoryEntry(p, delta, p.qty);
    return p;
  }

  // ── Exportar CSV ──────────────────────────────────────────────────
  function exportCSV() {
    const list   = loadProducts();
    const header = ['Produto', 'SKU', 'Bloco', 'Corredor', 'Unidade', 'Quantidade'];
    const rows   = list.map(p => [
      '"' + p.name.replace(/"/g, '""') + '"',
      p.sku, p.bloco || '', p.corredor || '', p.unit, p.qty,
    ]);
    const csv  = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'estoque-qgk-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Stats ─────────────────────────────────────────────────────────
  function getStats(list) {
    return {
      total: list.length,
      items: list.reduce((s, p) => s + p.qty, 0),
      zero:  list.filter(p => p.qty === 0).length,
    };
  }

  return {
    loadProducts, saveProducts, setProducts, initFromCatalog,
    findBySku, findById,
    getHistory, addHistoryEntry, clearHistory,
    hasPending, clearPending, setSyncState,
    getGsUrl, setGsUrl,
    adjustQty, setQty,
    exportCSV, getStats,
  };
})();
