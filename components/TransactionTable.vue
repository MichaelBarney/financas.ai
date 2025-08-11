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
          <TelaCheckbox 
            :model-value="showSkippedTransactions"
            @update:model-value="(checked) => showSkippedTransactions = checked"
            size="md"
          />
          <span class="text-sm text-gray-700">Mostrar transações ignoradas</span>
        </label>
        
        <div class="w-px h-6 bg-gray-300"></div>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Principal')"
            @update:model-value="(checked) => togglePeopleType('Principal', checked)"
            size="md"
          />
          <span class="text-sm text-gray-700">Principal</span>
        </label>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Dependente')"
            @update:model-value="(checked) => togglePeopleType('Dependente', checked)"
            size="md"
          />
          <span class="text-sm text-gray-700">Dependente</span>
        </label>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Externo')"
            @update:model-value="(checked) => togglePeopleType('Externo', checked)"
            size="md"
          />
          <span class="text-sm text-gray-700">Externo</span>
        </label>

        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Outro')"
            @update:model-value="(checked) => togglePeopleType('Outro', checked)"
            size="md"
          />
          <span class="text-sm text-gray-700">Outro</span>
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
              Tipo
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pessoa
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Operação
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Classificação
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="transaction in filteredTransactions" 
            :key="`${transaction.extractId}-${transaction.originalIndex}`"
            :class="[
              'hover:bg-gray-50 cursor-pointer transition-colors',
              getTransactionRowClasses(transaction)
            ]"
            @click="openSignificadoModal(transaction)"
          >
          <!-- Data -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(transaction.data) }}
            </td>
            <!-- Descrição -->
            <td class="px-6 py-4 text-sm text-gray-900">
              <div>
                <p v-if="transaction.significado" class="text-purple-600 font-medium">
                   {{ transaction.significado }} ✨
                </p>
                <p v-else class="font-medium">{{ getTransactionDescription(transaction) }}</p>
                <p v-if="getTransactionAccount(transaction.descricao) && getTransactionAccount(transaction.descricao) !== 'N/A'" class="text-xs text-gray-500">
                  {{ getTransactionAccount(transaction.descricao) }}
                </p>

              </div>
            </td>
            <!-- Banco -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ transaction.banco }}
            </td>
            <!-- Tipo -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div v-if="transaction.formato === 'CREDITO' || transaction.formato === 'DEBITO'">
                <div v-if="transaction.finalCartao && transaction.finalCartao !== 'N/A'" class="flex items-center gap-2">
                  <Icon name="heroicons:credit-card" class="w-4 h-4 text-gray-400" />
                  <span class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    **** {{ transaction.finalCartao }}
                  </span>
                </div>
                <span v-else class="text-gray-400">-</span>
              </div>
              <div v-else-if="transaction.formato === 'PIX'" class="flex items-center gap-2">
                <Icon name="heroicons:device-phone-mobile" class="w-4 h-4 text-green-500" />
                <span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  PIX
                </span>
              </div>
              <div v-else-if="transaction.formato === 'TRANSFERENCIA_TRADICIONAL'" class="flex items-center gap-2">
                <Icon name="heroicons:arrow-path" class="w-4 h-4 text-purple-500" />
                <span class="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  Transferência
                </span>
              </div>
              <div v-else class="text-gray-400">-</div>
            </td>
            <!-- Pessoa -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span v-if="getPersonName(transaction.finalCartao)" class="text-gray-900">
                {{ getPersonName(transaction.finalCartao) }}
              </span>
              <span v-else-if="!transaction.finalCartao || transaction.finalCartao === 'N/A'" class="text-gray-500 italic">
                Sem cartão
              </span>
              <span v-else class="text-gray-500 italic">
                Cartão não salvo
              </span>
            </td>
            <!-- Operação -->
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
            <!-- Classificação -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div v-if="transaction.skipped" class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  ⏭️ Ignorada
                </span>
                <button
                  @click.stop="showSkipReason(transaction)"
                  class="text-xs text-gray-500 hover:text-gray-700 underline"
                  title="Ver motivo"
                >
                  Ver motivo
                </button>
              </div>
              <div v-else-if="transaction.classificationId" class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {{ getClassificationEmoji(transaction.classificationId) }} {{ getClassificationText(transaction.classificationId) }}
                </span>
              </div>
              <div v-else class="flex items-center gap-2">
                <span class="text-gray-400 text-xs italic">
                  Não classificada
                </span>
              </div>
            </td>
            <!-- Valor -->
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
          <span v-if="filteredTransactions.some(t => t.skipped)" class="text-gray-500">
            Ignoradas: <span class="font-medium">{{ filteredTransactions.filter(t => t.skipped).length }}</span>
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

    <!-- Significado Modal -->
    <div v-if="showSignificadoModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingTransaction?.classificationId ? 'Editar Transação' : 'Analisar Transação' }}
          </h3>
          <button
            @click="closeSignificadoModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        
        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-2">Transação:</p>
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="font-medium text-gray-900">{{ editingTransaction ? getTransactionDescription(editingTransaction) : '' }}</p>
            <p class="text-sm text-gray-600">{{ editingTransaction ? `${formatDate(editingTransaction.data)} - ${formatCurrency(editingTransaction.valor)}` : '' }}</p>
          </div>
        </div>

        <form @submit.prevent="saveSignificado" class="space-y-4">
          <div>
            <label for="significado" class="block text-sm font-medium text-gray-700 mb-2">
              Significado (Nome personalizado) - Opcional
            </label>
            <input
              id="significado"
              v-model="newSignificado"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Deixe em branco para usar a descrição original"
            />
            <p class="text-xs text-gray-500 mt-1">
              Se preenchido, este nome substituirá a descrição original da transação
            </p>
          </div>

          <div>
            <label for="classification" class="block text-sm font-medium text-gray-700 mb-2">
              Classificação <span class="text-red-500">*</span>
            </label>
            <div class="space-y-3">
              <!-- Existing classifications -->
              <div v-if="classifications.length > 0" class="grid grid-cols-2 gap-2">
                <button
                  v-for="classification in classifications"
                  :key="classification.id"
                  type="button"
                  @click="selectClassification(classification.id)"
                  :class="[
                    'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
                    selectedClassificationId === classification.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  ]"
                >
                  <span class="text-lg">{{ classification.emoji }}</span>
                  <span>{{ classification.text }}</span>
                </button>
                
                <!-- Ignorar option - bottom left -->
                <button
                  type="button"
                  @click="selectClassification('IGNORE')"
                  :class="[
                    'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
                    selectedClassificationId === 'IGNORE'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  ]"
                >
                  <span class="text-lg">⏭️</span>
                  <span>Ignorar</span>
                </button>
                
                <!-- Nova option - bottom right -->
                <button
                  type="button"
                  @click="selectClassification('NEW')"
                  :class="[
                    'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
                    selectedClassificationId === 'NEW'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  ]"
                >
                  <span class="text-lg">➕</span>
                  <span>Nova</span>
                </button>
              </div>
              
              <!-- Create new classification - only show when "Nova" is selected -->
              <div v-if="selectedClassificationId === 'NEW'" class="border-t pt-3">
                <p class="text-xs text-gray-600 mb-2">Criar nova classificação:</p>
                <div class="flex gap-2">
                  <input
                    v-model="newClassificationText"
                    type="text"
                    placeholder="Nome da classificação"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    v-model="newClassificationEmoji"
                    type="text"
                    placeholder="😊"
                    maxlength="2"
                    class="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    @click="createNewClassification"
                    :disabled="!newClassificationText || !newClassificationEmoji"
                    class="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Criar
                  </button>
                </div>
              </div>
              
              <!-- Skip reason input - only show when "Ignorar" is selected -->
              <div v-if="selectedClassificationId === 'IGNORE'" class="border-t pt-3">
                <div>
                  <label for="modalSkipReason" class="block text-sm font-medium text-gray-700 mb-2">
                    Motivo para ignorar <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    id="modalSkipReason"
                    v-model="skipReason"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Por exemplo: Transação duplicada, valor incorreto, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Remove the old skip transaction section since it's now integrated above -->

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="closeSignificadoModal"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !isValidSelection"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Transaction, Person, Card } from '~/types'
import { nextTick } from 'vue'

interface TransactionWithMetadata extends Transaction {
  bankId: string
  extractId: string
  banco: string
  originalIndex: number
}

const { extracts, people, cards, classifications, updateTransactionSignificado, updateTransactionClassification, addClassification } = useFinanceStore()

// Month/Year selection
const currentDate = new Date()
const selectedYear = ref(currentDate.getFullYear())
const selectedMonth = ref(currentDate.getMonth() + 1) // Default to current month

// People type filtering
const selectedPeopleTypes = ref<string[]>(['Principal', 'Dependente', 'Externo', 'Outro'])

// Skip transactions filter
const showSkippedTransactions = ref(true)

// Significado modal state
const showSignificadoModal = ref(false)
const editingTransaction = ref<TransactionWithMetadata | null>(null)
const newSignificado = ref('')
const selectedClassificationId = ref<string>('')
const newClassificationText = ref('')
const newClassificationEmoji = ref('')
const isSubmitting = ref(false)

// Skip transaction state
const skipReason = ref('')

// Storage keys for remembering user preferences
const STORAGE_KEYS = {
  SELECTED_YEAR: 'financas-ai-selected-year',
  SELECTED_MONTH: 'financas-ai-selected-month',
  SELECTED_PEOPLE_TYPES: 'financas-ai-selected-people-types',
  SHOW_SKIPPED_TRANSACTIONS: 'financas-ai-show-skipped-transactions'
}

// Functions to save and load user preferences
function saveUserPreferences() {
  if (process.client) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_YEAR, selectedYear.value.toString())
    localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, selectedMonth.value.toString())
    localStorage.setItem(STORAGE_KEYS.SELECTED_PEOPLE_TYPES, JSON.stringify(selectedPeopleTypes.value))
    localStorage.setItem(STORAGE_KEYS.SHOW_SKIPPED_TRANSACTIONS, showSkippedTransactions.value.toString())
  }
}

function loadUserPreferences() {
  if (process.client) {
    // Load year preference
    const savedYear = localStorage.getItem(STORAGE_KEYS.SELECTED_YEAR)
    if (savedYear) {
      const yearNum = Number.parseInt(savedYear)
      if (yearNum && availableYears.value.includes(yearNum)) {
        selectedYear.value = yearNum
      }
    }
    
    // Load month preference
    const savedMonth = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH)
    if (savedMonth) {
      const monthNum = Number.parseInt(savedMonth)
      if (monthNum && monthNum >= 1 && monthNum <= 12) {
        // Check if month is available for selected year
        const availableMonthsForYear = Array.from(availableMonths.value)
          .filter(monthKey => {
            const year = monthKey.split('-')[0]
            return year && monthKey.startsWith(year)
          })
          .map(monthKey => {
            const month = monthKey.split('-')[1]
            return month ? Number.parseInt(month) : 0
          })
          .filter(month => !isNaN(month))
        
        if (availableMonthsForYear.includes(monthNum)) {
          selectedMonth.value = monthNum
        }
      }
    }
    
    // Load people types preference
    const savedPeopleTypes = localStorage.getItem(STORAGE_KEYS.SELECTED_PEOPLE_TYPES)
    if (savedPeopleTypes) {
      try {
        const parsedTypes = JSON.parse(savedPeopleTypes)
        if (Array.isArray(parsedTypes) && parsedTypes.length > 0) {
          // Validate that all saved types are valid
          const validTypes = ['Principal', 'Dependente', 'Externo', 'Outro']
          const filteredTypes = parsedTypes.filter(type => validTypes.includes(type))
          if (filteredTypes.length > 0) {
            selectedPeopleTypes.value = filteredTypes
          }
        }
      } catch (e) {
        console.warn('Failed to parse saved people types:', e)
      }
    }

    // Load show skipped transactions preference
    const savedShowSkipped = localStorage.getItem(STORAGE_KEYS.SHOW_SKIPPED_TRANSACTIONS)
    if (savedShowSkipped) {
      showSkippedTransactions.value = JSON.parse(savedShowSkipped)
    }
  }
}

// Available months and years
const availableMonths = computed(() => {
  return extracts.value.reduce((months, extract) => {
    extract.data.transacoes.forEach(transaction => {
      const [day, month, year] = transaction.data.split('/')
      if (!day || !month || !year) return
      
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
    if (year) {
      const yearNum = Number.parseInt(year)
      if (!isNaN(yearNum)) {
        years.add(yearNum)
      }
    }
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
    extract.data.transacoes.forEach((transaction, index) => {
      const [day, month, year] = transaction.data.split('/')
      if (!day || !month || !year) return
      
      const yearNum = year.length === 2 ? Number.parseInt(`20${year}`) : Number.parseInt(year)
      const monthNum = Number.parseInt(month)
      
      if (yearNum === selectedYear.value && monthNum === selectedMonth.value) {
        // Check if transaction should be shown based on people type filter
        const person = getPersonByCard(transaction.finalCartao)
        let shouldInclude = false
        
        if (person && selectedPeopleTypes.value.includes(person.type)) {
          shouldInclude = true
        } else if (selectedPeopleTypes.value.includes('Outro')) {
          // Include transactions without cards or with unsaved cards
          if (!transaction.finalCartao || 
              transaction.finalCartao === 'N/A' || 
              !person) {
            shouldInclude = true
          }
        }
        
        if (shouldInclude) {
          transactions.push({
            ...transaction,
            bankId: extract.bankId,
            extractId: extract.id,
            banco: extract.data.banco,
            originalIndex: index
          })
        }
      }
    })
  })
  
  // Filter out skipped transactions if the filter is disabled
  let filteredTransactions = transactions
  if (!showSkippedTransactions.value) {
    filteredTransactions = transactions.filter(t => !t.skipped)
  }
  
  // Sort from oldest to newest
  return filteredTransactions.sort((a, b) => {
    const [dayA, monthA, yearA] = a.data.split('/')
    const [dayB, monthB, yearB] = b.data.split('/')
    
    if (!dayA || !monthA || !yearA || !dayB || !monthB || !yearB) return 0
    
    const dateA = new Date(Number.parseInt(yearA), Number.parseInt(monthA) - 1, Number.parseInt(dayA))
    const dateB = new Date(Number.parseInt(yearB), Number.parseInt(monthB) - 1, Number.parseInt(dayB))
    return dateA.getTime() - dateB.getTime()
  })
})

// Computed totals
const totalIncome = computed(() => {
  return filteredTransactions.value
    .filter(t => t.tipo === 'ENTRADA' && !t.skipped)
    .reduce((sum, t) => sum + t.valor, 0)
})

const totalExpenses = computed(() => {
  return filteredTransactions.value
    .filter(t => t.tipo === 'SAIDA' && !t.skipped)
    .reduce((sum, t) => sum + t.valor, 0)
})

const balance = computed(() => totalIncome.value - totalExpenses.value)

// Validation for modal form
const isValidSelection = computed(() => {
  if (!selectedClassificationId.value) return false
  
  if (selectedClassificationId.value === 'IGNORE') {
    return skipReason.value.trim().length > 0
  }
  
  if (selectedClassificationId.value === 'NEW') {
    return newClassificationText.value.trim().length > 0 && newClassificationEmoji.value.trim().length > 0
  }
  
  return true
})

// Helper functions
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

function getClassificationText(classificationId: string): string {
  const classification = classifications.value.find(c => c.id === classificationId)
  return classification ? classification.text : 'N/A'
}

function getClassificationEmoji(classificationId: string): string {
  const classification = classifications.value.find(c => c.id === classificationId)
  return classification ? classification.emoji : '❓'
}

function togglePeopleType(type: string, checked: boolean) {
  if (checked) {
    if (!selectedPeopleTypes.value.includes(type)) {
      selectedPeopleTypes.value.push(type)
    }
  } else {
    const index = selectedPeopleTypes.value.indexOf(type)
    if (index > -1) {
      selectedPeopleTypes.value.splice(index, 1)
    }
  }
}

function formatDate(date: string): string {
  const [day, month, year] = date.split('/')
  if (!day || !month || !year) return date
  
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

// Significado modal functions
function openSignificadoModal(transaction: TransactionWithMetadata) {
  editingTransaction.value = transaction
  newSignificado.value = transaction.significado || ''
  selectedClassificationId.value = transaction.classificationId || ''
  skipReason.value = ''
  showSignificadoModal.value = true
}

function closeSignificadoModal() {
  showSignificadoModal.value = false
  editingTransaction.value = null
  newSignificado.value = ''
  selectedClassificationId.value = ''
  newClassificationText.value = ''
  newClassificationEmoji.value = ''
  skipReason.value = ''
}

function selectClassification(classificationId: string) {
  selectedClassificationId.value = classificationId
}

async function createNewClassification() {
  if (!newClassificationText.value.trim() || !newClassificationEmoji.value.trim()) return
  
  try {
    await addClassification(newClassificationText.value.trim(), newClassificationEmoji.value.trim())
    // Get the newly created classification ID and select it
    const newClassification = classifications.value[classifications.value.length - 1]
    if (newClassification) {
      selectedClassificationId.value = newClassification.id
      // Clear the input fields
      newClassificationText.value = ''
      newClassificationEmoji.value = ''
    }
  } catch (error) {
    console.error('Error creating classification:', error)
    alert('Erro ao criar classificação')
  }
}

async function saveSignificado() {
  if (!editingTransaction.value) return
  
  // Handle "IGNORE" option
  if (selectedClassificationId.value === 'IGNORE') {
    if (!skipReason.value.trim()) {
      alert('Por favor, informe um motivo para ignorar a transação')
      return
    }
    
    isSubmitting.value = true
    try {
      const { skipTransaction } = useFinanceStore()
      await skipTransaction(
        editingTransaction.value.extractId, 
        editingTransaction.value.originalIndex, 
        skipReason.value.trim()
      )
      closeSignificadoModal()
    } catch (error) {
      console.error('Error skipping transaction:', error)
      alert('Erro ao ignorar transação')
    } finally {
      isSubmitting.value = false
    }
    return
  }
  
  // Handle "NEW" option - create classification first
  if (selectedClassificationId.value === 'NEW') {
    if (!newClassificationText.value.trim() || !newClassificationEmoji.value.trim()) {
      alert('Por favor, preencha o nome e emoji da nova classificação')
      return
    }
    
    try {
      await addClassification(newClassificationText.value.trim(), newClassificationEmoji.value.trim())
      // Get the newly created classification ID
      const newClassification = classifications.value[classifications.value.length - 1]
      if (newClassification) {
        selectedClassificationId.value = newClassification.id
      } else {
        alert('Erro ao criar classificação')
        return
      }
    } catch (error) {
      console.error('Error creating classification:', error)
      alert('Erro ao criar classificação')
      return
    }
  }
  
  // Regular classification save
  if (!selectedClassificationId.value || selectedClassificationId.value === 'NEW') {
    alert('Por favor, selecione uma classificação válida')
    return
  }
  
  isSubmitting.value = true
  try {
    // Use the original transaction index
    const transactionIndex = editingTransaction.value.originalIndex
    
    // Save significado (can be empty to clear the field)
    await updateTransactionSignificado(editingTransaction.value.extractId, transactionIndex, newSignificado.value.trim())
    
    // Save classification (required)
    await updateTransactionClassification(editingTransaction.value.extractId, transactionIndex, selectedClassificationId.value)
    
    closeSignificadoModal()
  } catch (error) {
    console.error('Error saving transaction:', error)
    alert('Erro ao salvar transação')
  } finally {
    isSubmitting.value = false
  }
}

// Skip transaction functions
function showSkipReason(transaction: TransactionWithMetadata) {
  if (transaction.skipReason && transaction.skipReason.trim()) {
    alert(`Motivo para ignorar: ${transaction.skipReason}`)
  } else {
    alert('Nenhum motivo informado para ignorar esta transação')
  }
}

// Row styling functions
function getTransactionRowClasses(transaction: TransactionWithMetadata): string {
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

// Watch for changes and update available months
watch([selectedYear, selectedMonth], () => {
  // Ensure selected month is available for selected year
  const availableMonthsForYear = Array.from(availableMonths.value)
    .filter(monthKey => {
      const year = monthKey.split('-')[0]
      return year && year === selectedYear.value.toString()
    })
    .map(monthKey => {
      const month = monthKey.split('-')[1]
      return month ? Number.parseInt(month) : 0
    })
    .filter(month => !isNaN(month))
  
    if (!availableMonthsForYear.includes(selectedMonth.value)) {
      selectedMonth.value = availableMonthsForYear[0] || 1
    }
  
  // Save user preferences when month/year changes
  saveUserPreferences()
})

// Watch for changes in people types filter
watch(selectedPeopleTypes, () => {
  // Save user preferences when filter changes
  saveUserPreferences()
}, { deep: true })

// Watch for changes in skip filter
watch(showSkippedTransactions, () => {
  // Save user preferences when filter changes
  saveUserPreferences()
})

// Watch for changes in extracts to reload preferences when new data is available
watch(extracts, () => {
  // Reload preferences when extracts change (new data available)
  nextTick(() => {
    loadUserPreferences()
  })
}, { deep: true })

// Initialize with current month/year if available, otherwise first available
onMounted(() => {
  if (availableYears.value.length > 0) {
    // Load saved user preferences first
    loadUserPreferences()
    
    // If no saved preferences, try to use current year first
    if (!localStorage.getItem(STORAGE_KEYS.SELECTED_YEAR)) {
      if (availableYears.value.includes(currentDate.getFullYear())) {
        selectedYear.value = currentDate.getFullYear()
      } else {
        selectedYear.value = availableYears.value[0] || currentDate.getFullYear()
      }
    }
    
    const availableMonthsForYear = Array.from(availableMonths.value)
      .filter(monthKey => {
        const year = monthKey.split('-')[0]
        return year && year === selectedYear.value.toString()
      })
      .map(monthKey => {
        const month = monthKey.split('-')[1]
        return month ? Number.parseInt(month) : 0
      })
      .filter(month => !isNaN(month))
    
    if (availableMonthsForYear.length > 0) {
      // If no saved month preference, try to use current month if available for selected year
      if (!localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH)) {
        if (selectedYear.value === currentDate.getFullYear() && 
            availableMonthsForYear.includes(currentDate.getMonth() + 1)) {
          selectedMonth.value = currentDate.getMonth() + 1
        } else {
          selectedMonth.value = availableMonthsForYear[0] || 1
        }
      }
    }
    
    // Save initial preferences
    saveUserPreferences()
  }
})
</script>
