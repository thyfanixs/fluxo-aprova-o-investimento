# 🚀 Sistema de Automação de Autorização de Investimentos (AI)

Um sistema web completo, desenvolvido no ecossistema Google Workspace (Google Apps Script, Sheets, Docs e Gmail), para automatizar o fluxo de solicitações, aprovações e geração de documentos de investimentos corporativos.

## 🎯 O Problema
Processos de aprovação de orçamento geralmente envolvem formulários manuais, troca excessiva de e-mails e perda de rastreabilidade. A Controladoria e a Diretoria precisavam de uma ferramenta centralizada para enviar, aprovar e documentar investimentos (Capex/Opex) de forma hierárquica e segura.

## 💡 A Solução
Desenvolvi uma aplicação web interna que substitui o papel e os e-mails avulsos. O sistema possui:
- **Frontend Responsivo:** Tela de login por níveis de acesso e formulário dinâmico para inserção de itens contábeis.
- **Fluxo de Aprovação em Cascata:** Roteamento automático de e-mails com links de aprovação em 1 clique (Diretor de Negócio ➔ Diretor Financeiro ➔ CEO).
- **Dashboard de Controladoria:** Um painel exclusivo para a equipe técnica revisar aprovações e registrar os dados no sistema ERP/EMS.
- **Geração Automática de PDF:** Integração com Google Docs para mesclar os dados aprovados em um template oficial e converter para PDF.
- **Disparo de E-mails Oficiais:** Envio do documento final em PDF com o layout da empresa para todos os envolvidos.

## 🛠️ Tecnologias Utilizadas
- **Frontend:** HTML5, CSS3, JavaScript Vanilla.
- **Backend:** Google Apps Script (JavaScript baseado em nuvem).
- **Banco de Dados:** Google Sheets (leitura e gravação via API nativa).
- **Motor de Template/PDF:** Google Docs API e Google Drive API.
- **Notificações:** Gmail API (envio de e-mails com HTML customizado).

## 🤖 Desenvolvimento Auxiliado por IA
Este projeto foi construído em um modelo de **co-criação com Inteligência Artificial (LLM)**. 

Atuei na idealização arquitetural, levantamento de requisitos de negócio, definição das regras de fluxo de caixa e testes. A IA atuou como parceira de codificação (*pair programming*), gerando os blocos de código a partir das minhas instruções detalhadas (Engenharia de Prompts), refatorações solicitadas e correções de bugs levantados durante a validação técnica.

Isso demonstra a capacidade de utilizar ferramentas modernas de IA para acelerar o ciclo de desenvolvimento (SDLC) e entregar soluções corporativas robustas de ponta a ponta.

## ⚙️ Como o Fluxo Funciona
1. **Solicitação:** O usuário loga e preenche os dados técnicos, financeiros e os itens da aquisição.
2. **Nível 1 (Gestor):** O Diretor da área recebe um e-mail com o resumo e os links de "Aprovar" ou "Rejeitar".
3. **Nível 2 (Financeiro):** Após o aval do negócio, o Financeiro recebe a solicitação.
4. **Nível 3 (CEO):** Aprovação executiva final.
5. **Nível 4 (Controladoria):** Recebe o resumo técnico para cadastrar no sistema ERP. Acessa o painel, insere o ID gerado e clica em "Finalizar".
6. **Desfecho:** O script mescla os dados num template do Google Docs, converte para PDF, salva no Drive (como backup de segurança contra estouro de cota) e envia por e-mail para todos os envolvidos.

## 📸 Imagens do Sistema
![Uploading image.png…]()

## 🚀 Como testar/implementar (Setup)
1. Crie uma Planilha no Google Sheets com as abas `Usuarios` e `Base_AI`.
2. Acesse `Extensões > Apps Script` e cole os arquivos `Code.gs` e `index.html`.
3. Crie um Documento no Google Docs com as variáveis `{{TAGS}}` para ser o modelo do PDF.
4. No arquivo `Code.gs`, substitua a variável `ID_MODELO_DOC` pelo ID do seu documento recém-criado.
5. Clique em `Implantar > Nova Implantação > App da Web` e configure o acesso.


