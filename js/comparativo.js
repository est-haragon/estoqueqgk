/**
 * comparativo.js — Comparativo entre estoque Tine e estoque QGK
 *
 * Estrutura da planilha Tine:
 *   Col A: SKU
 *   Col B: Produto
 *   Col C-K: Lojas (SGC, LIMEGI, TEFO, MAB, QGNET, GRP, RGC, FPA, JGC/KRL)
 *   Col L: Total
 */

const Comparativo = (() => {

  // Estado interno
  let _tineData    = [];   // [{sku, nome, lojas:{}, total}]
  let _filtro      = '';
  let _mostrar     = 'todos';  // 'todos' | 'divergentes' | 'ok' | 'somente_tine' | 'somente_qgk'
  let _ordenar     = 'nome';   // 'nome' | 'sku' | 'diff' | 'tine' | 'qgk'
  let _tineUrl     = '';
  let _tineSheetId = '';       // ID ou nome da aba dentro do Sheets do Tine

  // ── Helpers ───────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _setStatus(type, msg) {
    const el = document.getElementById('comp-status');
    if (!el) return;
    el.style.display = 'block';
    el.className = 'gs-status ' + type;
    el.textContent = msg;
  }

  function _setLog(msg) {
    const el = document.getElementById('comp-log');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
  }

  // ── Config ────────────────────────────────────────────────────────
  function loadConfig() {
    _tineUrl     = localStorage.getItem('qgk_tine_url')      || '';
    _tineSheetId = localStorage.getItem('qgk_tine_sheet_id') || '';
    const u = document.getElementById('tine-url');
    const s = document.getElementById('tine-sheet-id');
    if (u && _tineUrl)     u.value = _tineUrl;
    if (s && _tineSheetId) s.value = _tineSheetId;
  }

  function saveConfig() {
    const url     = document.getElementById('tine-url')?.value.trim()      || '';
    const sheetId = document.getElementById('tine-sheet-id')?.value.trim() || '';
    if (!url) { _setStatus('err', '⚠️ Informe a URL do Apps Script do Tine.'); return; }
    _tineUrl     = url;
    _tineSheetId = sheetId;
    localStorage.setItem('qgk_tine_url',      url);
    localStorage.setItem('qgk_tine_sheet_id', sheetId);
    _setStatus('ok', '✅ Configuração salva!');
  }

  // ── Importar dados do Tine via Apps Script ────────────────────────
  async function importarTine() {
    const url = _tineUrl || localStorage.getItem('qgk_tine_url') || '';
    if (!url) { _setStatus('err', '⚠️ Configure a URL do Tine primeiro.'); return; }

    _setLog('⬇️ Buscando dados do Tine…');
    const params = new URLSearchParams({ action: 'importarTine', sheetId: _tineSheetId || '' });

    try {
      const res  = await fetch(url + '?' + params.toString());
      const json = await res.json();
      if (!json.ok) { _setLog('❌ ' + json.msg); return; }

      _tineData = (json.products || []).map(p => ({
        sku:   String(p.sku   || '').trim(),
        nome:  String(p.nome  || '').trim(),
        lojas: p.lojas || {},
        total: Number(p.total) || 0,
      }));

      localStorage.setItem('qgk_tine_cache', JSON.stringify({ ts: Date.now(), data: _tineData }));
      _setLog('✅ ' + _tineData.length + ' produtos importados do Tine.\n⏰ ' + new Date().toLocaleString('pt-BR'));
      renderComparativo();
    } catch (e) {
      _setLog('❌ Erro: ' + e.message);
    }
  }

  // ── Carregar do cache ─────────────────────────────────────────────
  function loadCache() {
    try {
      const raw = localStorage.getItem('qgk_tine_cache');
      if (!raw) return false;
      const obj = JSON.parse(raw);
      _tineData = obj.data || [];
      const age = Math.round((Date.now() - obj.ts) / 60000);
      _setLog('📦 Cache carregado (' + _tineData.length + ' produtos, atualizado há ' + age + ' min)');
      return _tineData.length > 0;
    } catch { return false; }
  }

  // ── Upload manual de arquivo TSV/CSV do Tine ──────────────────────
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    _setLog('📂 Lendo arquivo: ' + file.name + '…');

    const reader = new FileReader();
    reader.onload = e => {
      try {
        _parseTineFile(e.target.result);
        localStorage.setItem('qgk_tine_cache', JSON.stringify({ ts: Date.now(), data: _tineData }));
        _setLog('✅ ' + _tineData.length + ' produtos carregados do arquivo.\n⏰ ' + new Date().toLocaleString('pt-BR'));
        renderComparativo();
      } catch (err) {
        _setLog('❌ Erro ao ler arquivo: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function _parseTineFile(text) {
    // Detecta separador: tab ou ponto-e-vírgula
    const sep   = text.includes('\t') ? '\t' : ';';
    const lines = text.trim().split('\n').map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));

    if (lines.length < 2) throw new Error('Arquivo vazio ou inválido.');

    // Cabeçalho: SKU | Produto | SGC | LIMEGI | TEFO | MAB | QGNET | GRP | RGC | FPA | JGC/KRL | KRL | Total
    const header = lines[0].map(h => h.toUpperCase());
    const iSku   = header.findIndex(h => h === 'SKU' || h === 'CÓDIGO' || h === 'CODIGO');
    const iNome  = header.findIndex(h => h === 'PRODUTO' || h === 'NOME' || h === 'DESCRIÇÃO');
    const iTotal = header.findIndex(h => h === 'TOTAL');

    if (iSku < 0 || iNome < 0) throw new Error('Colunas SKU ou Produto não encontradas. Verifique o cabeçalho do arquivo.');

    // Nomes das lojas (todas as colunas entre Produto e Total)
    const lojasCols = [];
    const start = Math.max(iSku, iNome) + 1;
    const end   = iTotal > 0 ? iTotal : header.length;
    for (let i = start; i < end; i++) {
      if (header[i] && header[i] !== 'TOTAL') lojasCols.push({ idx: i, nome: header[i] });
    }

    _tineData = [];
    for (let li = 1; li < lines.length; li++) {
      const row = lines[li];
      if (!row[iSku]) continue;

      const lojas = {};
      lojasCols.forEach(l => {
        lojas[l.nome] = Number(row[l.idx]) || 0;
      });

      // Total: usa coluna Total se existir, senão soma as lojas
      const total = iTotal > 0
        ? (Number(row[iTotal]) || 0)
        : Object.values(lojas).reduce((s, v) => s + v, 0);

      _tineData.push({
        sku:   row[iSku]  || '',
        nome:  row[iNome] || '',
        lojas,
        total,
      });
    }

    if (_tineData.length === 0) throw new Error('Nenhum produto encontrado no arquivo.');
  }

  // ── Render comparativo ────────────────────────────────────────────
  function renderComparativo() {
    const qgkList = Store.loadProducts();
    const tbody   = document.getElementById('comp-tbody');
    const empty   = document.getElementById('comp-empty');
    const statsEl = document.getElementById('comp-stats');

    if (!tbody) return;

    // Monta mapa QGK: SKU → produto
    const qgkMap = {};
    qgkList.forEach(p => { qgkMap[p.sku.toUpperCase()] = p; });

    // Monta mapa Tine: SKU → item
    const tineMap = {};
    _tineData.forEach(p => { tineMap[p.sku.toUpperCase()] = p; });

    // União de todos os SKUs
    const allSkus = new Set([...Object.keys(qgkMap), ...Object.keys(tineMap)]);

    let rows = [];
    allSkus.forEach(sku => {
      const t   = tineMap[sku];
      const q   = qgkMap[sku];
      const tQt = t ? t.total : null;
      const qQt = q ? q.qty   : null;
      const diff = (tQt !== null && qQt !== null) ? (qQt - tQt) : null;
      const nome  = (t?.nome || q?.name || '').toUpperCase();

      rows.push({ sku, nome, t, q, tQt, qQt, diff });
    });

    // Filtro texto
    if (_filtro) {
      const f = _filtro.toLowerCase();
      rows = rows.filter(r => r.nome.toLowerCase().includes(f) || r.sku.toLowerCase().includes(f));
    }

    // Filtro status
    rows = rows.filter(r => {
      switch (_mostrar) {
        case 'divergentes':  return r.diff !== null && r.diff !== 0;
        case 'ok':           return r.diff === 0;
        case 'somente_tine': return r.t !== null && r.q === null;
        case 'somente_qgk':  return r.q !== null && r.t === null;
        default:             return true;
      }
    });

    // Ordenação
    rows.sort((a, b) => {
      switch (_ordenar) {
        case 'sku':  return a.sku.localeCompare(b.sku);
        case 'diff': return (Math.abs(b.diff || 0)) - (Math.abs(a.diff || 0));
        case 'tine': return (b.tQt || 0) - (a.tQt || 0);
        case 'qgk':  return (b.qQt || 0) - (a.qQt || 0);
        default:     return a.nome.localeCompare(b.nome);
      }
    });

    // Stats
    const total      = rows.length;
    const ok         = rows.filter(r => r.diff === 0).length;
    const divergente = rows.filter(r => r.diff !== null && r.diff !== 0).length;
    const soTine     = rows.filter(r => r.t && !r.q).length;
    const soQgk      = rows.filter(r => r.q && !r.t).length;

    if (statsEl) {
      statsEl.innerHTML =
        '<span class="comp-stat comp-stat-total">' + total + ' produtos</span>' +
        '<span class="comp-stat comp-stat-ok">✓ ' + ok + ' iguais</span>' +
        '<span class="comp-stat comp-stat-diff">≠ ' + divergente + ' divergentes</span>' +
        '<span class="comp-stat comp-stat-tine">+ ' + soTine + ' só no Tine</span>' +
        '<span class="comp-stat comp-stat-qgk">+ ' + soQgk + ' só no QGK</span>';
    }

    if (!rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = rows.map(r => {
      const status  = _statusClass(r);
      const diffStr = r.diff === null ? '—'
        : r.diff === 0 ? '<span class="diff-ok">✓ 0</span>'
        : r.diff > 0   ? '<span class="diff-pos">+' + r.diff + '</span>'
                       : '<span class="diff-neg">' + r.diff + '</span>';

      const tQtStr = r.tQt === null ? '<span class="col-absent">—</span>'
        : '<span class="' + (r.tQt < 0 ? 'qty-neg' : '') + '">' + r.tQt + '</span>';
      const qQtStr = r.qQt === null ? '<span class="col-absent">—</span>'
        : '<span class="' + (r.qQt === 0 ? 'qty-zero-sm' : '') + '">' + r.qQt + '</span>';

      // Tooltip com detalhes das lojas do Tine
      const lojasTooltip = r.t
        ? Object.entries(r.t.lojas).map(([k,v]) => k + ': ' + v).join(' | ')
        : '';

      return '<tr class="comp-row ' + status + '" title="' + esc(lojasTooltip) + '">'
        + '<td class="comp-sku">'  + esc(r.sku)  + '</td>'
        + '<td class="comp-nome">' + esc(r.nome.substring(0, 60)) + (r.nome.length > 60 ? '…' : '') + '</td>'
        + '<td class="comp-col-tine" title="' + esc(lojasTooltip) + '">' + tQtStr + '</td>'
        + '<td class="comp-col-qgk">' + qQtStr + '</td>'
        + '<td class="comp-col-diff">' + diffStr + '</td>'
        + '<td class="comp-acoes">'
        + (r.q ? '<button class="btn btn-secondary btn-sm" onclick="UI.openEditModal(\'' + r.q.id + '\')">Editar</button>' : '')
        + '</td>'
        + '</tr>';
    }).join('');
  }

  function _statusClass(r) {
    if (r.t === null) return 'row-so-qgk';
    if (r.q === null) return 'row-so-tine';
    if (r.diff === 0) return 'row-ok';
    return Math.abs(r.diff) >= 10 ? 'row-diff-high' : 'row-diff-low';
  }

  // ── Controles ─────────────────────────────────────────────────────
  function setFiltro(v)  { _filtro  = v; renderComparativo(); }
  function setMostrar(v) { _mostrar = v; renderComparativo(); }
  function setOrdenar(v) { _ordenar = v; renderComparativo(); }

  // ── Exportar comparativo CSV ───────────────────────────────────────
  function exportCSV() {
    const qgkList = Store.loadProducts();
    const qgkMap  = {};
    qgkList.forEach(p => { qgkMap[p.sku.toUpperCase()] = p; });

    const header = ['SKU','Produto','Total Tine','Total QGK','Diferença (QGK-Tine)','Status'];
    const rows   = _tineData.map(t => {
      const q    = qgkMap[t.sku.toUpperCase()];
      const tQt  = t.total;
      const qQt  = q ? q.qty : '';
      const diff = q ? (q.qty - tQt) : '';
      const status = !q ? 'Só no Tine' : diff === 0 ? 'OK' : diff > 0 ? 'QGK maior' : 'Tine maior';
      return ['"' + t.nome.replace(/"/g,'""') + '"', t.sku, tQt, qQt, diff, status];
    });

    // Adiciona produtos só no QGK
    qgkList.forEach(q => {
      if (!_tineData.find(t => t.sku.toUpperCase() === q.sku.toUpperCase())) {
        rows.push(['"' + q.name.replace(/"/g,'""') + '"', q.sku, '', q.qty, '', 'Só no QGK']);
      }
    });

    const csv  = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'comparativo-qgk-tine-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    Toast.show('Comparativo exportado!', 'green');
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    loadConfig();
    loadCache();
    if (_tineData.length) renderComparativo();
  }


  // ── Toggle fonte de dados ─────────────────────────────────────────
  function _showSrc(type) {
    document.getElementById('comp-src-file').style.display = type === 'file' ? '' : 'none';
    document.getElementById('comp-src-url').style.display  = type === 'url'  ? '' : 'none';
    document.getElementById('src-btn-file').classList.toggle('active', type === 'file');
    document.getElementById('src-btn-url').classList.toggle('active',  type === 'url');
  }

  return {
    init, loadConfig, saveConfig,
    importarTine, handleFileUpload,
    renderComparativo,
    setFiltro, setMostrar, setOrdenar,
    exportCSV, _showSrc,
  };
})();
