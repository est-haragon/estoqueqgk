// ═══════════════════════════════════════════════════════════════════
// QGK Estoque — Google Apps Script (Code.gs)
//
// COMO PUBLICAR:
//   1. Acesse script.google.com e crie um novo projeto
//   2. Apague o código padrão e cole TODO este arquivo
//   3. Clique em "Implantar" > "Novo implante"
//   4. Tipo: Web App
//   5. Executar como: Eu (seu e-mail Google)
//   6. Quem tem acesso: Qualquer pessoa
//   7. Clique em "Implantar" (autorize as permissões pedidas)
//   8. Copie a URL gerada e cole na aba "Google Sheets" do sistema QGK
//
// ABAS CRIADAS NA PLANILHA:
//   - Estoque    → produtos com quantidades
//   - Historico  → movimentações (entrada/saída)
// ═══════════════════════════════════════════════════════════════════

const ABA_ESTOQUE   = 'Estoque';
const ABA_HISTORICO = 'Historico';

// ── Ponto de entrada POST ─────────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action  = payload.action;

    if (action === 'sincronizarEstoque')  return syncEstoque(payload.products);
    if (action === 'salvarMovimentacoes') return salvarMovs(payload.entries);
    if (action === 'ping')                return ok({ msg: 'Conectado com sucesso!' });

    return ok({ ok: false, msg: 'Acao desconhecida: ' + action });
  } catch (err) {
    return ok({ ok: false, msg: 'Erro interno: ' + err.toString() });
  }
}

// ── Ponto de entrada GET ──────────────────────────────────────────
function doGet(e) {
  const action = (e.parameter || {}).action || '';

  if (action === 'ping')            return ok({ msg: 'Conectado com sucesso!' });
  if (action === 'importarEstoque') return importEstoque();

  return ok({
    ok:  false,
    msg: 'Parametro action invalido. Use: ?action=ping | ?action=importarEstoque'
  });
}

// ── Sincronizar: grava produtos na aba Estoque ────────────────────
function syncEstoque(products) {
  if (!products || !products.length) {
    return ok({ ok: false, msg: 'Nenhum produto recebido.' });
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(ABA_ESTOQUE);

  if (!sheet) {
    sheet = ss.insertSheet(ABA_ESTOQUE);
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(1);
  }

  // Cabeçalho
  sheet.clearContents();
  const header = [['ID', 'Produto', 'SKU', 'Bloco', 'Corredor', 'Unidade', 'Quantidade', 'Alerta Minimo', 'Atualizado em']];
  const hRange = sheet.getRange(1, 1, 1, 9);
  hRange.setValues(header);
  hRange.setFontWeight('bold');
  hRange.setBackground('#1a1a2e');
  hRange.setFontColor('#e8b400');
  hRange.setFontSize(11);

  // Dados
  const now  = new Date().toLocaleString('pt-BR');
  const rows = products.map(p => [
    String(p.id        || ''),
    String(p.name      || ''),
    String(p.sku       || ''),
    String(p.bloco     || ''),
    String(p.corredor  || ''),
    String(p.unit      || 'UN'),
    Number(p.qty)      || 0,
    Number(p.minAlert) || 0,
    now,
  ]);

  const dataRange = sheet.getRange(2, 1, rows.length, 9);
  dataRange.setValues(rows);

  // Formatação
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(c => sheet.autoResizeColumn(c));
  sheet.setFrozenRows(1);

  // Coluna Quantidade (col 7): número inteiro
  sheet.getRange(2, 7, rows.length, 1).setNumberFormat('0');

  // Colunas Bloco/Corredor: centralizar
  sheet.getRange(2, 4, rows.length, 2).setHorizontalAlignment('center');

  // Linhas com estoque zero → fundo vermelho escuro
  rows.forEach((row, i) => {
    const rowRange = sheet.getRange(i + 2, 1, 1, 9);
    if (Number(row[6]) === 0) {
      rowRange.setBackground('#2a1515');
      rowRange.setFontColor('#ff8080');
    } else {
      rowRange.setBackground('#ffffff');
      rowRange.setFontColor('#000000');
    }
  });

  return ok({ msg: rows.length + ' produtos sincronizados com sucesso.' });
}

// ── Importar: lê aba Estoque e retorna JSON ───────────────────────
function importEstoque() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ABA_ESTOQUE);

  if (!sheet) {
    return ok({
      ok:       false,
      msg:      'Aba "Estoque" nao encontrada. Clique em "Enviar → Sheets" primeiro para criar a aba.',
      products: [],
    });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return ok({ products: [] });

  // Pula cabeçalho (linha 1) e filtra linhas com SKU
  const products = data.slice(1)
    .filter(row => String(row[2]).trim())
    .map(row => ({
      id:       String(row[0] || '').trim(),
      name:     String(row[1] || '').trim(),
      sku:      String(row[2] || '').trim(),
      bloco:    String(row[3] || '').trim(),
      corredor: String(row[4] || '').trim(),
      unit:     String(row[5] || 'UN').trim(),
      qty:      parseInt(row[6]) || 0,
      minAlert: parseInt(row[7]) || 0,
    }));

  return ok({ products });
}

// ── Salvar movimentações no histórico ─────────────────────────────
function salvarMovs(entries) {
  if (!entries || !entries.length) return ok({ msg: '0 entradas recebidas.' });

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(ABA_HISTORICO);

  if (!sheet) {
    sheet = ss.insertSheet(ABA_HISTORICO);
    const h = sheet.getRange(1, 1, 1, 6);
    h.setValues([['Data/Hora', 'Produto', 'SKU', 'Delta', 'Qtd Final', 'ID']]);
    h.setFontWeight('bold');
    h.setBackground('#1a1a2e');
    h.setFontColor('#e8b400');
    sheet.setFrozenRows(1);
  }

  // Ordena do mais recente para o mais antigo
  const sorted = [...entries].sort((a, b) => b.ts - a.ts);

  const rows = sorted.map(e => [
    new Date(e.ts).toLocaleString('pt-BR'),
    String(e.name  || ''),
    String(e.sku   || ''),
    Number(e.delta || 0),
    Number(e.qty   || 0),
    String(e.id    || ''),
  ]);

  // Insere no topo
  sheet.insertRowsAfter(1, rows.length);
  sheet.getRange(2, 1, rows.length, 6).setValues(rows);

  // Cores por tipo de movimentação
  rows.forEach((row, i) => {
    const delta = Number(row[3]);
    const r = sheet.getRange(i + 2, 4, 1, 1);
    r.setFontColor(delta >= 0 ? '#00c97a' : '#ff3b3b');
    r.setFontWeight('bold');
  });

  [1,2,3,4,5,6].forEach(c => sheet.autoResizeColumn(c));

  return ok({ msg: rows.length + ' movimentacoes salvas.' });
}

// ── Helper de resposta JSON ───────────────────────────────────────
function ok(obj) {
  if (obj.ok === undefined) obj.ok = true;
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
