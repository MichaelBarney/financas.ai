<div align=center>

# Finanças.AI

Sistema de gestão financeira com processamento inteligente de extratos bancários

</div>

## 🚀 Funcionalidades

- **Dashboard Organizado**: Interface com sidebar e navegação estruturada
- **Gestão de Bancos**: Página dedicada para cadastro e gerenciamento de bancos
- **Gestão de Cartões**: Cadastro, edição e organização de cartões de crédito com portadores
- **Gestão de Pessoas**: Cadastro de portadores com tipos (Principal, Dependente, Externo)
- **Gestão de Extratos**: Upload, processamento e visualização de extratos bancários
- **Processamento Inteligente**: Análise de extratos no servidor com a Tela AI
- **Suporte a PDFs Criptografados**: Decriptação automática de PDFs protegidos por senha
- **Dashboard Financeiro**: Resumo com totais e estatísticas em cards informativos
- **Tabela de Transações**: Visualização completa de transações com filtros por mês/ano e tipo de pessoa
- **Navegação Intuitiva**: Sidebar com navegação clara entre seções
- **Transações Internacionais**: Marcação especial para compras no exterior
- **Armazenamento em Arquivos**: Dados organizados em sistema de arquivos do servidor

## 🛠️ Tecnologias

- **Nuxt 3**: Framework Vue.js
- **TypeScript**: Tipagem estática
- **Tela AI**: Processamento de documentos
- **node-qpdf2**: Decriptação de PDFs protegidos por senha
- **UnoCSS**: Utilitários CSS
- **VueUse**: Composables utilitários

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Executar em modo desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## 📁 Estrutura do Projeto

```
├── components/
│   ├── app/                    # Componentes de layout
│   │   ├── app-header.vue     # Cabeçalho da aplicação
│   │   └── sidebar.vue        # Barra lateral de navegação
│   ├── ExtractUpload.vue      # Upload de extratos
│   ├── TransactionTable.vue   # Tabela de transações com filtros
│   └── TransactionsList.vue   # Lista de transações
├── composables/
│   ├── useFinanceStore.ts     # Store de dados financeiros
│   └── useTelaAPI.ts         # Integração com Tela AI
├── layouts/
│   └── default.vue           # Layout padrão com sidebar
├── pages/                    # Páginas da aplicação
│   ├── index.vue             # Dashboard principal
│   ├── bancos.vue            # Gestão de bancos
│   ├── cartoes.vue           # Gestão de cartões
│   └── extratos.vue          # Gestão de extratos
├── server/api/               # APIs do servidor
│   ├── banks.get.ts          # Listar bancos
│   ├── banks.post.ts         # Criar banco
│   ├── banks/[id].delete.ts  # Remover banco
│   ├── people.get.ts         # Listar pessoas
│   ├── people.post.ts        # Criar pessoa
│   ├── people/[id].delete.ts # Remover pessoa
│   ├── cards.get.ts          # Listar cartões
│   ├── cards.post.ts         # Criar cartão
│   ├── cards/[id].put.ts     # Editar cartão
│   ├── cards/[id].delete.ts  # Remover cartão
│   ├── settings.get.ts       # Obter configurações
│   ├── settings.put.ts       # Atualizar configurações
│   ├── extracts.get.ts       # Listar extratos
│   ├── extracts.post.ts      # Salvar transações de um extrato
│   ├── extracts/[completionId].get.ts # Obter resultado do processamento
│   ├── process-pdf.post.ts  # Processar PDF e retornar completionId
│   └── migrate.post.ts       # Migração de dados
├── storage/                  # Armazenamento de dados
│   ├── banks.json            # Lista de bancos
│   ├── people.json           # Lista de pessoas/portadores
│   ├── cards.json            # Lista de cartões cadastrados
│   ├── settings.json         # Configurações da aplicação
│   ├── pdf/                  # Cópias dos extratos em PDF
│   ├── decryptedPDFs/        # PDFs decriptados (quando necessário)
│   └── extractions/          # Extratos completos
│       └── {bankId}/{filename}.json
└── types/
    └── index.ts              # Tipos TypeScript
```

## ⚙️ Configuração

### Variáveis de Ambiente

Antes de executar o projeto, configure as variáveis de ambiente:

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Configure as variáveis no arquivo `.env`:
```bash
# Tela API Configuration
TELA_API_KEY=your-tela-api-key-here

# GitHub Personal Access Token (for accessing Tela build extensions)
GITHUB_PAT=your-github-personal-access-token

# Environment
NODE_ENV=development
```

### Variáveis Obrigatórias:
- **TELA_API_KEY**: Chave da API do Tela para processamento de documentos
- **GITHUB_PAT**: Token de acesso pessoal do GitHub (para extensões Tela)

## 🏦 Como Usar

### Navegação
- **Dashboard**: Visão geral com estatísticas, ações rápidas e tabela completa de transações
- **Bancos**: Gerencie suas instituições bancárias
- **Extratos**: Faça upload e visualize extratos processados
- **Cartões**: Acompanhe seus cartões de crédito

### Fluxo de Uso
1. **Adicionar Banco**: Acesse a página "Bancos" e cadastre uma nova instituição
2. **Upload de Extrato**: Vá para "Extratos" e arraste um arquivo PDF ou clique para selecionar
3. **PDFs Criptografados**: Se o PDF estiver protegido por senha, o sistema solicitará a senha automaticamente
4. **Processamento**: A IA processará o extrato no servidor e salvará as transações
5. **Visualização**: Acesse "Cartões" para ver análises por cartão ou Dashboard para visão geral

## 🔐 Suporte a PDFs Criptografados

O sistema agora suporta automaticamente PDFs protegidos por senha:

- **Detecção Automática**: O servidor detecta se um PDF está criptografado
- **Solicitação de Senha**: Se necessário, o cliente é solicitado a inserir a senha
- **Decriptação Segura**: Usando `node-qpdf2` para decriptação com AES 256/128 e RC4
- **Armazenamento Seguro**: PDFs decriptados são salvos em `storage/decryptedPDFs/`
- **Processamento Continuado**: Após decriptação, o PDF é processado normalmente
- **Senhas Salvas**: Senhas são automaticamente salvas por banco para uso futuro
- **Seleção de Banco**: Interface permite selecionar banco para usar senha salva

### Como Funciona:

1. Usuário faz upload de um PDF
2. Servidor verifica se o PDF está criptografado
3. Se criptografado e sem senha: retorna `password_required`
4. Cliente exibe campo de senha com opção de selecionar banco
5. Usuário pode selecionar banco (auto-preenche senha) ou digitar manualmente
6. Servidor decripta o PDF e continua o processamento
7. Se processamento for bem-sucedido, senha é salva para o banco detectado

### Senhas Salvas:
- **Localização**: `storage/passwords.json`
- **Formato**: `{ "NomeDoBanco": "senha" }`
- **Auto-detecção**: Banco é detectado pela IA e senha é associada automaticamente

## 📊 Formato dos Dados

O sistema processa extratos e organiza as transações em:
- **Tipo**: ENTRADA ou SAIDA
- **Data**: Formato DD/MM/AA
- **Descrição**: Detalhes da transação (suporta formato texto ou objeto com nome/conta)
- **Valor**: Quantia em reais
- **Cartão**: Número do cartão (quando aplicável)
- **Final do Cartão**: Últimos 4 dígitos do cartão de crédito
- **Compra Internacional**: Indica se a transação foi feita no exterior
- **Formato**: Tipo de operação (débito, crédito, etc.)

### Formato da Descrição:
As descrições podem ser:
- **Texto simples**: `"Transferência PIX"`
- **Objeto estruturado**: `{ "nome": "EMPRESA LTDA", "conta": "Agência: 1234 Conta: 5678-9" }`

Quando em formato objeto, a interface exibe o nome da transação e a conta separadamente.

Os dados são automaticamente agrupados por:
- Ano e mês
- Banco
- Com cálculos de totais de entrada, saída e saldo

## 📊 Tabela de Transações

O dashboard principal agora inclui uma tabela completa de transações com recursos avançados de filtragem:

### 🆕 Melhorias Recentes:
- **Mês Padrão Inteligente**: A tabela agora inicializa automaticamente com o mês atual
- **Filtro "Outro"**: Novo filtro para visualizar transações sem cartão ou com cartões não salvos
- **Componentes TelaCheckbox**: Interface moderna usando componentes Tela para os filtros
- **Exibição Melhorada**: Transações "Outro" mostram claramente "Sem cartão" ou "Cartão não salvo"
- **💾 Memória de Preferências**: O sistema agora lembra automaticamente suas configurações de filtro e período selecionado

### Funcionalidades da Tabela:
- **Seleção de Período**: Filtros por mês e ano com dropdowns intuitivos
  - **Mês Padrão**: Inicializa automaticamente com o mês atual
  - **Ano Padrão**: Prioriza o ano atual quando disponível
- **Filtro por Tipo de Pessoa**: Checkboxes TelaCheckbox para filtrar transações por:
  - **Principal**: Titular principal do sistema
  - **Dependente**: Familiares e dependentes
  - **Externo**: Terceiros e outras pessoas
  - **Outro**: Transações sem cartão ou com cartões não salvos
- **Ordenação Cronológica**: Transações ordenadas do mais antigo (topo) para o mais recente (base)
- **Informações Completas**: Cada transação exibe:
  - Data formatada
  - Descrição da transação
  - Banco da transação
  - Cartão utilizado (quando aplicável)
  - Pessoa responsável
  - Tipo (Entrada/Saída)
  - Valor com formatação de moeda
- **Indicadores Visuais**: 
  - Badges coloridos para tipo de transação (verde=entrada, vermelho=saída)
  - Indicador de compra internacional
  - Formatação de cartão com últimos 4 dígitos
- **Resumo Financeiro**: Totais de entradas, saídas e saldo para o período selecionado
- **Estado Vazio**: Mensagem informativa quando não há transações para o período

### Como Usar:
1. **Selecionar Período**: Use os dropdowns de ano e mês para escolher o período desejado
   - A tabela inicia automaticamente no mês atual
2. **Filtrar por Pessoa**: Marque/desmarque os checkboxes TelaCheckbox para mostrar transações por tipo:
   - **Principal/Dependente/Externo**: Transações de pessoas cadastradas
   - **Outro**: Transações sem cartão ou com cartões não salvos
3. **Visualizar Dados**: A tabela se atualiza automaticamente com as transações filtradas
4. **Analisar Resumo**: Veja os totais e saldo no rodapé da tabela

### 💾 Memória de Preferências:
O sistema agora lembra automaticamente suas configurações:
- **Período Selecionado**: Ano e mês escolhidos são salvos e restaurados na próxima visita
- **Filtros Ativos**: Os tipos de pessoa selecionados são mantidos entre sessões
- **Persistência Local**: As configurações são salvas no navegador usando localStorage
- **Sincronização Automática**: Mudanças são salvas instantaneamente e aplicadas automaticamente

### Dados Exibidos:
- **Data**: Formato DD/MM/AAAA
- **Descrição**: Nome da transação + conta (quando disponível)
- **Banco**: Nome da instituição bancária
- **Cartão**: Últimos 4 dígitos com ícone de cartão
- **Pessoa**: Nome da pessoa responsável pela transação ou indicação especial:
  - **"Sem cartão"**: Transações que não possuem número de cartão
  - **"Cartão não salvo"**: Transações com cartão não cadastrado no sistema
- **Tipo**: Badge indicando entrada ou saída
- **Valor**: Quantia formatada em reais com sinal (+/-)

## 💳 Gestão de Cartões de Crédito

O sistema oferece recursos completos para gestão de cartões de crédito:

### Funcionalidades:
- **Cadastro de Cartões**: Adicione cartões manualmente com nome personalizado e portador
- **Edição de Cartões**: Altere nome e portador de cartões já cadastrados
- **Gestão de Portadores**: Cadastre pessoas que podem ser portadoras de cartões
- **Pessoa Principal**: Defina uma pessoa principal do sistema para cadastros rápidos
- **Conversão de Extratos**: Transforme cartões identificados nos extratos em cartões cadastrados com um clique
- **Identificação Automática**: Detecta automaticamente cartões de crédito nas transações dos extratos
- **Últimos 4 Dígitos**: Exibe os 4 últimos dígitos de cada cartão dos extratos
- **Agrupamento por Banco**: Cartões organizados por instituição bancária
- **Dashboard de Cartões**: Visão geral de todos os cartões (cadastrados + extratos)
- **Estatísticas por Cartão**: Total gasto, quantidade de transações
- **Estatísticas por Banco**: Totais consolidados por instituição
- **Compras Internacionais**: Destaque especial para transações no exterior
- **Ordenação Inteligente**: Bancos e cartões organizados do maior para o menor gasto

### Interface:
- **Três Seções Principais**:
  1. **Pessoas**: Gerenciamento de portadores com seleção de pessoa principal
  2. **Cartões Salvos**: Cartões cadastrados manualmente com opções de edição
  3. **Cartões dos Extratos**: Cartões identificados automaticamente nos extratos
- **Botões de Ação**: Adicionar pessoa, adicionar cartão, cadastrar cartão do extrato
- **Modais de Edição**: Formulários limpos para criação e edição
- **Indicadores Visuais**: 
  - ⭐ Pessoa principal marcada com estrela
  - 🟢 Botão "Cadastrar" em cada cartão do extrato
  - 📝 Botões de edição e exclusão
- **Cards Diferenciados**: Cores distintas para cartões salvos vs. cartões dos extratos
- **Layout Responsivo**: Grid adaptável para diferentes tamanhos de tela
- **Confirmações de Segurança**: Diálogos de confirmação para exclusões

### Dados Capturados:
- **finalCartao**: Últimos 4 dígitos do cartão
- **compraInternacional**: Flag para compras no exterior
- **formato**: Tipo de operação (débito/crédito)
- **Totalizações por Cartão**: Somatório de gastos individuais
- **Totalizações por Banco**: Consolidação de todos os cartões do banco
- **Contadores**: Número de transações por cartão e por banco

### Hierarquia de Exibição:
1. **Bancos ordenados por gasto total** (maior → menor)
2. **Cartões dentro de cada banco ordenados por gasto** (maior → menor)
3. **Estatísticas consolidadas** no cabeçalho de cada banco
4. **Separadores visuais** entre diferentes bancos

## 💾 Sistema de Armazenamento

O sistema utiliza armazenamento em arquivos organizados hierarquicamente:

### Bancos
- **Localização**: `storage/banks.json`
- **Formato**: Array JSON com informações dos bancos
- **Estrutura**: `{ id, name, createdAt }`
- **Auto-adição**: Bancos detectados pela IA são automaticamente adicionados se não existirem

### Extrações
- **Localização**: `storage/extractions/{bankId}/{filename}.json`
- **Organização**: Agrupadas por banco
- **Estrutura**: Cada arquivo contém um extrato completo com todas as transações
- **Exemplo**: `storage/extractions/bank-uuid/extract-2025-01-15T10-30-45.json`
- **Frontend**: A divisão por meses é feita dinamicamente no frontend

### Pessoas e Cartões
- **Pessoas**: `storage/people.json` - Lista de portadores de cartões
- **Cartões**: `storage/cards.json` - Cartões cadastrados manualmente
- **Configurações**: `storage/settings.json` - Pessoa principal e outras configurações
- **Estrutura Pessoa**: `{ id, name, type, createdAt }`
- **Tipos de Pessoa**: Principal (único), Dependente, Externo
- **Estrutura Cartão**: `{ id, name, holderId, createdAt, updatedAt }`
- **Validações**: 
  - Não permite excluir pessoa com cartões associados
  - Apenas uma pessoa pode ser do tipo "Principal"
  - Validação de tipos obrigatória

### Migração de Dados
- **Endpoint**: `POST /api/migrate`
- **Uso**: Para migrar dados do localStorage para o novo sistema
- **Formato**: Envie `{ banks: [], extracts: [] }` no body da requisição

## 👥 Gestão de Pessoas e Cartões

### Fluxo de Uso para Cartões:

1. **Cadastrar Pessoas**:
   - Acesse a página "Cartões"
   - Clique em "Adicionar Pessoa"
   - Digite o nome da pessoa
   - Selecione o tipo:
     - **Principal**: Titular principal (apenas um permitido)
     - **Dependente**: Cônjuge, filhos, etc.
     - **Externo**: Terceiros, amigos, etc.

2. **Cadastrar Cartões Manualmente**:
   - Clique em "Adicionar Cartão"
   - Digite o nome do cartão (ex: "Nubank Mastercard")
   - Selecione o portador do cartão
   - Confirme o cadastro

3. **Cadastrar Cartões dos Extratos**:
   - Processe extratos normalmente na página "Extratos"
   - Vá para a página "Cartões"
   - Na seção "Cartões dos Extratos", clique no botão "Cadastrar" do cartão desejado
   - Se houver pessoa do tipo "Principal" cadastrada, o cartão será associado automaticamente
   - Caso contrário, selecione o portador na modal que abrir

4. **Gerenciar Pessoas e Cartões**:
   - **Pessoas**: Use os ícones de edição (✏️) para alterar nome ou tipo
   - **Cartões**: Use os ícones de edição (✏️) para alterar nome ou portador
   - Use os ícones de exclusão (🗑️) para remover pessoas ou cartões
   - Confirmações são solicitadas para operações destrutivas

### Recursos Avançados:

#### **Sistema de Tipos de Pessoa:**
- **Principal**: Titular principal do sistema (apenas um permitido)
  - Usado automaticamente para conversão rápida de cartões dos extratos
  - Identificado visualmente com badge amarelo
- **Dependente**: Familiares, cônjuges, filhos
  - Badge azul para identificação visual
- **Externo**: Terceiros, amigos, outras pessoas
  - Badge cinza para identificação visual

#### **Funcionalidades:**
- **Validação de Unicidade**: Apenas uma pessoa pode ser "Principal"
- **Edição de Tipos**: Altere o tipo de qualquer pessoa a qualquer momento
- **Validações Inteligentes**: Não permite excluir pessoas que têm cartões associados
- **Conversão Rápida**: Cartões dos extratos são automaticamente associados à pessoa Principal
- **Auto-nomeação**: Cartões convertidos recebem nomes automáticos baseados no banco e últimos dígitos
- **Interface Visual**: Badges coloridos facilitam identificação dos tipos
- **Sincronização**: Todos os dados são mantidos sincronizados entre as diferentes seções
