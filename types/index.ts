export interface Bank {
    id: string
    name: string
    createdAt: Date
}

export interface Transaction {
    tipo: 'ENTRADA' | 'SAIDA'
    cartao?: string
    data: string
    descricao: string | { nome: string; conta: string }
    valor: number
}

export interface ExtractResult {
    banco: string
    descricao: string
    documento: string
    transacoes: Transaction[]
}

export interface SavedExtract {
    id: string
    bankId: string
    year: number
    month: number
    data: ExtractResult
    uploadedAt: Date
}
