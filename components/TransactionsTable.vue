<template>
  <div class="bg-white border border-gray-200 rounded-lg">
    <!-- Header with filters -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-xl font-semibold text-gray-900">Transações</h2>
        
        <!-- Month/Year Selector -->
        <div class="flex items-center gap-3">
          <select 
            :value="selectedYear" 
            @change="$emit('updateYear', parseInt(($event.target as HTMLSelectElement).value))"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
          
          <select 
            :value="selectedMonth" 
            @change="$emit('updateMonth', parseInt(($event.target as HTMLSelectElement).value))"
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
            @update:model-value="$emit('updateShowSkipped', $event)"
            size="md"
          />
          <span class="text-sm text-gray-700">Mostrar transações ignoradas</span>
        </label>
        
        <div class="w-px h-6 bg-gray-300"></div>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Principal')"
            @update:model-value="$emit('togglePeopleType', 'Principal', $event)"
            size="md"
          />
          <span class="text-sm text-gray-700">Principal</span>
        </label>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Dependente')"
            @update:model-value="$emit('togglePeopleType', 'Dependente', $event)"
            size="md"
          />
          <span class="text-sm text-gray-700">Dependente</span>
        </label>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Externo')"
            @update:model-value="$emit('togglePeopleType', 'Externo', $event)"
            size="md"
          />
          <span class="text-sm text-gray-700">Externo</span>
        </label>

        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Outro')"
            @update:model-value="$emit('togglePeopleType', 'Outro', $event)"
            size="md"
          />
          <span class="text-sm text-gray-700">Outro</span>
        </label>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto min-w-full">
      <table class="w-full" style="min-width: 1200px;">
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
            v-for="(transaction, index) in transactions" 
            :key="transaction.isConsolidated ? `consolidated-${transaction.ruleId}` : `${transaction.extractId}-${transaction.originalIndex}`"
            :class="[
              'hover:bg-gray-50 transition-colors cursor-pointer',
              getTransactionRowClasses(transaction)
            ]"
            @click="$emit('transactionClick', transaction)"
          >
            <!-- Data -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(transaction.data, transaction.extractId) }}
            </td>
            <!-- Descrição -->
            <td class="px-6 py-4 text-sm text-gray-900">
              <div>
                <p v-if="transaction.significado" class="font-medium" 
                   :class="{
                     'text-purple-800': transaction.isConsolidated,
                     'text-purple-600': !transaction.isConsolidated && !transaction.isPartOfConsolidated,
                     'text-purple-700 pl-4': transaction.isPartOfConsolidated
                   }">
                   <span v-if="transaction.isPartOfConsolidated" class="text-purple-400 mr-2">└─</span>
                   {{ transaction.significado }} 
                   <span v-if="transaction.isConsolidated">
                     {{ expandedConsolidated.has(transaction.ruleId || '') ? '📂' : '📦' }}
                   </span>
                   <span v-else-if="!transaction.isPartOfConsolidated">✨</span>
                   <span v-if="transaction.appliedFromRule && !transaction.isConsolidated && !transaction.isPartOfConsolidated" class="text-blue-600 ml-2">🧠</span>
                </p>
                <p v-else class="font-medium" 
                   :class="{
                     'text-purple-800': transaction.isConsolidated,
                     'text-purple-700 pl-4': transaction.isPartOfConsolidated
                   }">
                  <span v-if="transaction.isPartOfConsolidated" class="text-purple-400 mr-2">└─</span>
                  {{ getTransactionDescription(transaction) }}
                  <span v-if="transaction.isConsolidated">
                    {{ expandedConsolidated.has(transaction.ruleId || '') ? '📂' : '📦' }}
                  </span>
                  <span v-if="transaction.appliedFromRule && !transaction.isConsolidated && !transaction.isPartOfConsolidated" class="text-blue-600 ml-2">🧠</span>
                </p>
                <p v-if="transaction.isConsolidated" class="text-xs text-purple-600 font-medium">
                  {{ transaction.consolidatedCount }} transações - 
                  <span class="text-purple-500">
                    {{ expandedConsolidated.has(transaction.ruleId || '') ? 'Clique para recolher' : 'Clique para expandir' }}
                  </span>
                </p>
                <p v-else-if="!transaction.isPartOfConsolidated && getTransactionAccount(transaction.descricao) && getTransactionAccount(transaction.descricao) !== 'N/A'" class="text-xs text-gray-500">
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
                  @click.stop="$emit('showSkipReason', transaction)"
                  class="text-xs text-gray-500 hover:text-gray-700 underline"
                  title="Ver motivo"
                >
                  Ver motivo
                </button>
              </div>
              <div v-else-if="transaction.classificationId" class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {{ getClassificationText(transaction.classificationId) }}
                </span>
                <span v-if="transaction.appliedFromRule" class="text-xs text-purple-600" title="Aplicado via regra">
                  💾
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
      <div v-if="transactions.length === 0" class="px-6 py-12 text-center">
        <Icon name="heroicons:document-text" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
        <p class="text-gray-500">
          Não há transações para {{ months.find(m => m.value === selectedMonth)?.label }} de {{ selectedYear }}
        </p>
      </div>
    </div>
    
    <!-- Summary -->
    <div v-if="transactions.length > 0" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
        <div class="flex gap-6">
          <span class="text-gray-600">
            Total de transações: <span class="font-medium text-gray-900">{{ transactions.length }}</span>
          </span>
          <span v-if="transactions.some(t => t.skipped)" class="text-gray-500">
            Ignoradas: <span class="font-medium">{{ transactions.filter(t => t.skipped).length }}</span>
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
import type { TransactionWithMetadata } from '~/composables/useTransactionHelpers'

interface Props {
  transactions: TransactionWithMetadata[]
  selectedYear: number
  selectedMonth: number
  availableYears: number[]
  selectedPeopleTypes: string[]
  showSkippedTransactions: boolean
  expandedConsolidated: Set<string>
  totalIncome: number
  totalExpenses: number
  balance: number
}

defineProps<Props>()

defineEmits<{
  updateYear: [year: number]
  updateMonth: [month: number]
  togglePeopleType: [type: string, checked: boolean]
  updateShowSkipped: [show: boolean]
  transactionClick: [transaction: TransactionWithMetadata]
  showSkipReason: [transaction: TransactionWithMetadata]
}>()

const { 
  formatDate, 
  formatCurrency, 
  getTransactionDescription, 
  getTransactionAccount, 
  getTransactionRowClasses,
  getClassificationText 
} = useTransactionHelpers()

const { getPersonName } = usePersonHelpers()

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
</script>