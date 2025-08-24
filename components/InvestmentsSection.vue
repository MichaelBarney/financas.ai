<template>
  <div v-if="investmentTransactions.length > 0" class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-6">
    <div class="px-6 py-4 border-b border-green-200">
      <h2 class="text-xl font-semibold text-green-900 flex items-center gap-2">
        📈 Investimentos
      </h2>
    </div>
    
    <!-- Investment Summary -->
    <div class="px-6 py-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-white rounded-lg p-4 border border-green-200">
          <div class="text-sm font-medium text-blue-600">Aplicações</div>
          <div class="text-sm text-gray-500">Dinheiro que entrou nos investimentos</div>
          <div class="text-2xl font-bold text-blue-700">{{ formatCurrency(investmentExpenses) }}</div>
        </div>
        
        <div class="bg-white rounded-lg p-4 border border-green-200">
          <div class="text-sm font-medium text-red-600">Retiradas</div>
          <div class="text-sm text-gray-500">Dinheiro que saiu dos investimentos</div>
          <div class="text-2xl font-bold text-red-700">{{ formatCurrency(investmentIncome) }}</div>
        </div>
        
        <div class="bg-white rounded-lg p-4 border border-green-200">
          <div class="text-sm font-medium text-gray-600">Investimento Líquido</div>
          <div class="text-sm text-gray-500">Aplicações - Retiradas</div>
          <div class="text-2xl font-bold" :class="investmentBalance >= 0 ? 'text-blue-600' : 'text-red-600'">
            {{ formatCurrency(investmentBalance) }}
          </div>
        </div>
      </div>
      
      <!-- Investment Transactions Table -->
      <div class="overflow-x-auto min-w-full">
        <table class="w-full" style="min-width: 800px;">
          <thead class="bg-green-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Data</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Descrição</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Tipo</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-green-700 uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-green-100">
            <tr 
              v-for="(investment, index) in investmentTransactions" 
              :key="investment.isConsolidated ? `consolidated-inv-${investment.ruleId}` : `inv-${investment.extractId}-${investment.originalIndex}`"
              :class="[
                'hover:bg-green-50 transition-colors cursor-pointer',
                investment.isConsolidated ? 'bg-gradient-to-r from-green-100 to-emerald-100' : '',
                investment.isPartOfConsolidated ? 'bg-gradient-to-r from-green-50 to-emerald-50 pl-4' : ''
              ]"
              @click="handleTransactionClick(investment)"
            >
              <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(investment.data, investment.extractId) }}
              </td>
              <td class="px-4 py-2 text-sm">
                <div>
                  <p class="font-medium text-green-800">
                    <span v-if="investment.isPartOfConsolidated" class="text-green-400 mr-2">└─</span>
                    {{ investment.significado || getTransactionDescription(investment) }}
                    <span v-if="investment.isConsolidated">
                      {{ expandedConsolidated.has(investment.ruleId || '') ? '📂' : '📦' }}
                    </span>
                  </p>
                  <p v-if="investment.isConsolidated" class="text-xs text-green-600 font-medium">
                    {{ investment.consolidatedCount }} transações - 
                    <span class="text-green-500">
                      {{ expandedConsolidated.has(investment.ruleId || '') ? 'Clique para recolher' : 'Clique para expandir' }}
                    </span>
                  </p>
                </div>
              </td>
              <td class="px-4 py-2 whitespace-nowrap text-sm">
                <span 
                  :class="[
                    'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                    investment.tipo === 'ENTRADA' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  ]"
                >
                  {{ investment.tipo === 'ENTRADA' ? 'Retirada' : 'Aplicação' }}
                </span>
              </td>
              <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-right">
                <span :class="investment.tipo === 'ENTRADA' ? 'text-red-600' : 'text-blue-600'">
                  {{ investment.tipo === 'ENTRADA' ? '-' : '+' }}{{ formatCurrency(investment.valor) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TransactionWithMetadata {
  tipo: 'ENTRADA' | 'SAIDA'
  data: string
  valor: number
  significado?: string
  bankId: string
  extractId: string
  banco: string
  originalIndex: number
  isConsolidated?: boolean
  consolidatedCount?: number
  isPartOfConsolidated?: boolean
  ruleId?: string
  descricao: string | { nome: string; conta: string }
}

interface Props {
  investmentTransactions: TransactionWithMetadata[]
  investmentIncome: number
  investmentExpenses: number
  investmentBalance: number
  expandedConsolidated: Set<string>
}

defineProps<Props>()

const emit = defineEmits<{
  transactionClick: [transaction: TransactionWithMetadata]
}>()

function handleTransactionClick(transaction: TransactionWithMetadata) {
  emit('transactionClick', transaction)
}

function formatDate(date: string, extractId?: string): string {
  const [day, month, year] = date.split('/')
  if (!day || !month || !year) return date
  
  let yearNum: number
  if (year === 'xx') {
    // For this component, we'll need access to extracts or handle it differently
    return `${day}/${month}/20xx`
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
  if (transaction.significado) {
    return transaction.significado
  }
  
  if (typeof transaction.descricao === 'string') {
    return transaction.descricao
  }
  return transaction.descricao.nome
}
</script>