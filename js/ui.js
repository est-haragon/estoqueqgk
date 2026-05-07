/**
 * ui.js — Interface, renderização e modais QGK Estoque
 */

const UI = (() => {
  let _editId     = null;
  let _scanProdId = null;
  let _locActive  = false;

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Stats ─────────────────────────────────────────────────────────
  function updateStats() {
    const s = Store.getStats(Store.loadProducts());
    document.getElementById('stat-total').textContent = s.total;
    document.getElementById('stat-items').textContent = s.items;
    document.getElementById('stat-zero').textContent  = s.zero;
  }

  // ── Tabela ────────────────────────────────────────────────────────
  function renderTable() {
    const q   = (document.getElementById('search-input')?.value || '').toLowerCase();
    const all = Store.loadProducts();
    const arr = q ? all.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) : all;

    const tbody = document.getElementById('table-body');
    const empty = document.getElementById('table-empty');

    if (!arr.length) { tbody.innerHTML = ''; empty.style.display = 'block'; updateStats(); return; }
    empty.style.display = 'none';

    tbody.innerHTML = arr.map(p => {
      const bc = p.qty === 0 ? 'qty-zero' : (p.minAlert > 0 && p.qty <= p.minAlert) ? 'qty-low' : 'qty-ok';
      const loc = _locBadge(p);
      return '<tr onclick="UI.openEditModal(\'' + p.id + '\')">'
        + '<td class="td-name" title="' + esc(p.name) + '">' + esc(p.name) + '</td>'
        + '<td class="td-sku">' + esc(p.sku) + '</td>'
        + '<td>' + loc + '</td>'
        + '<td><span class="chip">' + esc(p.unit) + '</span></td>'
        + '<td><span class="qty-badge ' + bc + '">' + p.qty + '</span></td>'
        + '<td class="td-actions" onclick="event.stopPropagation()">'
        + '<button class="btn btn-ghost btn-sm" title="Ver código de barras" onclick="UI.showBarcode(\'' + p.id + '\')">📊</button>'
        + '<button class="btn btn-green btn-sm" onclick="UI.quickAdjust(\'' + p.id + '\',1)">+1</button>'
        + '<button class="btn btn-red btn-sm"   onclick="UI.quickAdjust(\'' + p.id + '\',-1)">−1</button>'
        + '<button class="btn btn-danger btn-sm" onclick="UI.deleteProduct(\'' + p.id + '\')">✕</button>'
        + '</td></tr>';
    }).join('');

    updateStats();
  }

  function _locBadge(p) {
    if (!p.bloco && !p.corredor) return '<span class="loc-empty">—</span>';
    return '<span class="loc-badge">'
      + (p.bloco    ? '<span class="loc-bloco">'    + esc(p.bloco)    + '</span>' : '')
      + (p.corredor ? '<span class="loc-corredor">' + esc(p.corredor) + '</span>' : '')
      + '</span>';
  }

  function quickAdjust(id, delta) {
    const list = Store.loadProducts();
    const p    = Store.adjustQty(list, id, delta);
    if (!p) return;
    renderTable();
    Toast.show((delta > 0 ? '+' : '') + delta + ' · ' + p.name.substring(0, 32) + ' (' + p.qty + ')', delta > 0 ? 'green' : '');
  }

  function deleteProduct(id) {
    if (!confirm('Remover este produto do estoque?')) return;
    Store.saveProducts(Store.loadProducts().filter(p => p.id !== id));
    renderTable();
    Print.renderGrid();
    Toast.show('Produto removido.');
  }

  // ── Modais ────────────────────────────────────────────────────────
  function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

  function initModalBackdrops() {
    document.querySelectorAll('.modal-backdrop').forEach(bg => {
      bg.addEventListener('click', e => { if (e.target === bg) bg.classList.remove('open'); });
    });
  }

  // ── Modal Produto ─────────────────────────────────────────────────
  function openAddModal() {
    _editId = null;
    document.getElementById('modal-product-title').textContent = 'Adicionar Produto';
    ['mp-name','mp-sku','mp-bloco','mp-corredor'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('mp-qty').value = 0;
    openModal('modal-product');
    setTimeout(() => document.getElementById('mp-name').focus(), 80);
  }

  function openAddModalWithSku() {
    openAddModal();
    const sku = Scanner.getLastErrSku();
    if (sku) document.getElementById('mp-sku').value = sku;
  }

  function openEditModal(id) {
    const p = Store.findById(id, Store.loadProducts());
    if (!p) return;
    _editId = id;
    document.getElementById('modal-product-title').textContent = 'Editar Produto';
    document.getElementById('mp-name').value     = p.name;
    document.getElementById('mp-sku').value      = p.sku;
    document.getElementById('mp-qty').value      = p.qty;
    document.getElementById('mp-bloco').value    = p.bloco    || '';
    document.getElementById('mp-corredor').value = p.corredor || '';
    openModal('modal-product');
  }

  function saveProduct() {
    const name     = document.getElementById('mp-name').value.trim();
    const sku      = document.getElementById('mp-sku').value.trim();
    const qty      = parseInt(document.getElementById('mp-qty').value) || 0;
    const bloco    = document.getElementById('mp-bloco').value.trim().toUpperCase();
    const corredor = document.getElementById('mp-corredor').value.trim().toUpperCase();
    if (!name) { alert('Informe o nome do produto.'); return; }
    if (!sku)  { alert('Informe o SKU do produto.'); return; }
    const list = Store.loadProducts();
    if (_editId) {
      const p = Store.findById(_editId, list);
      if (p) Object.assign(p, { name, sku, qty, bloco, corredor });
    } else {
      if (Store.findBySku(sku, list)) {
        if (!confirm('Já existe produto com SKU "' + sku + '". Continuar?')) return;
      }
      list.push({ id: 'p' + Date.now(), name, sku, unit: 'UN', qty, minAlert: 0, bloco, corredor });
    }
    Store.saveProducts(list);
    closeModal('modal-product');
    renderTable();
    Print.renderGrid();
    Toast.show('Produto salvo!', 'green');
  }

  // ── Modal Barcode ─────────────────────────────────────────────────
  function showBarcode(id) {
    const p = Store.findById(id, Store.loadProducts());
    if (!p) return;
    const locHtml = (p.bloco || p.corredor)
      ? '<div class="bc-loc">' + [p.bloco && ('Bloco ' + p.bloco), p.corredor && ('Corredor ' + p.corredor)].filter(Boolean).join(' · ') + '</div>'
      : '';
    document.getElementById('bc-content').innerHTML =
      '<div class="bc-wrap" id="bc-print-area">'
      + '<svg id="bc-svg"></svg>'
      + '<div class="bc-name">' + esc(p.name) + '</div>'
      + locHtml
      + '<div class="bc-sku">' + esc(p.sku) + '</div>'
      + '</div>';
    openModal('modal-barcode');
    setTimeout(() => {
      try {
        JsBarcode('#bc-svg', p.sku, { format: 'CODE128', lineColor: '#000', width: 2, height: 65, displayValue: true, fontSize: 14, margin: 10 });
      } catch (e) {
        document.getElementById('bc-content').innerHTML = '<p style="color:var(--red);padding:20px">Erro ao gerar barcode: ' + e.message + '</p>';
      }
    }, 50);
  }

  function printBarcode() {
    const area = document.getElementById('bc-print-area');
    if (!area) return;
    const win = window.open('', '_blank', 'width=440,height=360');
    win.document.write('<!DOCTYPE html><html><head><title>Etiqueta QGK</title><style>'
      + 'body{margin:20px;text-align:center;font-family:sans-serif;background:#fff}'
      + '.bc-name{font-size:11px;font-weight:700;color:#111;margin-top:10px;word-break:break-all;text-transform:uppercase;line-height:1.3}'
      + '.bc-loc{font-size:10px;color:#555;margin-top:3px;font-style:italic}'
      + '.bc-sku{font-family:monospace;font-size:12px;color:#555;margin-top:4px}'
      + '</style></head><body>' + area.innerHTML
      + '<scr' + 'ipt>window.onload=function(){window.print();window.close()}<\/script>'
      + '</body></html>');
    win.document.close();
  }

  // ── Modal Definir Qtd ─────────────────────────────────────────────
  function openSetQtyModal() {
    const id = Scanner.getCurrentId();
    if (!id) return;
    const p = Store.findById(id, Store.loadProducts());
    if (!p) return;
    _scanProdId = id;
    document.getElementById('setqty-product-name').textContent = p.name;
    document.getElementById('setqty-value').value = p.qty;
    openModal('modal-setqty');
    setTimeout(() => document.getElementById('setqty-value').select(), 80);
  }

  function confirmSetQty() {
    const id  = _scanProdId || Scanner.getCurrentId();
    if (!id) return;
    const nq  = parseInt(document.getElementById('setqty-value').value) || 0;
    const p   = Store.setQty(Store.loadProducts(), id, nq);
    if (!p) return;
    const qEl = document.getElementById('scan-pqty');
    if (qEl) qEl.textContent = p.qty;
    renderTable();
    closeModal('modal-setqty');
    Toast.show('Estoque definido: ' + p.qty, 'green');
  }

  // ── Histórico ─────────────────────────────────────────────────────
  function renderHistory() {
    const hist  = Store.getHistory();
    const list  = document.getElementById('history-list');
    const empty = document.getElementById('history-empty');
    if (!hist.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    list.innerHTML = hist.slice(0, 200).map(h => {
      const d   = new Date(h.ts);
      const fmt = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const cls = h.delta >= 0 ? 'delta-pos' : 'delta-neg';
      return '<div class="history-item">'
        + '<div class="history-info">'
        + '<div class="history-name">' + esc(h.name) + '</div>'
        + '<div class="history-meta">' + esc(h.sku) + ' · ' + fmt + '</div>'
        + '</div>'
        + '<div class="history-delta">'
        + '<div class="delta-val ' + cls + '">' + (h.delta > 0 ? '+' : '') + h.delta + '</div>'
        + '<div class="delta-qty">→ ' + h.qty + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  // ── Mapa de Localização ───────────────────────────────────────────
  function toggleLocationView() {
    _locActive = !_locActive;
    const tableWrap = document.querySelector('.table-wrap');
    const tableEmpty = document.getElementById('table-empty');
    const mapDiv    = document.getElementById('location-map');
    const btn       = document.getElementById('btn-view-loc');
    if (_locActive) {
      if (tableWrap)  tableWrap.style.display  = 'none';
      if (tableEmpty) tableEmpty.style.display = 'none';
      if (mapDiv)     mapDiv.style.display     = 'block';
      if (btn) { btn.textContent = '📋 Ver Tabela'; btn.classList.replace('btn-ghost','btn-accent'); }
      renderLocationMap();
    } else {
      if (tableWrap)  tableWrap.style.display  = '';
      if (mapDiv)     mapDiv.style.display     = 'none';
      if (btn) { btn.textContent = '🗺️ Ver Mapa'; btn.classList.replace('btn-accent','btn-ghost'); }
      renderTable();
    }
  }

  function renderLocationMap() {
    const q    = (document.getElementById('search-input')?.value || '').toLowerCase();
    const list = Store.loadProducts().filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
    const grid = document.getElementById('loc-map-grid');
    if (!grid) return;

    if (!list.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🗺️</div><div>Nenhum produto encontrado.</div></div>'; return; }

    // Agrupa: bloco → corredor → produtos
    const map = {};
    list.forEach(p => {
      const b = p.bloco    || '(sem bloco)';
      const c = p.corredor || '(sem corredor)';
      if (!map[b]) map[b] = {};
      if (!map[b][c]) map[b][c] = [];
      map[b][c].push(p);
    });

    grid.innerHTML = Object.keys(map).sort().map(b => {
      const corridors = Object.keys(map[b]).sort();
      const total = corridors.reduce((s, c) => s + map[b][c].length, 0);
      const corrHtml = corridors.map(c => {
        const items = map[b][c];
        const itemsHtml = items.map(p => {
          const bc = p.qty === 0 ? 'qty-zero' : (p.minAlert > 0 && p.qty <= p.minAlert) ? 'qty-low' : 'qty-ok';
          return '<div class="loc-item" onclick="UI.openEditModal(\'' + p.id + '\')">'
            + '<div class="loc-item-name" title="' + esc(p.name) + '">' + esc(p.name.substring(0, 42)) + '</div>'
            + '<div class="loc-item-meta"><span class="loc-item-sku">' + esc(p.sku) + '</span>'
            + '<span class="qty-badge ' + bc + '" style="font-size:12px;padding:2px 8px">' + p.qty + '</span></div>'
            + '</div>';
        }).join('');
        return '<div class="loc-corridor-card">'
          + '<div class="loc-corredor-header">'
          + '<span class="loc-corredor-label">Corredor ' + esc(c) + '</span>'
          + '<span class="loc-corredor-count">' + items.length + ' item' + (items.length !== 1 ? 's' : '') + '</span>'
          + '</div>'
          + '<div class="loc-corredor-items">' + itemsHtml + '</div>'
          + '</div>';
      }).join('');
      return '<div class="loc-bloco-card">'
        + '<div class="loc-bloco-header">'
        + '<span class="loc-bloco-icon">🧱</span>'
        + '<span class="loc-bloco-name">Bloco ' + esc(b) + '</span>'
        + '<span class="loc-bloco-total">' + total + ' produto' + (total !== 1 ? 's' : '') + '</span>'
        + '</div>'
        + '<div class="loc-bloco-corredores">' + corrHtml + '</div>'
        + '</div>';
    }).join('');
  }

  return {
    esc, updateStats, renderTable, renderHistory,
    quickAdjust, deleteProduct,
    openAddModal, openAddModalWithSku, openEditModal, saveProduct,
    showBarcode, printBarcode,
    openSetQtyModal, confirmSetQty,
    openModal, closeModal, initModalBackdrops,
    toggleLocationView, renderLocationMap,
  };
})();

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = (() => {
  let _t;
  function show(msg, type = '') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(_t);
    _t = setTimeout(() => el.classList.remove('show'), 3000);
  }
  return { show };
})();

// ── History (API pública para o HTML) ────────────────────────────────────────
const History = {
  clear() {
    if (!confirm('Limpar todo o histórico?')) return;
    Store.clearHistory();
    UI.renderHistory();
    Toast.show('Histórico limpo.');
  },
};
