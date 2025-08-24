export interface Bank {
    id: string
    name: string
    createdAt: Date
}

export interface Classification {
    id: string
    text: string
    emoji: string
    createdAt: Date
}

export interface Rule {
    id: string
    includes: string
    classificationId?: string
    significado?: string
    consolidar?: boolean
    createdAt: Date
}

export interface Transaction {
    tipo: 'ENTRADA' | 'SAIDA'
    cartao?: string
    finalCartao?: string
    data: string
    descricao: string | { nome: string; conta: string }
    valor: number
    formato?: string
    compraInternacional?: boolean
    significado?: string
    classificationId?: string
    skipped?: boolean
    skipReason?: string
    appliedFromRule?: boolean
    ruleId?: string
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
    data: ExtractResult
    uploadedAt: Date
}

export interface Person {
    id: string
    name: string
    type: 'Principal' | 'Dependente' | 'Externo'
    createdAt: Date
}

export interface Card {
    id: string
    name: string
    holderId: string
    bankId: string
    finalCartao: string
    createdAt: Date
    updatedAt: Date
}
