# 📦 QGK Estoque — Guia Completo do Sistema

---

## 🚀 Como abrir o sistema

1. Extraia o arquivo ZIP em qualquer pasta do computador
2. Abra a pasta `qgk-estoque`
3. Dê duplo clique em **`index.html`**
4. O sistema abre direto no navegador — sem instalação, sem internet obrigatória

> ✅ Funciona no Chrome, Edge e Firefox.
> 💾 Os dados ficam salvos no navegador (localStorage). Não apague o histórico do navegador ou os dados serão perdidos. Para garantir, use sempre o Google Sheets como backup.

---

## 📌 Navegação — As 5 Abas

No topo da tela existem 5 abas. Clique em qualquer uma para trocar de seção:

| Aba | O que faz |
|-----|-----------|
| 📦 Estoque | Lista todos os produtos, quantidades e localizações |
| 📷 Scanner | Lê o código de barras e atualiza o estoque |
| 📋 Histórico | Mostra todas as entradas e saídas registradas |
| 🖨️ Imprimir | Gera e imprime etiquetas com código de barras |
| ☁️ Google Sheets | Sincroniza os dados com a planilha Google |

---

## 📦 ABA ESTOQUE

Aqui ficam todos os produtos cadastrados com nome, SKU, localização e quantidade.

---

### 🔍 Buscar produto

**Como usar:**
1. Clique na barra de busca no topo da aba
2. Digite o nome do produto OU o código SKU
3. A tabela filtra automaticamente enquanto você digita

**Exemplo:** Digite `pistola` para ver todos os produtos com essa palavra no nome.
Digite `I021950` para encontrar o produto pelo SKU exato.

---

### ➕ Adicionar produto novo

**Como usar:**
1. Clique no botão **＋ Produto**
2. Preencha os campos:
   - **Nome do Produto** — nome completo (ex: PISTOLA AIRSOFT SPRING S226)
   - **SKU** — código único do produto (ex: I021950-1)
   - **Bloco** — letra do bloco onde está guardado (ex: A, B, C)
   - **Corredor** — número do corredor (ex: 01, 02, 03)
   - **Quantidade** — quantidade atual no estoque
3. Clique em **Salvar**

> ⚠️ O SKU precisa ser único. Se já existir um produto com o mesmo SKU, o sistema avisa antes de salvar.

---

### ✏️ Editar produto

**Como usar:**
1. Clique em qualquer linha da tabela para abrir o produto
2. Altere o que precisar (nome, SKU, bloco, corredor ou quantidade)
3. Clique em **Salvar**

---

### ➕1 / −1 Ajuste rápido de quantidade

**Como usar:**
- Na coluna **Ações** de cada produto, clique em **+1** para adicionar uma unidade
- Clique em **−1** para remover uma unidade
- A quantidade nunca vai abaixo de zero

> 💡 Use para correções rápidas sem precisar abrir o produto.

---

### 🗑️ Remover produto

**Como usar:**
1. Na coluna **Ações**, clique no botão vermelho **✕**
2. Confirme na janela que aparecer

> ⚠️ Esta ação não pode ser desfeita.

---

### 📊 Ver código de barras

**Como usar:**
1. Na coluna **Ações**, clique em **📊**
2. O código de barras do produto aparece em tela
3. Clique em **🖨️ Imprimir** para imprimir a etiqueta individual

---

### 🗺️ Ver Mapa de Localização

**Como usar:**
1. Clique no botão **🗺️ Mapa** na toolbar
2. A tabela é substituída pelo mapa visual
3. Os produtos aparecem agrupados por **Bloco → Corredor**
4. Clique em qualquer produto no mapa para editar
5. Clique em **📋 Ver Tabela** para voltar à tabela normal

**Para que serve:** Facilita a separação de kits — o colaborador vê exatamente em qual bloco e corredor cada produto está, sem precisar procurar na tabela.

**Cores dos blocos:**
- Cabeçalho azul = bloco identificado
- Badge amarelo = número do bloco
- Badge azul = número do corredor

---

### ⬇️ Exportar CSV

**Como usar:**
1. Clique no botão **⬇ CSV**
2. Um arquivo `.csv` é baixado automaticamente
3. Abra no Excel ou Google Sheets

O arquivo contém: Nome, SKU, Bloco, Corredor, Unidade, Quantidade.

---

### 🟢🟡🔴 Badges de quantidade

| Cor | Significado |
|-----|-------------|
| 🟢 Verde | Estoque normal |
| 🟡 Amarelo | Estoque abaixo do mínimo configurado |
| 🔴 Vermelho | Estoque zerado |

---

## 📷 ABA SCANNER

Use esta aba com o leitor de código de barras USB conectado ao computador.

---

### Como funciona

O leitor USB emula um teclado. Quando você escaneia um código:
1. O sistema identifica o produto pelo SKU
2. Ajusta a quantidade automaticamente conforme o modo selecionado
3. Mostra o produto encontrado com a quantidade atualizada

---

### ▲ Modo Entrada / ▼ Modo Saída

**Como usar:**
- Clique em **▲ Entrada** antes de escanear produtos que estão **chegando** ao estoque
- Clique em **▼ Saída** antes de escanear produtos que estão **saindo** do estoque

> O modo selecionado fica destacado em verde (entrada) ou vermelho (saída).

---

### Escanear um produto

**Como usar:**
1. Selecione o modo (Entrada ou Saída)
2. Clique no campo de leitura (o campo piscante no centro)
3. Aponte o leitor para o código de barras na caixa
4. O sistema lê automaticamente e atualiza +1 ou −1

**O que aparece após a leitura:**
- Nome do produto
- SKU
- Localização (Bloco e Corredor, se cadastrado)
- Quantidade atual atualizada

---

### ➕1 ➕5 ➕10 / −1 −5 Ajuste manual no scanner

Após escanear um produto, você pode ajustar mais:
- **+1, +5, +10** — adiciona essa quantidade ao estoque
- **−1, −5** — remove essa quantidade do estoque

---

### Definir qtd

**Como usar:**
1. Escaneie o produto
2. Clique em **Definir qtd**
3. Digite o valor exato da quantidade atual
4. Clique em **Confirmar**

> Use quando for fazer um inventário e quiser definir a quantidade real, não apenas adicionar ou subtrair.

---

### ⚠️ SKU não encontrado

Se o código escaneado não existir no sistema:
- Aparece a mensagem **"SKU não encontrado"** com o código lido
- Clique em **＋ Cadastrar este produto** para abrir o formulário com o SKU já preenchido

---

## 📋 ABA HISTÓRICO

Registra automaticamente toda movimentação de estoque.

---

### O que é registrado

Toda vez que uma quantidade é alterada — seja pelo scanner, pelo +1/−1 da tabela, ou pelo modal de edição — o sistema registra:
- Data e hora
- Nome do produto
- SKU
- Delta (quanto foi adicionado ou removido)
- Quantidade final após a alteração

---

### Como ler o histórico

| Campo | Significado |
|-------|-------------|
| Nome | Produto que foi movimentado |
| SKU · Data/Hora | Código e quando aconteceu |
| **+5** (verde) | Entrada de 5 unidades |
| **−3** (vermelho) | Saída de 3 unidades |
| → 12 | Quantidade ficou em 12 após a movimentação |

---

### 🗑️ Limpar histórico

1. Clique em **🗑 Limpar**
2. Confirme na janela

> ⚠️ O histórico local é apagado. Se quiser guardar, sincronize com o Google Sheets antes — o histórico é enviado para a aba "Historico" da planilha.

---

## 🖨️ ABA IMPRIMIR

Gera e imprime etiquetas com código de barras para colar nas caixas.

---

### Selecionar produtos para imprimir

**Como usar:**
- Clique em qualquer produto para selecioná-lo (fica com borda azul)
- Clique novamente para desselecionar
- Use **Selec. todos** para selecionar todos de uma vez
- Use **Limpar** para remover a seleção
- Use a barra de busca para filtrar antes de selecionar

> Se nenhum produto estiver selecionado, o sistema usa **todos os produtos**.

---

### 🖨️ Imprimir HTML

**Como usar:**
1. Selecione os produtos desejados
2. Clique em **🖨️ Imprimir**
3. A janela de impressão do navegador abre
4. Configure a impressora e clique em Imprimir

> As etiquetas são impressas em grade, 4 por linha. Funciona em qualquer impressora normal (laser, jato de tinta).

---

### 🦓 Gerar ZPL — Impressora Zebra

Use quando tiver uma impressora de etiquetas Zebra (ou compatível com ZPL).

**Como usar:**
1. Selecione os produtos
2. Clique em **🦓 Gerar ZPL**
3. Configure as etiquetas:
   - **Largura (mm)** — largura física da etiqueta (padrão: 50mm)
   - **Altura (mm)** — altura física da etiqueta (padrão: 25mm)
   - **DPI** — resolução da impressora (verifique no manual: 203, 300 ou 600)
   - **Cópias** — quantas etiquetas de cada produto imprimir
4. Clique em **↻ Atualizar** se mudar as configurações
5. Escolha como enviar para a impressora:

---

#### Como enviar o ZPL para a impressora Zebra

**Opção A — Download .zpl (recomendado)**
1. Clique em **⬇ Download .zpl**
2. Abra o **Zebra Setup Utilities** no computador
3. Vá em **Open Communication With Printer**
4. Clique em **Send File** e selecione o arquivo `.zpl` baixado
5. As etiquetas serão impressas automaticamente

**Opção B — Download .txt (para outro computador)**
1. Clique em **⬇ Download .txt**
2. Copie o arquivo para o computador com a Zebra conectada
3. Renomeie para `.zpl` se necessário
4. Envie pelo Zebra Setup Utilities ou ZebraDesigner

**Opção C — Copiar ZPL**
1. Clique em **📋 Copiar ZPL**
2. Cole diretamente no terminal do computador com a Zebra:
   - Windows: `copy arquivo.zpl \\.\COM1` (substitua COM1 pela porta correta)
   - Linux/Mac: `cat arquivo.zpl > /dev/usb/lp0`
   - Ou use qualquer software que aceite envio via TCP porta 9100

---

#### O que aparece em cada etiqueta
- Nome do produto (truncado se necessário)
- Bloco e Corredor (se cadastrado)
- Código de barras CODE128
- Código SKU em texto

---

## ☁️ ABA GOOGLE SHEETS

Conecta o sistema a uma planilha Google como banco de dados central.

---

### Por que usar o Google Sheets?

- Seus dados ficam salvos na nuvem, não só no navegador
- Vários computadores podem usar o mesmo estoque
- Você pode ver e editar a planilha diretamente
- Funciona como backup automático

---

### Configuração — Passo a passo (fazer uma única vez)

**1. Crie a planilha**
1. Acesse [sheets.google.com](https://sheets.google.com)
2. Crie uma planilha nova (pode deixar vazia)

**2. Abra o Apps Script**
1. Na planilha, clique no menu **Extensões**
2. Clique em **Apps Script**
3. Uma nova aba abre com o editor de código

**3. Cole o código**
1. Apague o código padrão (`function myFunction() {}`)
2. Na aba **☁️ Google Sheets** do sistema, clique em **📋 Copiar** (no bloco de código)
3. Cole no editor do Apps Script
4. Clique em **💾 Salvar** (ícone de disquete ou Ctrl+S)

**4. Publique como Web App**
1. Clique em **Implantar** (botão azul no canto superior direito)
2. Clique em **Novo implante**
3. Em **Tipo**, selecione **Web App**
4. Em **Executar como**, selecione **Eu (seu e-mail)**
5. Em **Quem tem acesso**, selecione **Qualquer pessoa**
6. Clique em **Implantar**
7. Autorize as permissões pedidas pelo Google
8. **Copie a URL** que aparece (começa com `https://script.google.com/macros/s/...`)

**5. Cole a URL no sistema**
1. Volte para o sistema QGK Estoque
2. Na aba **☁️ Google Sheets**, cole a URL no campo **URL do Web App**
3. Clique em **💾 Salvar**
4. Clique em **🔌 Testar** para confirmar que a conexão funciona
5. Se aparecer ✅ Conectado — está pronto!

---

### ⬆️ Enviar → Sheets

**Quando usar:** Sempre que quiser salvar o estoque atual na planilha (backup, ou para compartilhar com outro computador).

**Como usar:**
1. Clique em **⬆️ Enviar → Sheets**
2. Aguarde a mensagem de confirmação no log abaixo do botão
3. A planilha é criada/atualizada com todos os produtos

**O que é criado na planilha:**
- Aba **Estoque** — todos os produtos com ID, nome, SKU, bloco, corredor, quantidade
- Aba **Historico** — movimentações de entrada e saída

---

### ⬇️ Importar ← Sheets

**Quando usar:**
- Ao abrir o sistema em um computador novo
- Quando outra pessoa editou a planilha diretamente
- Para sincronizar quantidades atualizadas de outro computador

**Como usar:**
1. Clique em **⬇️ Importar ← Sheets**
2. O sistema lê a planilha e atualiza as quantidades locais
3. Produtos novos na planilha são adicionados ao sistema
4. O log mostra quantos foram atualizados

> ⚠️ A importação usa o **SKU como chave**. Produtos são identificados pelo SKU, não pelo nome.

---

### 🔄 Sincronização automática

Ao abrir o sistema, ele tenta automaticamente importar os dados do Sheets em segundo plano (se a URL estiver configurada). Você não precisa fazer nada — os dados são atualizados silenciosamente.

---

### Indicador de status (canto superior direito)

| Status | Significado |
|--------|-------------|
| Local | URL do Sheets não configurada |
| Sheets ✓ (verde) | Dados sincronizados com a planilha |
| Pendente (amarelo piscando) | Há alterações locais não enviadas ainda |
| Sincronizando… (azul) | Enviando ou recebendo dados agora |
| Erro sync (vermelho) | Falha na última sincronização |

---

## ⌨️ Atalhos de teclado

| Tecla | Ação |
|-------|------|
| `Ctrl + F` | Foca na barra de busca (aba Estoque) |
| `ESC` | Fecha qualquer modal aberto |
| `Enter` | Confirma o modal aberto (salvar produto, confirmar quantidade) |

---

## ❓ Perguntas frequentes

**P: Perdi os dados do sistema. O que aconteceu?**
R: Os dados ficam no localStorage do navegador. Se o histórico do navegador foi limpo, os dados locais são apagados. Por isso é importante usar o Google Sheets como backup — clique em "Enviar → Sheets" regularmente.

**P: Posso usar em dois computadores ao mesmo tempo?**
R: Sim, desde que ambos estejam conectados ao mesmo Google Sheets. Use "Importar ← Sheets" para sincronizar antes de começar a trabalhar.

**P: A impressora Zebra não está imprimindo. O que faço?**
R: Verifique se o DPI configurado no sistema é igual ao da sua impressora (verifique no manual ou nas configurações da Zebra). Os DPIs mais comuns são 203 e 300.

**P: Como sei qual bloco e corredor usar?**
R: Você define a organização do seu depósito. Por exemplo: Bloco A = prateleira da esquerda, Bloco B = prateleira do meio. Corredor 01 = primeira fileira, Corredor 02 = segunda fileira, etc.

**P: Posso editar a planilha do Google Sheets diretamente?**
R: Sim! Você pode editar quantidades e localização diretamente na planilha. Depois clique em "Importar ← Sheets" no sistema para atualizar.

