<template>
  <div class="bg-white border border-gray-200 rounded-lg">
    <!-- Header with filters -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-xl font-semibold text-gray-900">Transações</h2>
        
        <!-- Month/Year Selector -->
        <div class="flex items-center gap-3">
          <select 
            v-model="selectedYear" 
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
          
          <select 
            v-model="selectedMonth" 
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- People Type Filter -->
      <div class="mt-4 flex flex-wrap gap-3">
        <label class="flex items-center gap-2">
          <input 
            type="checkbox" 
            v-model="selectedPeopleTypes" 
            value="Principal"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700">Principal</span>
        </label>
        
        <label class="flex items-center gap-2">
          <input 
            type="checkbox" 
            v-model="selectedPeopleTypes" 
            value="Dependente"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700">Dependente</span>
        </label>
        
        <label class="text-sm text-gray-700">
          <input 
            type="checkbox" 
            v-model="selectedPeopleTypes" 
            value="Externo"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700">Externo</span>
        </label>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descrição
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Banco
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cartão
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pessoa
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="transaction in filteredTransactions" 
            :key="`${transaction.extractId}-${transaction.data}-${transaction.descricao}`"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(transaction.data) }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
              <div>
                <p class="font-medium">{{ getTransactionDescription(transaction.descricao) }}</p>
                <p v-if="getTransactionAccount(transaction.descricao)" class="text-xs text-gray-500">
                  {{ getTransactionAccount(transaction.descricao) }}
                </p>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ transaction.banco }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div v-if="transaction.finalCartao && transaction.finalCartao !== 'N/A'" class="flex items-center gap-2">
                <Icon name="heroicons:credit-card" class="w-4 h-4 text-gray-400" />
                <span class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  **** {{ transaction.finalCartao }}
                </span>
              </div>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ getPersonName(transaction.finalCartao) || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div class="flex items-center gap-2">
                <span 
                  :class="[
                    'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                    transaction.tipo === 'ENTRADA' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ transaction.tipo === 'ENTRADA' ? 'Entrada' : 'Saída' }}
                </span>
                <span 
                  v-if="transaction.compraInternacional"
                  class="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full"
                >
                  <Icon name="heroicons:globe-alt" class="w-3 h-3 mr-1" />
                  Int
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <span 
                :class="[
                  'font-semibold',
                  transaction.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                ]"
              >
                {{ transaction.tipo === 'ENTRADA' ? '+' : '-' }}{{ formatCurrency(transaction.valor) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Empty state -->
      <div v-if="filteredTransactions.length === 0" class="px-6 py-12 text-center">
        <Icon name="heroicons:document-text" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
        <p class="text-gray-500">
          Não há transações para {{ months.find(m => m.value === selectedMonth)?.label }} de {{ selectedYear }}
        </p>
      </div>
    </div>
    
    <!-- Summary -->
    <div v-if="filteredTransactions.length > 0" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
        <div class="flex gap-6">
          <span class="text-gray-600">
            Total de transações: <span class="font-medium text-gray-900">{{ filteredTransactions.length }}</span>
          </span>
          <span class="text-green-600">
            Entradas: <span class="font-medium">{{ formatCurrency(totalIncome) }}</span>
          </span>
          <span class="text-red-600">
            Saídas: <span class="font-medium">{{ formatCurrency(totalExpenses) }}</span>
          </span>
        </div>
        <div class="text-lg font-semibold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
          Saldo: {{ formatCurrency(balance) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transaction, Person, Card } from '~/types'

interface TransactionWithMetadata extends Transaction {
  bankId: string
  extractId: string
  banco: string
}

const { extracts, people, cards } = useFinanceStore()

// Month/Year selection
const currentDate = new Date()
const selectedYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth() + 1)

// People type filtering
const selectedPeopleTypes = ref<string[]>(['Principal', 'Dependente', 'Externo'])

// Available months and years
const availableMonths = computed(() => {
  return extracts.value.reduce((months, extract) => {
    extract.data.transacoes.forEach(transaction => {
      const [day, month, year] = transaction.data.split('/')
      const yearNum = year.length === 2 ? Number.parseInt(`20${year}`) : Number.parseInt(year)
      const monthNum = Number.parseInt(month)
      months.add(`${yearNum}-${monthNum}`)
    })
    return months
  }, new Set<string>())
})

const availableYears = computed(() => {
  const years = new Set<number>()
  availableMonths.value.forEach(monthKey => {
    const [year] = monthKey.split('-')
    years.add(Number.parseInt(year))
  })
  return Array.from(years).sort((a, b) => b - a)
})

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
]

// Filtered transactions
const filteredTransactions = computed(() => {
  const transactions: TransactionWithMetadata[] = []
  
  extracts.value.forEach(extract => {
    extract.data.transacoes.forEach(transaction => {
      const [day, month, year] = transaction.data.split('/')
      const yearNum = year.length === 2 ? Number.parseInt(`20${year}`) : Number.parseInt(year)
      const monthNum = Number.parseInt(month)
      
      if (yearNum === selectedYear.value && monthNum === selectedMonth.value) {
        // Check if transaction should be shown based on people type filter
        const person = getPersonByCard(transaction.finalCartao)
        if (person && selectedPeopleTypes.value.includes(person.type)) {
          transactions.push({
            ...transaction,
            bankId: extract.bankId,
            extractId: extract.id,
            banco: extract.data.banco
          })
        }
      }
    })
  })
  
  // Sort from oldest to newest
  return transactions.sort((a, b) => {
    const [dayA, monthA, yearA] = a.data.split('/')
    const [dayB, monthB, yearB] = b.data.split('/')
    const dateA = new Date(Number.parseInt(yearA), Number.parseInt(monthA) - 1, Number.parseInt(dayA))
    const dateB = new Date(Number.parseInt(yearB), Number.parseInt(monthB) - 1, Number.parseInt(dayB))
    return dateA.getTime() - dateB.getTime()
  })
})

// Computed totals
const totalIncome = computed(() => {
  return filteredTransactions.value
    .filter(t => t.tipo === 'ENTRADA')
    .reduce((sum, t) => sum + t.valor, 0)
})

const totalExpenses = computed(() => {
  return filteredTransactions.value
    .filter(t => t.tipo === 'SAIDA')
    .reduce((sum, t) => sum + t.valor, 0)
})

const balance = computed(() => totalIncome.value - totalExpenses.value)

// Helper functions
function getTransactionDescription(descricao: string | { nome: string; conta: string }): string {
  if (typeof descricao === 'string') {
    return descricao
  }
  return descricao.nome
}

function getTransactionAccount(descricao: string | { nome: string; conta: string }): string | null {
  if (typeof descricao === 'object' && descricao.conta) {
    return descricao.conta
  }
  return null
}

function getPersonByCard(finalCartao?: string): Person | null {
  if (!finalCartao || finalCartao === 'N/A') return null
  
  const card = cards.value.find(c => c.finalCartao === finalCartao)
  if (card) {
    return people.value.find(p => p.id === card.holderId) || null
  }
  return null
}

function getPersonName(finalCartao?: string): string | null {
  const person = getPersonByCard(finalCartao)
  return person ? person.name : null
}

function formatDate(date: string): string {
  const [day, month, year] = date.split('/')
  const yearNum = year.length === 2 ? Number.parseInt(`20${year}`) : Number.parseInt(year)
  const monthNum = Number.parseInt(month)
  const dayNum = Number.parseInt(day)
  
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

// Watch for changes and update available months
watch([selectedYear, selectedMonth], () => {
  // Ensure selected month is available for selected year
  const availableMonthsForYear = Array.from(availableMonths.value)
    .filter(monthKey => monthKey.startsWith(selectedYear.value.toString()))
    .map(monthKey => Number.parseInt(monthKey.split('-')[1]))
  
  if (!availableMonthsForYear.includes(selectedMonth.value)) {
    selectedMonth.value = availableMonthsForYear[0] || 1
  }
})

// Initialize with first available month/year
onMounted(() => {
  if (availableYears.value.length > 0) {
    selectedYear.value = availableYears.value[0]
    const availableMonthsForYear = Array.from(availableMonths.value)
      .filter(monthKey => monthKey.startsWith(selectedYear.value.toString()))
      .map(monthKey => Number.parseInt(monthKey.split('-')[1]))
    if (availableMonthsForYear.length > 0) {
      selectedMonth.value = availableMonthsForYear[0]
    }
  }
})
</script>
