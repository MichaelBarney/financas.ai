<div align=center>

# Finanças.AI

Sistema de gestão financeira com processamento inteligente de extratos bancários

</div>

## 🚀 Funcionalidades

- **Cadastro de Bancos**: Gerencie múltiplos bancos
- **Upload de Extratos**: Drag-and-drop de arquivos PDF
- **Processamento Inteligente**: Análise de extratos no servidor com a Tela AI
- **Suporte a PDFs Criptografados**: Decriptação automática de PDFs protegidos por senha
- **Visualização por Período**: Organização de transações por mês e ano
- **Dashboard Financeiro**: Resumo com totais e estatísticas
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
│   ├── ExtractUpload.vue      # Upload de extratos
│   └── TransactionsList.vue   # Lista de transações
├── composables/
│   ├── useFinanceStore.ts     # Store de dados financeiros
│   └── useTelaAPI.ts         # Integração com Tela AI
├── server/api/                # APIs do servidor
│   ├── banks.get.ts          # Listar bancos
│   ├── banks.post.ts         # Criar banco
│   ├── banks/[id].delete.ts  # Remover banco
│   ├── extracts.get.ts       # Listar extratos
│   ├── extracts.post.ts      # Salvar transações de um extrato
│   ├── extracts/[completionId].get.ts # Obter resultado do processamento
│   ├── process-pdf.post.ts  # Processar PDF e retornar completionId
│   └── migrate.post.ts       # Migração de dados
├── storage/                   # Armazenamento de dados
│   ├── banks.json            # Lista de bancos
│   ├── pdf/                  # Cópias dos extratos em PDF
│   ├── decryptedPDFs/        # PDFs decriptados (quando necessário)
│   ├── temp/                 # Arquivos PDF temporários
│   └── transactions/         # Transações organizadas
│       └── {year}/{month}/{bankId}/{filename}.json
├── pages/
│   └── index.vue             # Dashboard principal
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

1. **Adicionar Banco**: Clique em "Adicionar Extrato" no header e cadastre um novo banco
2. **Upload de Extrato**: Arraste um arquivo PDF ou clique para selecionar
3. **PDFs Criptografados**: Se o PDF estiver protegido por senha, o sistema solicitará a senha automaticamente
4. **Processamento**: A IA processará o extrato no servidor e salvará as transações
5. **Visualização**: Os dados aparecerão organizados por mês na tela principal

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

### Formato da Descrição:
As descrições podem ser:
- **Texto simples**: `"Transferência PIX"`
- **Objeto estruturado**: `{ "nome": "EMPRESA LTDA", "conta": "Agência: 1234 Conta: 5678-9" }`

Quando em formato objeto, a interface exibe o nome da transação e a conta separadamente.

Os dados são automaticamente agrupados por:
- Ano e mês
- Banco
- Com cálculos de totais de entrada, saída e saldo

## 💾 Sistema de Armazenamento

O sistema utiliza armazenamento em arquivos organizados hierarquicamente:

### Bancos
- **Localização**: `storage/banks.json`
- **Formato**: Array JSON com informações dos bancos
- **Estrutura**: `{ id, name, createdAt }`
- **Auto-adição**: Bancos detectados pela IA são automaticamente adicionados se não existirem

### Transações
- **Localização**: `storage/transactions/{year}/{month}/{bankId}/{filename}.json`
- **Organização**: Separadas por ano, mês e banco
- **Divisão**: Extratos com transações de múltiplos meses são automaticamente divididos
- **Exemplo**: `storage/transactions/2025/7/bank-uuid/extract-2025-01-15.json`

### Migração de Dados
- **Endpoint**: `POST /api/migrate`
- **Uso**: Para migrar dados do localStorage para o novo sistema
- **Formato**: Envie `{ banks: [], extracts: [] }` no body da requisição
