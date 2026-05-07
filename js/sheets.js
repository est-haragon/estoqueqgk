/**
 * sheets.js — Integração com Google Sheets via Apps Script Web App
 * O Sheets é o banco de dados central. localStorage é só o cache local.
 */

const Sheets = (() => {
  let _isSyncing = false;

  // ── GAS Code (exibido na aba de configuração) ─────────────────────
  // Armazenado como array e depois joined para evitar problema com backticks
  const GAS_LINES = [
    '// ═══════════════════════════════════════════════════════════════',
    '// QGK Estoque — Google Apps Script (Code.gs)',
    '//',
    '// COMO PUBLICAR:',
    '//   1. Abra a planilha Google Sheets que deseja usar',
    '//   2. Menu: Extensões → Apps Script',
    '//   3. Apague o código padrão e cole TODO este arquivo',
    '//   4. Clique em "Implantar" → "Novo implante"',
    '//   5. Tipo: Web App | Executar como: Eu | Acesso: Qualquer pessoa',
    '//   6. Clique "Implantar" (autorize as permissões)',
    '//   7. Copie a URL e cole na aba "Google Sheets" do sistema',
    '// ═══════════════════════════════════════════════════════════════',
    '',
    "const ABA_ESTOQUE   = 'Estoque';",
    "const ABA_HISTORICO = 'Historico';",
    '',
    'function doPost(e) {',
    '  try {',
    '    const payload = JSON.parse(e.postData.contents);',
    '    if (payload.action === "sincronizarEstoque")  return syncEstoque(payload.products);',
    '    if (payload.action === "salvarMovimentacoes") return salvarMovs(payload.entries);',
    '    if (payload.action === "ping")                return ok({ msg: "Conectado!" });',
    '    return ok({ ok: false, msg: "Acao desconhecida: " + payload.action });',
    '  } catch (err) {',
    '    return ok({ ok: false, msg: "Erro: " + err.toString() });',
    '  }',
    '}',
    '',
    'function doGet(e) {',
    '  const action = (e.parameter || {}).action || "";',
    '  if (action === "ping")            return ok({ msg: "Conectado!" });',
    '  if (action === "importarEstoque") return importEstoque();',
    '  return ok({ ok: false, msg: "Use: ?action=ping ou ?action=importarEstoque" });',
    '}',
    '',
    'function syncEstoque(products) {',
    '  if (!products || !products.length) return ok({ ok: false, msg: "Nenhum produto recebido." });',
    '  const ss    = SpreadsheetApp.getActiveSpreadsheet();',
    '  let   sheet = ss.getSheetByName(ABA_ESTOQUE) || ss.insertSheet(ABA_ESTOQUE);',
    '  sheet.clearContents();',
    '  const h = [["ID","Produto","SKU","Bloco","Corredor","Unidade","Quantidade","Alerta Min","Atualizado em"]];',
    '  const hR = sheet.getRange(1,1,1,9);',
    '  hR.setValues(h).setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#e8b400");',
    '  const now  = new Date().toLocaleString("pt-BR");',
    '  const rows = products.map(p => [',
    '    String(p.id||""), String(p.name||""), String(p.sku||""),',
    '    String(p.bloco||""), String(p.corredor||""), String(p.unit||"UN"),',
    '    Number(p.qty)||0, Number(p.minAlert)||0, now,',
    '  ]);',
    '  sheet.getRange(2,1,rows.length,9).setValues(rows);',
    '  sheet.setFrozenRows(1);',
    '  [1,2,3,4,5,6,7,8,9].forEach(c => sheet.autoResizeColumn(c));',
    '  sheet.getRange(2,7,rows.length,1).setNumberFormat("0");',
    '  sheet.getRange(2,4,rows.length,2).setHorizontalAlignment("center");',
    '  rows.forEach((r,i) => {',
    '    const rg = sheet.getRange(i+2,1,1,9);',
    '    if (Number(r[6]) === 0) { rg.setBackground("#2a1515"); rg.setFontColor("#ff8080"); }',
    '    else { rg.setBackground("#ffffff"); rg.setFontColor("#000000"); }',
    '  });',
    '  return ok({ msg: rows.length + " produtos sincronizados." });',
    '}',
    '',
    'function importEstoque() {',
    '  const ss    = SpreadsheetApp.getActiveSpreadsheet();',
    '  const sheet = ss.getSheetByName(ABA_ESTOQUE);',
    '  if (!sheet) return ok({ ok: false, msg: "Aba Estoque nao encontrada. Envie o estoque primeiro.", products: [] });',
    '  const data = sheet.getDataRange().getValues();',
    '  if (data.length < 2) return ok({ products: [] });',
    '  const products = data.slice(1).filter(r => String(r[2]).trim()).map(r => ({',
    '    id: String(r[0]||"").trim(), name: String(r[1]||"").trim(), sku: String(r[2]||"").trim(),',
    '    bloco: String(r[3]||"").trim(), corredor: String(r[4]||"").trim(),',
    '    unit: String(r[5]||"UN").trim(), qty: parseInt(r[6])||0, minAlert: parseInt(r[7])||0,',
    '  }));',
    '  return ok({ products });',
    '}',
    '',
    'function salvarMovs(entries) {',
    '  if (!entries || !entries.length) return ok({ msg: "0 entradas." });',
    '  const ss    = SpreadsheetApp.getActiveSpreadsheet();',
    '  let   sheet = ss.getSheetByName(ABA_HISTORICO);',
    '  if (!sheet) {',
    '    sheet = ss.insertSheet(ABA_HISTORICO);',
    '    const h = sheet.getRange(1,1,1,6);',
    '    h.setValues([["Data/Hora","Produto","SKU","Delta","Qtd Final","ID"]]);',
    '    h.setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#e8b400");',
    '    sheet.setFrozenRows(1);',
    '  }',
    '  const rows = [...entries].sort((a,b) => b.ts - a.ts).map(e => [',
    '    new Date(e.ts).toLocaleString("pt-BR"),',
    '    String(e.name||""), String(e.sku||""), Number(e.delta||0), Number(e.qty||0), String(e.id||""),',
    '  ]);',
    '  sheet.insertRowsAfter(1, rows.length);',
    '  sheet.getRange(2,1,rows.length,6).setValues(rows);',
    '  rows.forEach((r,i) => {',
    '    sheet.getRange(i+2,4,1,1).setFontColor(Number(r[3]) >= 0 ? "#00c97a" : "#ff3b3b").setFontWeight("bold");',
    '  });',
    '  [1,2,3,4,5,6].forEach(c => sheet.autoResizeColumn(c));',
    '  return ok({ msg: rows.length + " movimentacoes salvas." });',
    '}',
    '',
    'function ok(obj) {',
    '  if (obj.ok === undefined) obj.ok = true;',
    '  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);',
    '}',
  ];

  function getGasCode() { return GAS_LINES.join('\n'); }

  // ── UI helpers ────────────────────────────────────────────────────
  function _setStatus(type, msg) {
    const el = document.getElementById('gs-status');
    if (!el) return;
    el.style.display = 'block';
    el.className = 'gs-status ' + type;
    el.textContent = msg;
  }

  function _setLog(msg) {
    const el = document.getElementById('sync-log');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
  }

  function _appendLog(msg) {
    const el = document.getElementById('sync-log');
    if (!el) return;
    el.textContent += '\n' + msg;
    el.scrollTop = el.scrollHeight;
  }

  // ── Config ────────────────────────────────────────────────────────
  function loadUrl() {
    const url = Store.getGsUrl();
    const inp = document.getElementById('gs-url');
    if (inp && url) inp.value = url;
  }

  function saveUrl() {
    const url = document.getElementById('gs-url').value.trim();
    if (!url) { _setStatus('err', '⚠️ Informe a URL do Apps Script.'); return; }
    if (!url.includes('script.google.com')) { _setStatus('err', '⚠️ URL inválida — deve ser do script.google.com'); return; }
    Store.setGsUrl(url);
    _setStatus('ok', '✅ URL salva!');
  }

  function _url() { return Store.getGsUrl() || document.getElementById('gs-url')?.value?.trim() || ''; }

  // ── Testar conexão ────────────────────────────────────────────────
  async function testConnection() {
    const url = _url();
    if (!url) { _setStatus('err', '⚠️ Configure a URL primeiro.'); return; }
    _setStatus('info', '🔌 Testando…');
    try {
      const res  = await fetch(url + '?action=ping');
      const json = await res.json();
      json.ok ? _setStatus('ok', '✅ ' + json.msg) : _setStatus('err', '❌ ' + json.msg);
    } catch (e) {
      _setStatus('err', '❌ Falha: ' + e.message + '\n\nVerifique:\n• Script publicado como Web App?\n• Acesso: Qualquer pessoa?\n• URL correta?');
    }
  }

  // ── Enviar → Sheets ───────────────────────────────────────────────
  async function syncTo() {
    const url = _url();
    if (!url) { _setLog('⚠️ Configure a URL acima.'); return; }
    if (_isSyncing) return;
    _isSyncing = true;
    const list = Store.loadProducts();
    _setLog('⬆️ Enviando ' + list.length + ' produtos para o Google Sheets…');
    Store.setSyncState('syncing');
    console.log(Store.loadProducts())
    try {
      const res  = await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'sincronizarEstoque', products: list }) });
      const json = await res.json();
      if (json.ok) {
        _appendLog('✅ ' + json.msg);
        _appendLog('⏰ ' + new Date().toLocaleString('pt-BR'));
        Store.clearPending();
        const hist = Store.getHistory().slice(0, 100);
        if (hist.length) { _appendLog('📋 Enviando ' + hist.length + ' movimentações…'); _sendHistory(url, hist); }
        Toast.show('Estoque sincronizado!', 'green');
      } else {
        _appendLog('❌ ' + json.msg);
        Store.setSyncState('error');
      }
    } catch (e) {
      _appendLog('❌ Erro de rede: ' + e.message);
      Store.setSyncState('error');
    } finally { _isSyncing = false; }
  }

  // ── Importar ← Sheets ─────────────────────────────────────────────
  async function syncFrom() {
    const url = _url();
    if (!url) { _setLog('⚠️ Configure a URL acima.'); return; }
    if (_isSyncing) return;
    _isSyncing = true;
    _setLog('⬇️ Importando do Google Sheets…');
    Store.setSyncState('syncing');
    try {
      const res  = await fetch(url + '?action=importarEstoque');
      const json = await res.json();
      if (!json.ok) { _appendLog('❌ ' + json.msg); Store.setSyncState('error'); return; }
      const imported = json.products || [];
      if (!imported.length) { _appendLog('ℹ️ Planilha vazia.'); return; }
      const local   = Store.loadProducts();
      let updated   = 0, added = 0;
      imported.forEach(imp => {
        const loc = Store.findBySku(imp.sku, local);
        if (loc) {
          if (loc.qty !== imp.qty) Store.addHistoryEntry(loc, imp.qty - loc.qty, imp.qty);
          loc.id = imp.id || loc.id; loc.name = imp.name || loc.name;
          loc.qty = imp.qty; loc.unit = imp.unit || loc.unit; loc.minAlert = imp.minAlert || loc.minAlert;
          loc.bloco    = imp.bloco    !== undefined ? imp.bloco    : (loc.bloco    || '');
          loc.corredor = imp.corredor !== undefined ? imp.corredor : (loc.corredor || '');
          updated++;
        } else {
          local.push({ id: imp.id || ('p_' + Date.now()), name: imp.name, sku: imp.sku,
            unit: imp.unit || 'UN', qty: imp.qty, minAlert: imp.minAlert || 0,
            bloco: imp.bloco || '', corredor: imp.corredor || '' });
          added++;
        }
      });
      Store.setProducts(local);
      Store.clearPending();
      UI.renderTable();
      UI.updateStats();
      _appendLog('✅ ' + updated + ' atualizados, ' + added + ' novos — total ' + local.length + ' produtos.');
      _appendLog('⏰ ' + new Date().toLocaleString('pt-BR'));
      Toast.show('Importados: ' + (updated + added) + ' produtos', 'green');
    } catch (e) {
      _appendLog('❌ ' + e.message);
      Store.setSyncState('error');
    } finally { _isSyncing = false; }
  }

  // ── Auto-sync silencioso na abertura ──────────────────────────────
  async function autoSync() {
    const url = _url();
    if (!url) return;
    try {
      const res  = await fetch(url + '?action=importarEstoque');
      const json = await res.json();
      if (!json.ok || !json.products?.length) return;
      const local = Store.loadProducts();
      json.products.forEach(imp => {
        const loc = Store.findBySku(imp.sku, local);
        if (!loc) return;
        loc.qty      = imp.qty;
        loc.bloco    = imp.bloco    !== undefined ? imp.bloco    : loc.bloco;
        loc.corredor = imp.corredor !== undefined ? imp.corredor : loc.corredor;
      });
      Store.setProducts(local);
      Store.clearPending();
      UI.renderTable();
      UI.updateStats();
    } catch (_) { /* offline, usa cache */ }
  }

  async function _sendHistory(url, entries) {
    try { await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'salvarMovimentacoes', entries }) }); }
    catch (_) {}
  }

  function copyCode() {
    navigator.clipboard.writeText(getGasCode())
      .then(() => Toast.show('Código copiado!'))
      .catch(() => Toast.show('Erro ao copiar — selecione e copie manualmente.', 'red'));
  }

  return { loadUrl, saveUrl, testConnection, syncTo, syncFrom, autoSync, copyCode, getGasCode };
})();
