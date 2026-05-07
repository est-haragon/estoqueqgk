/**
 * app.js — Ponto de entrada principal QGK Estoque
 */

(function () {
  'use strict';

  // ── Tabs ───────────────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => goTab(tab.dataset.tab));
    });
  }

  function goTab(name) {
    document.querySelectorAll('.tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === name)
    );
    document.querySelectorAll('.page').forEach(p =>
      p.classList.toggle('active', p.id === 'page-' + name)
    );
    switch (name) {
      case 'estoque':   UI.renderTable(); document.getElementById('search-input')?.focus(); break;
      case 'scanner':   Scanner.focus(); break;
      case 'historico': UI.renderHistory(); break;
      case 'imprimir':  Print.renderGrid(); break;
      case 'sheets':
        Sheets.loadUrl();
        const codeEl = document.getElementById('gas-code-block');
        if (codeEl && !codeEl.textContent) codeEl.textContent = Sheets.getGasCode();
        break;
    }
  }

  // ── Busca ──────────────────────────────────────────────────────────
  function initSearch() {
    document.getElementById('search-input')?.addEventListener('input', () => {
      const mapVisible = document.getElementById('location-map')?.style.display !== 'none';
      mapVisible ? UI.renderLocationMap() : UI.renderTable();
    });
    // print-search: listener único adicionado aqui, não em goTab
    document.getElementById('print-search')?.addEventListener('input', Print.renderGrid);
  }

  // ── Teclado ────────────────────────────────────────────────────────
  function initKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
      }
      if (e.ctrlKey && e.key === 'f') {
        if (document.getElementById('page-estoque')?.classList.contains('active')) {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
        }
      }
      if (e.key === 'Enter') {
        if (document.getElementById('modal-product')?.classList.contains('open')) UI.saveProduct();
        if (document.getElementById('modal-setqty')?.classList.contains('open')) UI.confirmSetQty();
      }
    });
  }

  // ── Init ───────────────────────────────────────────────────────────
  function init() {
    Store.loadProducts();
    UI.renderTable();
    UI.updateStats();
    initTabs();
    initSearch();
    Scanner.init();
    UI.initModalBackdrops();
    initKeyboard();

    // Sync indicator inicial
    if (Store.hasPending()) Store.setSyncState('pending');
    else if (Store.getGsUrl()) Store.setSyncState('synced');

    // Auto-sync em background após 1.5s
    setTimeout(() => Sheets.autoSync(), 1500);

    console.log('[QGK Estoque] v2.0 inicializado.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
