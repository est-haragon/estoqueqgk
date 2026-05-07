/**
 * print.js — Impressão HTML e geração ZPL para Zebra
 */

const Print = (() => {
  let _selected   = new Set();
  let _currentZpl = '';

  // ── Helpers ───────────────────────────────────────────────────────
  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Grid de impressão ─────────────────────────────────────────────
  function renderGrid() {
    const q     = (document.getElementById('print-search')?.value || '').toLowerCase();
    const prods = Store.loadProducts().filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
    const grid = document.getElementById('print-grid');
    if (!grid) return;

    grid.innerHTML = prods.map(p => {
      const sel = _selected.has(p.id) ? ' selected' : '';
      const loc = (p.bloco || p.corredor)
        ? '<div class="pi-loc">' + [p.bloco && p.bloco, p.corredor && ('C' + p.corredor)].filter(Boolean).join(' · ') + '</div>'
        : '';
      return '<div class="print-item' + sel + '" onclick="Print.toggleSelect(\'' + p.id + '\')" data-id="' + p.id + '">'
        + '<svg class="bc-mini" data-sku="' + _esc(p.sku) + '"></svg>'
        + '<div class="print-item-name">' + _esc(p.name.substring(0, 55)) + '</div>'
        + loc
        + '</div>';
    }).join('');

    // Renderiza barcodes em batch
    grid.querySelectorAll('.bc-mini').forEach(svg => {
      try {
        JsBarcode(svg, svg.dataset.sku, {
          format: 'CODE128', width: 1.2, height: 34,
          displayValue: true, fontSize: 9, margin: 4, lineColor: '#000',
        });
      } catch (_) {}
    });

    const cnt = document.getElementById('print-sel-count');
    if (cnt) cnt.textContent = _selected.size;
  }

  function toggleSelect(id) {
    _selected.has(id) ? _selected.delete(id) : _selected.add(id);
    const item = document.querySelector('.print-item[data-id="' + id + '"]');
    if (item) item.classList.toggle('selected', _selected.has(id));
    const cnt = document.getElementById('print-sel-count');
    if (cnt) cnt.textContent = _selected.size;
  }

  function selectAll() {
    const q = (document.getElementById('print-search')?.value || '').toLowerCase();
    Store.loadProducts()
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .forEach(p => _selected.add(p.id));
    renderGrid();
  }

  function clearSelection() { _selected.clear(); renderGrid(); }

  // ── ZPL ───────────────────────────────────────────────────────────
  function _getList() {
    const all = Store.loadProducts();
    return _selected.size > 0 ? all.filter(p => _selected.has(p.id)) : all;
  }

  function openZebraModal() {
    const list = _getList();
    document.getElementById('zpl-count').textContent = list.length;
    _currentZpl = _buildZpl(list);
    _updatePreview();
    UI.openModal('modal-zebra');
  }

  function regenerateZpl() {
    _currentZpl = _buildZpl(_getList());
    _updatePreview();
  }

  function _updatePreview() {
    const MAX = 6000;
    document.getElementById('zpl-preview').textContent =
      _currentZpl.substring(0, MAX) + (_currentZpl.length > MAX ? '\n\n… (preview truncado, arquivo completo no download)' : '');
  }

  function _mm(v, dpi) { return Math.round(v * dpi / 25.4); }

  function _buildZpl(items) {
    const dpi    = parseInt(document.getElementById('zpl-dpi').value)    || 300;
    const wMm    = parseFloat(document.getElementById('zpl-w').value)    || 50;
    const hMm    = parseFloat(document.getElementById('zpl-h').value)    || 25;
    const copies = parseInt(document.getElementById('zpl-copies').value) || 1;
    const mm     = v => _mm(v, dpi);

    const W = mm(wMm);
    const H = mm(hMm);

    // Layout adaptativo: se tiver bloco/corredor reserva linha extra
    const hasLoc = items.some(p => p.bloco || p.corredor);
    const mL     = mm(2);
    const mT     = mm(2);
    const fName  = mm(2.2);   // fonte nome
    const fSmall = mm(1.8);   // fonte localização e SKU
    const nameH  = fName + mm(0.5);
    const locH   = hasLoc ? fSmall + mm(0.5) : 0;
    const bcY    = mT + nameH + locH + mm(0.5);
    const bcH    = Math.max(mm(8), Math.min(mm(hMm * 0.42), H - bcY - fSmall - mm(3)));
    const skY    = bcY + bcH + mm(0.8);
    const mod    = Math.max(1, Math.round((W - mL * 2) / 130));

    let zpl = '';
    for (const p of items) {
      const sku = p.sku.replace(/[^A-Za-z0-9\-\.\/\+]/g, '').trim();
      if (!sku) continue;

      const maxCh   = Math.floor(wMm / 2.0);
      const nameStr = p.name.length > maxCh ? p.name.substring(0, maxCh - 1) + '~' : p.name;

      zpl += '^XA\n';
      zpl += '^PW' + W + '\n';
      zpl += '^LL' + H + '\n';
      zpl += '^CI28\n';
      zpl += '^MMT\n';

      // Nome do produto
      zpl += '^FO' + mL + ',' + mT + '^A0N,' + fName + ',' + fName + '^FD' + nameStr + '^FS\n';

      // Localização (bloco/corredor)
      if (p.bloco || p.corredor) {
        const locStr = [p.bloco && ('Bloco:' + p.bloco), p.corredor && ('Corredor:' + p.corredor)].filter(Boolean).join('  ');
        const locY   = mT + nameH;
        zpl += '^FO' + mL + ',' + locY + '^A0N,' + fSmall + ',' + fSmall + '^FD' + locStr + '^FS\n';
      }

      // Barcode
      zpl += '^FO' + mL + ',' + bcY + '^BY' + mod + ',3,' + bcH + '^BCN,,N,N^FD' + sku + '^FS\n';

      // SKU texto
      zpl += '^FO' + mL + ',' + skY + '^A0N,' + fSmall + ',' + fSmall + '^FD' + sku + '^FS\n';

      zpl += '^PQ' + copies + '\n';
      zpl += '^XZ\n\n';
    }
    return zpl;
  }

  function downloadZpl() {
    if (!_currentZpl) { Toast.show('Gere o ZPL primeiro.'); return; }
    const fname = 'etiquetas-qgk-' + new Date().toISOString().slice(0, 10) + '.zpl';
    const blob  = new Blob([_currentZpl], { type: 'text/plain;charset=utf-8;' });
    const a     = document.createElement('a');
    a.href      = URL.createObjectURL(blob);
    a.download  = fname;
    a.click();
    URL.revokeObjectURL(a.href);
    Toast.show('Arquivo ' + fname + ' baixado!', 'green');
  }

  function copyZpl() {
    if (!_currentZpl) { Toast.show('Gere o ZPL primeiro.'); return; }
    navigator.clipboard.writeText(_currentZpl)
      .then(() => Toast.show('ZPL copiado para a área de transferência!'))
      .catch(() => Toast.show('Erro ao copiar — use o botão Download.', 'red'));
  }

  // ── Envio direto por socket TCP (via browser TCP não suportado nativamente)
  // Exporta TXT puro também para quem usa impressora em rede
  function downloadTxt() {
    if (!_currentZpl) { Toast.show('Gere o ZPL primeiro.'); return; }
    const blob = new Blob([_currentZpl], { type: 'text/plain;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'etiquetas-qgk-' + new Date().toISOString().slice(0, 10) + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    Toast.show('Arquivo .txt baixado (renomeie para .zpl se necessário)', 'green');
  }

  return {
    renderGrid, toggleSelect, selectAll, clearSelection,
    openZebraModal, regenerateZpl, downloadZpl, copyZpl, downloadTxt,
  };
})();
