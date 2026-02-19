/**
 * SISTEMA DE AUTOMAÇÃO DE INVESTIMENTOS (AI)
 * Repositório: [Seu Link do GitHub]
 * Autor: Thyfani
 */

// ==========================================
// CONFIGURAÇÕES GERAIS (Substitua pelos seus dados)
// ==========================================
const EMAIL_FINANCEIRO = "financeiro@suaempresa.com.br";
const EMAIL_CEO = "ceo@suaempresa.com.br";
const EMAIL_CONTROLADORIA = "controladoria@suaempresa.com.br";
const ID_MODELO_DOC = "COLE_O_ID_DO_SEU_DOC_AQUI"; // ID do template no Google Docs
const LOGO_URL = "https://via.placeholder.com/150x50/FF6600/FFFFFF?text=Sua+Logo"; // URL da logo para e-mails

// ==========================================
// ROTEAMENTO PRINCIPAL (Abre o site ou processa link)
// ==========================================
function doGet(e) {
  if (e.parameter.token && e.parameter.action) {
    return processarAprovacaoViaToken(e.parameter.token, e.parameter.action, e.parameter.type);
  }
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Sistema AI | Autorização de Investimentos')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ==========================================
// AUTENTICAÇÃO
// ==========================================
function verificarCredenciais(email, senha) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usuarios");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == email && data[i][2].toString() == senha.toString()) {
      return {
        nome: data[i][0],      
        email: data[i][1],     
        cargo: data[i][3],     
        diretor: data[i][5]    
      };
    }
  }
  return null;
}

// ==========================================
// CADASTRO DE NOVA SOLICITAÇÃO (AI)
// ==========================================
function registrarNovaAI(dados) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base_AI");
    if (!sheet) throw new Error("Aba 'Base_AI' não encontrada.");

    var token = Utilities.getUuid();
    var id = "AI-" + new Date().getTime();
    
    sheet.appendRow([
      id, token, dados.dataDocumento, 
      "AGUARDANDO DIRETOR", "DIRETOR_NEGOCIO",
      dados.solicitante, dados.emailSolicitante, dados.diretorNegocio,
      dados.tipoItem, dados.estabelecimento, dados.centroCusto,
      dados.unidadeNegocio, dados.setorSolicitante, dados.resumoProjeto,
      JSON.stringify(dados.itens), dados.totalGeral, dados.fornecedor,
      dados.orcado, dados.valorOrcado, dados.formaPagamento, dados.usuarioEMS
    ]);
    
    dados.projeto = dados.resumoProjeto; 
    
    enviarEmailAprovacao(dados, token, "DIRETOR_NEGOCIO");
    notificarStatusUsuario(dados.emailSolicitante, dados.projeto, "Enviado para análise do Diretor de Negócio.");
    
    return id;
  } catch (e) {
    throw new Error(e.message);
  }
}

// ==========================================
// LÓGICA DE APROVAÇÃO (LINKS DO E-MAIL)
// ==========================================
function processarAprovacaoViaToken(token, action, type) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base_AI");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === token) { 
      var linha = i + 1;
      var nivelAtual = data[i][4];
      var projetoNome = data[i][13];
      var emailUsuario = data[i][6];
      
      if (action === 'reject') {
        sheet.getRange(linha, 4).setValue("REJEITADA");
        sheet.getRange(linha, 5).setValue("ENCERRADO");
        notificarStatusUsuario(emailUsuario, projetoNome, "🔴 Sua solicitação foi REJEITADA.");
        return HtmlService.createHtmlOutput("<h2 style='font-family:sans-serif; color:red; text-align:center;'>Rejeição registrada.</h2>");
      }

      var assinante = "";
      if (type === 'controladoria') { assinante = "Controladoria (Aprovação Técnica)"; } 
      else {
        if (nivelAtual === "DIRETOR_NEGOCIO") assinante = data[i][7]; 
        else if (nivelAtual === "DIRETOR_FINANCEIRO") assinante = "Diretoria Financeira";
        else if (nivelAtual === "CEO") assinante = "CEO / Presidência";
        else assinante = "Diretoria"; 
      }

      var carimbo = `Aprovado por: ${assinante}\nData: ${Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm")}`;
      
      if (nivelAtual === "DIRETOR_NEGOCIO") {
        sheet.getRange(linha, 22).setValue(carimbo); 
        sheet.getRange(linha, 4).setValue("AGUARDANDO FINANCEIRO");
        sheet.getRange(linha, 5).setValue("DIRETOR_FINANCEIRO");
        prepararProximoEnvio(data[i], "DIRETOR_FINANCEIRO");
        notificarStatusUsuario(emailUsuario, projetoNome, "✅ Aprovado pelo Negócio. Enviado ao Financeiro.");

      } else if (nivelAtual === "DIRETOR_FINANCEIRO") {
        sheet.getRange(linha, 23).setValue(carimbo); 
        sheet.getRange(linha, 4).setValue("AGUARDANDO CEO");
        sheet.getRange(linha, 5).setValue("CEO");
        prepararProximoEnvio(data[i], "CEO");
        notificarStatusUsuario(emailUsuario, projetoNome, "✅ Aprovado pelo Financeiro. Enviado ao CEO.");

      } else if (nivelAtual === "CEO") {
        sheet.getRange(linha, 24).setValue(carimbo); 
        sheet.getRange(linha, 4).setValue("APROVADA - AGUARDANDO NUMERAÇÃO");
        sheet.getRange(linha, 5).setValue("FINALIZACAO");
        notificarStatusUsuario(emailUsuario, projetoNome, "🎉 APROVAÇÃO FINAL DO CEO! Aguardando Controladoria.");
        notificarControladoriaParaFinalizar(data[i]); 
      }
      
      return HtmlService.createHtmlOutput(`
        <div style='font-family:sans-serif; text-align:center; margin-top:50px;'>
          <h1 style='color:#FF6600;'>Sucesso!</h1>
          <p>Aprovação de <strong>${assinante}</strong> registrada.</p>
          <p>Você pode fechar esta janela.</p>
        </div>
      `);
    }
  }
  return HtmlService.createHtmlOutput("<h2 style='text-align:center;'>Token inválido ou expirado.</h2>");
}

function prepararProximoEnvio(row, proximoNivel) {
  var dados = {
    token: row[1],
    dataDocumento: Utilities.formatDate(new Date(row[2]), "GMT-3", "dd/MM/yyyy"),
    solicitante: row[5], emailSolicitante: row[6], diretorNegocio: row[7],
    tipoItem: row[8], estabelecimento: row[9], centroCusto: row[10],
    unidadeNegocio: row[11], setorSolicitante: row[12], projeto: row[13],          
    itens: row[14] ? JSON.parse(row[14]) : [], totalGeral: row[15],
    fornecedor: row[16], orcado: row[17], valorOrcado: row[18],
    formaPagamento: row[19], usuarioEMS: row[20]
  };
  enviarEmailAprovacao(dados, dados.token, proximoNivel);
}

// ==========================================
// NOTIFICAÇÕES DE E-MAIL
// ==========================================
function notificarStatusUsuario(email, projeto, mensagemStatus) {
  GmailApp.sendEmail(email, "Status da AI: " + projeto, mensagemStatus);
}

function enviarEmailAprovacao(dados, token, nivel) {
  var webAppUrl = ScriptApp.getService().getUrl();
  var linkDiretor = `${webAppUrl}?token=${token}&action=approve&type=diretor`;
  var linkControladoria = `${webAppUrl}?token=${token}&action=approve&type=controladoria`;
  var linkRejeitar = `${webAppUrl}?token=${token}&action=reject`;
  
  var lista = Array.isArray(dados.itens) ? dados.itens : JSON.parse(dados.itens || "[]");
  var tabelaHtml = '<table border="1" style="border-collapse:collapse; width:100%; font-size:12px; border-color:#eee;">' +
                   '<tr style="background:#FFF0E6; color:#FF6600;"><th>Detalhe</th><th>Item</th><th>Classif.</th><th>Qtd</th><th>Total</th></tr>';
  
  if (lista.length > 0) {
    lista.forEach(i => { tabelaHtml += `<tr><td>${i.detalhe||'-'}</td><td>${i.item}</td><td>${i.classif||'-'}</td><td>${i.qtd}</td><td>R$ ${i.total}</td></tr>`; });
  } else { tabelaHtml += '<tr><td colspan="5">-</td></tr>'; }
  tabelaHtml += '</table>';

  var htmlBody = `
    <div style="font-family:'Segoe UI', sans-serif; border-top:5px solid #FF6600; padding:30px; max-width:700px; background-color:#fff;">
      <img src="${LOGO_URL}" alt="Logo Empresa" style="max-height:40px; margin-bottom:20px;">
      <h2 style="color:#333; margin-top:0;">Aprovação de Investimento</h2>
      <p style="background:#FFF0E6; color:#FF6600; padding:8px; display:inline-block; border-radius:4px;">NÍVEL: ${nivel.replace("_", " ")}</p>
      <div style="background:#f9f9f9; padding:15px; margin:20px 0; border-radius:4px;">
        <p><strong>Projeto:</strong> ${dados.projeto}</p>
        <p><strong>Solicitante:</strong> ${dados.solicitante}</p>
        <p><strong>Valor Total:</strong> <span style="color:#FF6600; font-weight:bold;">R$ ${dados.totalGeral}</span></p>
        <p><strong>Centro de Custo:</strong> ${dados.centroCusto}</p>
      </div>
      ${tabelaHtml}
      <div style="margin-top:30px; text-align:center;">
        <a href="${linkDiretor}" style="background:#FF6600; color:white; padding:12px 30px; text-decoration:none; border-radius:4px; font-weight:bold; margin:5px;">APROVAR</a>
        <a href="${linkRejeitar}" style="background:#333; color:white; padding:12px 30px; text-decoration:none; border-radius:4px; font-weight:bold; margin:5px;">REJEITAR</a>
      </div>
       <div style="margin-top:20px; text-align:center;">
         <a href="${linkControladoria}" style="font-size:11px; color:#999;">Acesso Controladoria Backup</a>
      </div>
    </div>
  `;

  var dest = "", ccList = EMAIL_CONTROLADORIA;
  if (nivel === "DIRETOR_NEGOCIO") dest = dados.diretorNegocio;
  else if (nivel === "DIRETOR_FINANCEIRO") dest = EMAIL_FINANCEIRO;
  else if (nivel === "CEO") { dest = EMAIL_CEO; ccList += `, ${EMAIL_FINANCEIRO}`; }

  if(dest) GmailApp.sendEmail(dest, "Aprovação: " + dados.projeto, "", { htmlBody: htmlBody, cc: ccList });
}

function notificarControladoriaParaFinalizar(row) {
  var webAppUrl = ScriptApp.getService().getUrl() + "?page=controladoria";
  var htmlBody = `
    <div style="font-family:'Segoe UI', sans-serif; border-top:5px solid #FF6600; padding:30px; background-color:#fff;">
      <img src="${LOGO_URL}" alt="Logo Empresa" style="max-height:40px; margin-bottom:20px;">
      <h2 style="color:#333;">Ação Necessária: Finalização de AI</h2>
      <p>O projeto <strong>${row[13]}</strong> foi aprovado por todos os diretores.</p>
      <p style="background:#FFF0E6; color:#FF6600; padding:10px; font-weight:bold;">Registre no ERP e insira o Número Oficial no painel.</p>
      <div style="margin-top:30px; text-align:center;">
        <a href="${webAppUrl}" style="background:#FF6600; color:white; padding:12px 30px; text-decoration:none; border-radius:4px; font-weight:bold;">ACESSAR PAINEL</a>
      </div>
    </div>
  `;
  GmailApp.sendEmail(EMAIL_CONTROLADORIA, "⚠️ FINALIZAR AI: " + row[13], "", { htmlBody: htmlBody });
}

// ==========================================
// MÓDULO CONTROLADORIA & GERADOR DE PDF
// ==========================================
function buscarDadosControladoria() {
  var data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base_AI").getDataRange().getValues();
  var ais = [];
  for (var i = 1; i < data.length; i++) {
    ais.push({
      id: data[i][0], data: Utilities.formatDate(new Date(data[i][2]), "GMT-3", "dd/MM/yyyy"),
      solicitante: data[i][5], projeto: data[i][13], valor: data[i][15], status: data[i][3], nivel: data[i][4]
    });
  }
  return ais.reverse();
}

function finalizarProcessoAI(dados) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base_AI");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === dados.idAI) {
      sheet.getRange(i+1, 4).setValue("FINALIZADA"); 
      sheet.getRange(i+1, 5).setValue("CONCLUIDO");
      sheet.getRange(i+1, 25).setValue(dados.numeroAI);
      sheet.getRange(i+1, 26).setValue(dados.ano);
      sheet.getRange(i+1, 27).setValue(dados.idProjeto);
      return gerarPDFFinal(i+1);
    }
  }
  return "Erro: AI não encontrada.";
}

function gerarPDFFinal(linhaIndex) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base_AI");
    var dados = sheet.getRange(linhaIndex, 1, 1, 27).getValues()[0];
    
    var modeloFile = DriveApp.getFileById(ID_MODELO_DOC);
    var nomeArquivo = "AI_" + dados[24] + "_" + dados[25] + "_Final";
    var copiaFile = modeloFile.makeCopy(nomeArquivo);
    var doc = DocumentApp.openById(copiaFile.getId());
    var body = doc.getBody();

    var assDir = dados[21] && dados[21].includes("Aprovado") ? dados[21] : "Aguardando";
    var assFin = dados[22] && dados[22].includes("Aprovado") ? dados[22] : "Aguardando";
    var assCeo = dados[23] && dados[23].includes("Aprovado") ? dados[23] : "Aguardando";

    var rep = {
      "{{NUMERO_AI}}": dados[24], "{{ANO}}": dados[25], "{{DATA}}": Utilities.formatDate(new Date(dados[2]), "GMT-3", "dd/MM/yyyy"),
      "{{SOLICITANTE}}": dados[5], "{{DEPARTAMENTO}}": dados[12], "{{PROJETO}}": dados[26], "{{RESUMO}}": dados[13],
      "{{VALOR_TOTAL}}": "R$ " + dados[15], "{{FORNECEDOR}}": dados[16], "{{CENTRO_CUSTO}}": dados[10],
      "{{UNIDADE}}": dados[11], "{{TIPO_ITEM}}": dados[8], "{{ESTABE}}": dados[9],
      "{{ASSINATURA_DIRETOR}}": assDir, "{{ASSINATURA_FINANCEIRO}}": assFin, "{{ASSINATURA_CEO}}": assCeo
    };
    for (var key in rep) body.replaceText(key, rep[key] || "-");

    try {
      var itens = JSON.parse(dados[14] || "[]");
      var search = body.findText("{{TABELA_ITENS}}");
      if (search && itens.length > 0) {
        var el = search.getElement(), par = el.getParent().asParagraph(), idx = body.getChildIndex(par);
        var table = body.insertTable(idx);
        try { body.removeChild(par); } catch(err) { par.clear(); }
        
        table.setBorderColor("#999999").setBorderWidth(1);
        var header = table.appendTableRow();
        header.appendTableCell("Detalhe").setBackgroundColor("#EEEEEE").setBold(true).setWidth(140); 
        header.appendTableCell("Item Contábil").setBackgroundColor("#EEEEEE").setBold(true).setWidth(110);
        header.appendTableCell("Classif.").setBackgroundColor("#EEEEEE").setBold(true).setWidth(100);
        header.appendTableCell("Qtd").setBackgroundColor("#EEEEEE").setBold(true).setWidth(35);
        header.appendTableCell("Total").setBackgroundColor("#EEEEEE").setBold(true).setWidth(70);
        
        itens.forEach(i => {
          var r = table.appendTableRow();
          r.appendTableCell(i.detalhe || "-").setWidth(140);
          r.appendTableCell(i.item.toString()).setWidth(110);
          r.appendTableCell(i.classif || "-").setWidth(100);
          r.appendTableCell(i.qtd.toString()).setWidth(35);
          r.appendTableCell("R$ " + i.total.toString()).setWidth(70);
        });
      } else { body.replaceText("{{TABELA_ITENS}}", "-"); }
    } catch(e) {}

    doc.saveAndClose();
    var pdfBlob = copiaFile.getAs(MimeType.PDF);
    
    try {
      var htmlFinal = `
        <div style="background:#f2f2f2; padding:40px 0; font-family:'Segoe UI', sans-serif;">
          <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden;">
            <div style="background:#FF6600; padding:30px; text-align:center;">
              <h1 style="color:white; margin:0; text-transform:uppercase;">Processo Concluído</h1>
            </div>
            <div style="padding:40px;">
              <p style="text-align:center;">O fluxo de aprovação foi finalizado com sucesso.</p>
              <div style="background:#FFF5EE; border-left:4px solid #FF6600; padding:20px; margin:30px 0;">
                <p><strong>PROJETO:</strong> <br>${dados[13]}</p>
                <p><strong>PROCESSO (ERP):</strong> <br>${dados[26]}</p>
                <p><strong>VALOR AUTORIZADO:</strong> <br><span style="font-size:20px; color:#FF6600; font-weight:bold;">R$ ${dados[15]}</span></p>
              </div>
            </div>
          </div>
        </div>
      `;
      GmailApp.sendEmail([dados[6], dados[7], EMAIL_FINANCEIRO, EMAIL_CEO, EMAIL_CONTROLADORIA].join(","), "✅ AI CONCLUÍDA", "Anexo", { attachments: [pdfBlob], htmlBody: htmlFinal });
      copiaFile.setTrashed(true);
      return "Sucesso! Processo concluído.";
    } catch (e) {
      var arquivoSalvo = DriveApp.createFile(pdfBlob);
      copiaFile.setTrashed(true);
      return "⚠️ Email bloqueado (Cota). PDF salvo no Drive: " + arquivoSalvo.getName();
    }
  } catch (err) { return "Erro Crítico: " + err.message; }
}
