import type { Transaction } from '~/types'

interface TransactionWithMetadata extends Transaction {
  bankId: string
  extractId: string
  banco: string
  originalIndex: number
  isConsolidated?: boolean
  consolidatedCount?: number
  isPartOfConsolidated?: boolean
  consolidatedRuleId?: string
}

export function useTransactionHelpers() {
  function formatDate(date: string, extractId?: string): string {
    const [day, month, year] = date.split('/')
    if (!day || !month || !year) return date
    
    let yearNum: number
    if (year === 'xx') {
      // Use the year from the extraction upload date if available
      if (extractId) {
        const { extracts } = useFinanceStore()
        const extract = extracts.value.find(e => e.id === extractId)
        if (extract) {
          yearNum = new Date(extract.uploadedAt).getFullYear()
        } else {
          return `${day}/${month}/20xx`
        }
      } else {
        return `${day}/${month}/20xx`
      }
    } else if (year.length === 2) {
      yearNum = Number.parseInt(`20${year}`)
    } else {
      yearNum = Number.parseInt(year)
    }
    
    if (isNaN(yearNum)) return date
    
    const monthNum = Number.parseInt(month)
    const dayNum = Number.parseInt(day)
    
    if (isNaN(monthNum) || isNaN(dayNum)) return date
    
    return new Date(yearNum, monthNum - 1, dayNum).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  function getTransactionDescription(transaction: TransactionWithMetadata): string {
    // Priority: significado > descricao
    if (transaction.significado) {
      return transaction.significado
    }
    
    if (typeof transaction.descricao === 'string') {
      return transaction.descricao
    }
    return transaction.descricao.nome
  }

  function getTransactionAccount(descricao: string | { nome: string; conta: string }): string | null {
    if (typeof descricao === 'object' && descricao.conta) {
      return descricao.conta
    }
    return null
  }

  function getTransactionRowClasses(transaction: TransactionWithMetadata): string {
    if (transaction.isConsolidated) {
      // Consolidated transactions get purple gradient
      return 'bg-gradient-to-r from-purple-200 to-purple-300 hover:from-purple-300 hover:to-purple-400'
    }
    
    if (transaction.isPartOfConsolidated) {
      // Individual transactions part of a consolidated group get lighter purple
      return 'bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150'
    }
    
    if (transaction.skipped) {
      // Skipped transactions get grey gradient
      return 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300'
    }
    
    if (transaction.classificationId) {
      // Fully analyzed transaction (has classification, may or may not have significado)
      if (transaction.tipo === 'SAIDA') {
        // Saída (outgoing) transactions get purple/red gradient
        return 'bg-gradient-to-r from-purple-50 to-red-50 hover:from-purple-100 hover:to-red-100'
      } else {
        // Entrada (incoming) transactions get green/blue gradient
        return 'bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100'
      }
    }
    return ''
  }

  function getClassificationText(classificationId: string): string {
    const { classifications } = useFinanceStore()
    const classification = classifications.value.find(c => c.id === classificationId)
    return classification ? `${classification.emoji} ${classification.text}` : 'N/A'
  }

  return {
    formatDate,
    formatCurrency,
    getTransactionDescription,
    getTransactionAccount,
    getTransactionRowClasses,
    getClassificationText
  }
}

export type { TransactionWithMetadata }