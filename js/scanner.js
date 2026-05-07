/**
 * scanner.js — Leitor de código de barras USB
 * O leitor emula teclado; capturamos com debounce de 100ms.
 */

const Scanner = (() => {
  let _mode      = 'entrada';
  let _currentId = null;
  let _debounce  = null;

  function init() {
    const field = document.getElementById('scan-field');
    if (!field) return;

    // Input event: leitor USB dispara input rapidamente
    field.addEventListener('input', () => {
      clearTimeout(_debounce);
      _debounce = setTimeout(() => {
        const val = field.value.trim();
        if (val) { _process(val); field.value = ''; }
      }, 100);
    });

    // Enter: teclado manual ou leitor que envia Enter no final
    field.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      clearTimeout(_debounce);
      const val = field.value.trim();
      if (val) { _process(val); field.value = ''; }
    });
  }

  function setMode(mode) {
    _mode = mode;
    document.getElementById('mode-entrada').className =
      'mode-btn' + (mode === 'entrada' ? ' active-entrada' : '');
    document.getElementById('mode-saida').className =
      'mode-btn' + (mode === 'saida' ? ' active-saida' : '');
  }

  function _process(code) {
    const list    = Store.loadProducts();
    const product = Store.findBySku(code, list);

    // Oculta ambos antes de mostrar o certo
    document.getElementById('scan-result-ok').style.display  = 'none';
    document.getElementById('scan-result-err').style.display = 'none';

    if (!product) {
      _currentId = null;
      const errPanel = document.getElementById('scan-result-err');
      errPanel.style.display    = 'block';
      errPanel.dataset.sku      = code;
      document.getElementById('scan-err-code').textContent = code;
      return;
    }

    _currentId = product.id;
    const delta = _mode === 'entrada' ? 1 : -1;
    _doAdjust(product, list, delta);
  }

  function _doAdjust(product, list, delta) {
    const updated = Store.adjustQty(list, product.id, delta);
    _showOk(updated);
    UI.updateStats();
    UI.renderTable();
    Toast.show(
      (delta > 0 ? '+' : '') + delta + ' · ' + product.name.substring(0, 32) + ' → ' + updated.qty,
      delta > 0 ? 'green' : 'red'
    );
  }

  function _showOk(product) {
    document.getElementById('scan-result-ok').style.display = 'block';
    document.getElementById('scan-pname').textContent = product.name;
    document.getElementById('scan-psku').textContent  = product.sku;
    document.getElementById('scan-pqty').textContent  = product.qty;

    // Mostra localização se preenchida
    const locEl = document.getElementById('scan-ploc');
    if (locEl) {
      const parts = [product.bloco && ('Bloco ' + product.bloco), product.corredor && ('Corredor ' + product.corredor)].filter(Boolean);
      locEl.textContent = parts.join(' · ');
      locEl.style.display = parts.length ? '' : 'none';
    }
  }

  function adjust(delta) {
    if (!_currentId) return;
    const list    = Store.loadProducts();
    const product = Store.findById(_currentId, list);
    if (!product) return;
    _doAdjust(product, list, delta);
  }

  function getCurrentId()  { return _currentId; }
  function getLastErrSku() { return document.getElementById('scan-result-err')?.dataset?.sku || ''; }
  function focus()         { document.getElementById('scan-field')?.focus(); }

  return { init, setMode, adjust, getCurrentId, getLastErrSku, focus };
})();
