<template>
  <div class="w-full max-w-full overflow-x-hidden">
    <!-- Investments Section -->
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

  <!-- Category Spending Chart -->
  <div v-if="categorySpending.length > 0" class="bg-white border border-gray-200 rounded-lg mb-6">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
        📊 Gastos por Categoria
      </h2>
    </div>
    
    <div class="px-6 py-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Interactive Pie Chart -->
        <div class="flex flex-col items-center">
          <div class="relative">
            <svg width="300" height="300" viewBox="0 0 300 300" class="transform -rotate-90">
              <!-- Pie slices -->
              <g v-for="(slice, index) in pieSlices" :key="slice.category.id">
                <path
                  :d="slice.path"
                  :fill="getCategoryColor(slice.category.id, index)"
                  :stroke="hoveredSlice === index ? '#ffffff' : 'none'"
                  :stroke-width="hoveredSlice === index ? '3' : '0'"
                  class="transition-all duration-300 cursor-pointer"
                  :class="{ 'opacity-80': hoveredSlice !== null && hoveredSlice !== index }"
                  @mouseenter="hoveredSlice = index"
                  @mouseleave="hoveredSlice = null"
                />
              </g>
              
              <!-- Center circle for donut effect -->
              <circle cx="150" cy="150" r="60" fill="white" />
              
              <!-- Center text -->
              <text x="150" y="145" text-anchor="middle" class="transform rotate-90 origin-center">
                <tspan class="text-xs fill-gray-600">Total Gasto</tspan>
              </text>
              <text x="150" y="160" text-anchor="middle" class="transform rotate-90 origin-center">
                <tspan class="text-sm font-bold fill-gray-900">{{ formatCurrency(totalExpenses) }}</tspan>
              </text>
            </svg>
            
            <!-- Tooltip -->
            <div 
              v-if="hoveredSlice !== null" 
              class="absolute top-2 left-2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg z-10 pointer-events-none"
            >
              <div class="flex items-center gap-2 mb-1">
                <span>{{ pieSlices[hoveredSlice]?.category.emoji }}</span>
                <span class="font-medium">{{ pieSlices[hoveredSlice]?.category.text }}</span>
              </div>
              <div class="text-sm">
                {{ formatCurrency(pieSlices[hoveredSlice]?.category.amount || 0) }}
                <span class="text-gray-300">
                  ({{ pieSlices[hoveredSlice]?.category.percentage.toFixed(1) }}%)
                </span>
              </div>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="mt-4 grid grid-cols-2 gap-2 w-full max-w-sm">
            <div 
              v-for="(category, index) in categorySpending.slice(0, 8)" 
              :key="category.id"
              class="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
              :class="{ 'bg-gray-100': hoveredSlice === index }"
              @mouseenter="hoveredSlice = index"
              @mouseleave="hoveredSlice = null"
            >
              <div 
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: getCategoryColor(category.id, index) }"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-gray-900 truncate">
                  {{ category.emoji }} {{ category.text }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ category.percentage.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
          
          <!-- Show remaining categories if more than 8 -->
          <div v-if="categorySpending.length > 8" class="mt-2 text-xs text-gray-500 text-center">
            +{{ categorySpending.length - 8 }} outras categorias
          </div>
        </div>
        
        <!-- Summary stats -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumo de Gastos</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total de Categorias:</span>
              <span class="font-medium">{{ categorySpending.length }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total Gasto:</span>
              <span class="font-medium text-red-600">{{ formatCurrency(totalExpenses) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Maior Categoria:</span>
              <div class="text-right">
                <div class="font-medium text-sm">{{ categorySpending[0]?.emoji }} {{ categorySpending[0]?.text }}</div>
                <div class="text-xs text-gray-500">{{ formatCurrency(categorySpending[0]?.amount || 0) }}</div>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Média por Categoria:</span>
              <span class="font-medium">{{ formatCurrency(totalExpenses / categorySpending.length) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

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
            @update:model-value="(checked: boolean) => showSkippedTransactions = checked"
            size="md"
          />
          <span class="text-sm text-gray-700">Mostrar transações ignoradas</span>
        </label>
        
        <div class="w-px h-6 bg-gray-300"></div>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Principal')"
            @update:model-value="(checked: boolean) => togglePeopleType('Principal', checked)"
            size="md"
          />
          <span class="text-sm text-gray-700">Principal</span>
        </label>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Dependente')"
            @update:model-value="(checked: boolean) => togglePeopleType('Dependente', checked)"
            size="md"
          />
          <span class="text-sm text-gray-700">Dependente</span>
        </label>
        
        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Externo')"
            @update:model-value="(checked: boolean) => togglePeopleType('Externo', checked)"
            size="md"
          />
          <span class="text-sm text-gray-700">Externo</span>
        </label>

        <label class="flex items-center gap-2">
          <TelaCheckbox 
            :model-value="selectedPeopleTypes.includes('Outro')"
            @update:model-value="(checked: boolean) => togglePeopleType('Outro', checked)"
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
            v-for="(transaction, index) in transactionsWithConsolidation" 
            :key="transaction.isConsolidated ? `consolidated-${transaction.ruleId}` : `${transaction.extractId}-${transaction.originalIndex}`"
            :class="[
              'hover:bg-gray-50 transition-colors cursor-pointer',
              getTransactionRowClasses(transaction)
            ]"
            @click="handleTransactionClick(transaction)"
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
                  @click.stop="showSkipReason(transaction)"
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
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
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
            <p class="text-sm text-gray-600">{{ editingTransaction ? `${formatDate(editingTransaction.data, editingTransaction.extractId)} - ${formatCurrency(editingTransaction.valor)}` : '' }}</p>
          </div>
        </div>

        <!-- Rule Info Section -->
        <div v-if="editingTransaction?.appliedFromRule && editingTransaction?.ruleId" class="mb-4">
          <p class="text-sm text-gray-600 mb-2">🧠 Regra Aplicada:</p>
          <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-900">
                  Incluir quando contém: <span class="font-normal">{{ getRuleText(editingTransaction.ruleId) }}</span>
                </p>
                <p v-if="editingTransaction.significado" class="text-xs text-blue-700 mt-1">
                  Significado: {{ editingTransaction.significado }}
                </p>
                <p v-if="editingTransaction.classificationId" class="text-xs text-blue-700 mt-1">
                  Classificação: {{ getClassificationText(editingTransaction.classificationId) }}
                </p>
              </div>
              <button
                @click="editRule(editingTransaction.ruleId)"
                class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Editar Regra
              </button>
            </div>
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

          <!-- Advanced Options Toggle -->
          <div class="border-t pt-4">
            <button
              type="button"
              @click="showAdvancedOptions = !showAdvancedOptions"
              class="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Icon 
                :name="showAdvancedOptions ? 'heroicons:chevron-down' : 'heroicons:chevron-right'" 
                class="w-4 h-4" 
              />
              Opções Avançadas
            </button>
            
            <div v-if="showAdvancedOptions" class="mt-3 space-y-4" data-advanced-options>
              <!-- Rule Section -->
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 class="text-sm font-medium text-blue-900 mb-3">💾 Lembrar esta classificação</h4>
                <p class="text-xs text-blue-700 mb-3">
                  Crie uma regra para aplicar automaticamente esta classificação e significado quando encontrar transações similares.
                </p>
                
                <div class="space-y-3">
                  <div>
                    <label for="ruleIncludes" class="block text-xs font-medium text-blue-800 mb-1">
                      Incluir quando a descrição contiver:
                    </label>
                    <input
                      id="ruleIncludes"
                      v-model="ruleIncludes"
                      type="text"
                      class="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 'NETFLIX', 'UBER', 'IFOOD'"
                    />
                  </div>
                  
                  <div class="space-y-2">
                    <div class="flex items-center gap-3">
                      <label class="flex items-center gap-2">
                        <input
                          v-model="ruleSaveClassification"
                          type="checkbox"
                          class="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-xs text-blue-800">Salvar classificação</span>
                      </label>
                      
                      <label class="flex items-center gap-2">
                        <input
                          v-model="ruleSaveSignificado"
                          type="checkbox"
                          class="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-xs text-blue-800">Salvar significado</span>
                      </label>
                    </div>
                    
                    <div class="flex items-center gap-2">
                      <label class="flex items-center gap-2">
                        <input
                          v-model="ruleConsolidar"
                          type="checkbox"
                          class="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          :disabled="!ruleSaveSignificado"
                        />
                        <span class="text-xs text-blue-800" :class="{ 'text-gray-400': !ruleSaveSignificado }">
                          Consolidar transações similares
                        </span>
                      </label>
                      <div v-if="!ruleSaveSignificado" class="text-xs text-gray-500">
                        (requer significado)
                      </div>
                    </div>
                  </div>
                  
                  <button
                    v-if="ruleIncludes.trim() && (ruleSaveClassification || ruleSaveSignificado)"
                    type="button"
                    @click="createRule"
                    class="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {{ editingRuleId ? '💾 Atualizar Regra' : '💾 Criar Regra' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label for="classification" class="block text-sm font-medium text-gray-700 mb-2">
              Classificação <span class="text-red-500">*</span>
            </label>
            <div class="space-y-3">
              <!-- Existing classifications -->
              <div v-if="classifications.length > 0" class="grid grid-cols-3 gap-2">
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
  isConsolidated?: boolean
  consolidatedCount?: number
  isPartOfConsolidated?: boolean
  consolidatedRuleId?: string
}

const { extracts, people, cards, classifications, updateTransactionSignificado, updateTransactionClassification, addClassification, skipTransaction } = useFinanceStore()
const { addRule, applyRules, updateRule } = useRules()

// Month/Year selection
const currentDate = new Date()
const selectedYear = ref(2025) // Default to 2025 since that's when the extraction was uploaded
const selectedMonth = ref(7) // Default to July since that's when most transactions are

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

// Advanced options state
const showAdvancedOptions = ref(false)
const ruleIncludes = ref('')
const ruleSaveClassification = ref(false)
const ruleSaveSignificado = ref(false)
const ruleConsolidar = ref(false)
const editingRuleId = ref<string | null>(null)

// Expanded consolidated transactions state
const expandedConsolidated = ref<Set<string>>(new Set())

// Pie chart interaction state
const hoveredSlice = ref<number | null>(null)

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
      
      let yearNum: number
      if (year === 'xx') {
        // Use the year from the extraction upload date
        yearNum = new Date(extract.uploadedAt).getFullYear()
      } else if (year.length === 2) {
        yearNum = Number.parseInt(`20${year}`)
      } else {
        yearNum = Number.parseInt(year)
      }
      
      if (isNaN(yearNum)) return
      
      const monthNum = Number.parseInt(month)
      if (isNaN(monthNum)) return
      
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
      
      let yearNum: number
      if (year === 'xx') {
        // Use the year from the extraction upload date
        yearNum = new Date(extract.uploadedAt).getFullYear()
      } else if (year.length === 2) {
        yearNum = Number.parseInt(`20${year}`)
      } else {
        yearNum = Number.parseInt(year)
      }
      
      if (isNaN(yearNum)) return
      
      const monthNum = Number.parseInt(month)
      if (isNaN(monthNum)) return
      
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
          // Apply rules to the transaction (frontend only, doesn't modify extraction)
          let processedTransaction = {
            ...transaction,
            bankId: extract.bankId,
            extractId: extract.id,
            banco: extract.data.banco,
            originalIndex: index
          }
          
          // Check if transaction doesn't already have classification/significado from extraction
          if (!processedTransaction.classificationId && !processedTransaction.significado) {
            const ruleResult = applyRules(processedTransaction)
            if (ruleResult) {
              // Apply rules as frontend overlay
              processedTransaction = {
                ...processedTransaction,
                classificationId: ruleResult.classificationId || processedTransaction.classificationId,
                significado: ruleResult.significado || processedTransaction.significado,
                appliedFromRule: true,
                ruleId: ruleResult.ruleId
              }
            }
          }
          
          transactions.push(processedTransaction)
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
    
    let yearANum: number, yearBNum: number
    
    // Handle 'xx' year format for sorting
    if (yearA === 'xx') {
      // Find the extract for this transaction to get the upload date
      const extractA = extracts.value.find(e => e.id === a.extractId)
      yearANum = extractA ? new Date(extractA.uploadedAt).getFullYear() : 2000
    } else if (yearA.length === 2) {
      yearANum = Number.parseInt(`20${yearA}`)
    } else {
      yearANum = Number.parseInt(yearA)
    }
    
    if (yearB === 'xx') {
      // Find the extract for this transaction to get the upload date
      const extractB = extracts.value.find(e => e.id === b.extractId)
      yearBNum = extractB ? new Date(extractB.uploadedAt).getFullYear() : 2000
    } else if (yearB.length === 2) {
      yearBNum = Number.parseInt(`20${yearB}`)
    } else {
      yearBNum = Number.parseInt(yearB)
    }
    
    if (isNaN(yearANum) || isNaN(yearBNum)) return 0
    
    const dateA = new Date(yearANum, Number.parseInt(monthA) - 1, Number.parseInt(dayA))
    const dateB = new Date(yearBNum, Number.parseInt(monthB) - 1, Number.parseInt(dayB))
    return dateA.getTime() - dateB.getTime()
  })
})

// Computed totals
const totalIncome = computed(() => {
  return transactionsWithConsolidation.value
    .filter(t => t.tipo === 'ENTRADA' && !t.skipped)
    .reduce((sum, t) => sum + t.valor, 0)
})

const totalExpenses = computed(() => {
  return transactionsWithConsolidation.value
    .filter(t => t.tipo === 'SAIDA' && !t.skipped)
    .reduce((sum, t) => sum + t.valor, 0)
})

const balance = computed(() => totalIncome.value - totalExpenses.value)

// Investment totals
const investmentIncome = computed(() => {
  return investmentTransactions.value
    .filter(t => t.tipo === 'ENTRADA' && !t.skipped)
    .reduce((sum, t) => sum + t.valor, 0)
})

const investmentExpenses = computed(() => {
  return investmentTransactions.value
    .filter(t => t.tipo === 'SAIDA' && !t.skipped)
    .reduce((sum, t) => sum + t.valor, 0)
})

const investmentBalance = computed(() => investmentExpenses.value - investmentIncome.value)

// Category spending analysis (excluding investments)
const categorySpending = computed(() => {
  const expenses = transactionsWithConsolidation.value.filter(t => t.tipo === 'SAIDA' && !t.skipped)
  const categoryMap = new Map<string, { amount: number, emoji: string, text: string }>()
  
  for (const transaction of expenses) {
    const categoryId = transaction.classificationId || 'uncategorized'
    let categoryInfo = { amount: 0, emoji: '❓', text: 'Sem categoria' }
    
    if (categoryId !== 'uncategorized') {
      const classification = classifications.value.find(c => c.id === categoryId)
      if (classification) {
        categoryInfo = {
          amount: 0,
          emoji: classification.emoji,
          text: classification.text
        }
      }
    }
    
    const existing = categoryMap.get(categoryId) || categoryInfo
    existing.amount += transaction.valor
    categoryMap.set(categoryId, existing)
  }
  
  const totalExpenses = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0)
  
  return Array.from(categoryMap.entries())
    .map(([id, data]) => ({
      id,
      ...data,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount) // Sort by amount descending
})

// Pie chart slices computation
const pieSlices = computed(() => {
  if (categorySpending.value.length === 0) return []
  
  const slices = []
  let currentAngle = 0
  const centerX = 150
  const centerY = 150
  const radius = 90
  
  for (const category of categorySpending.value) {
    const startAngle = currentAngle
    const endAngle = currentAngle + (category.percentage / 100) * 360
    
    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    
    // Calculate arc points
    const startX = centerX + radius * Math.cos(startRad)
    const startY = centerY + radius * Math.sin(startRad)
    const endX = centerX + radius * Math.cos(endRad)
    const endY = centerY + radius * Math.sin(endRad)
    
    // Large arc flag for arcs greater than 180 degrees
    const largeArc = category.percentage > 50 ? 1 : 0
    
    // Create SVG path
    const path = [
      `M ${centerX} ${centerY}`, // Move to center
      `L ${startX} ${startY}`, // Line to start point
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`, // Arc to end point
      'Z' // Close path
    ].join(' ')
    
    slices.push({
      category,
      path,
      startAngle,
      endAngle
    })
    
    currentAngle = endAngle
  }
  
  return slices
})

// Computed property for transactions with consolidation logic
const transactionsWithConsolidation = computed(() => {
  const { rules } = useRules()
  const normalTransactions: TransactionWithMetadata[] = []
  const consolidatedGroups: { [key: string]: TransactionWithMetadata[] } = {}
  
  // Separate transactions into normal and consolidated groups
  for (const transaction of filteredTransactions.value) {
    if (transaction.appliedFromRule && transaction.ruleId) {
      const rule = rules.value.find(r => r.id === transaction.ruleId)
      if (rule?.consolidar && rule.significado) {
        // Group consolidatable transactions by rule ID
        if (!consolidatedGroups[rule.id]) {
          consolidatedGroups[rule.id] = []
        }
        consolidatedGroups[rule.id].push(transaction)
      } else {
        normalTransactions.push(transaction)
      }
    } else {
      normalTransactions.push(transaction)
    }
  }
  
  // Create consolidated transactions and handle expansion
  const consolidatedTransactions: TransactionWithMetadata[] = []
  for (const [ruleId, transactions] of Object.entries(consolidatedGroups)) {
    const rule = rules.value.find(r => r.id === ruleId)
    if (rule && transactions.length > 0) {
      const isExpanded = expandedConsolidated.value.has(ruleId)
      
      if (isExpanded) {
        // Show individual transactions when expanded
        consolidatedTransactions.push(...transactions.map(t => ({
          ...t,
          isPartOfConsolidated: true,
          consolidatedRuleId: ruleId
        })))
      } else {
        // Show consolidated transaction when collapsed
        const totalValue = transactions.reduce((sum, t) => sum + t.valor, 0)
        const firstTransaction = transactions[0]
        
        const consolidatedTransaction: TransactionWithMetadata = {
          ...firstTransaction,
          descricao: `${rule.significado} - Consolidado`,
          significado: `${rule.significado} - Consolidado`,
          valor: Math.abs(totalValue), // Use absolute value since tipo determines sign
          tipo: firstTransaction.tipo, // Use the same tipo as the original transactions
          appliedFromRule: true,
          ruleId: ruleId,
          isConsolidated: true,
          consolidatedCount: transactions.length
        }
        
        consolidatedTransactions.push(consolidatedTransaction)
      }
    }
  }
  
  // Filter out investment transactions (classification ID "7")
  const filteredNormalTransactions = normalTransactions.filter(t => t.classificationId !== '7')
  const filteredConsolidatedTransactions = consolidatedTransactions.filter(t => {
    if (t.isConsolidated) {
      // For consolidated transactions, check if the rule is for investments
      const rule = rules.value.find(r => r.id === t.ruleId)
      return rule?.classificationId !== '7'
    }
    return t.classificationId !== '7'
  })
  
  // Return normal transactions followed by consolidated ones (excluding investments)
  return [...filteredNormalTransactions, ...filteredConsolidatedTransactions]
})

// Computed property for investment transactions only
const investmentTransactions = computed(() => {
  const { rules } = useRules()
  const normalInvestments: TransactionWithMetadata[] = []
  const consolidatedInvestmentGroups: { [key: string]: TransactionWithMetadata[] } = {}
  
  // Separate investment transactions into normal and consolidated groups
  for (const transaction of filteredTransactions.value) {
    if (transaction.classificationId === '7') {
      if (transaction.appliedFromRule && transaction.ruleId) {
        const rule = rules.value.find(r => r.id === transaction.ruleId)
        if (rule?.consolidar && rule.significado && rule.classificationId === '7') {
          // Group consolidatable investment transactions by rule ID
          if (!consolidatedInvestmentGroups[rule.id]) {
            consolidatedInvestmentGroups[rule.id] = []
          }
          consolidatedInvestmentGroups[rule.id].push(transaction)
        } else {
          normalInvestments.push(transaction)
        }
      } else {
        normalInvestments.push(transaction)
      }
    }
  }
  
  // Create consolidated investment transactions and handle expansion
  const consolidatedInvestments: TransactionWithMetadata[] = []
  for (const [ruleId, transactions] of Object.entries(consolidatedInvestmentGroups)) {
    const rule = rules.value.find(r => r.id === ruleId)
    if (rule && transactions.length > 0) {
      const isExpanded = expandedConsolidated.value.has(ruleId)
      
      if (isExpanded) {
        // Show individual transactions when expanded
        consolidatedInvestments.push(...transactions.map(t => ({
          ...t,
          isPartOfConsolidated: true,
          consolidatedRuleId: ruleId
        })))
      } else {
        // Show consolidated transaction when collapsed
        const totalValue = transactions.reduce((sum, t) => sum + t.valor, 0)
        const firstTransaction = transactions[0]
        
        const consolidatedTransaction: TransactionWithMetadata = {
          ...firstTransaction,
          descricao: `${rule.significado} - Consolidado`,
          significado: `${rule.significado} - Consolidado`,
          valor: Math.abs(totalValue),
          tipo: firstTransaction.tipo,
          appliedFromRule: true,
          ruleId: ruleId,
          isConsolidated: true,
          consolidatedCount: transactions.length
        }
        
        consolidatedInvestments.push(consolidatedTransaction)
      }
    }
  }
  
  // Return investment transactions
  return [...normalInvestments, ...consolidatedInvestments]
})

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
  return classification ? `${classification.emoji} ${classification.text}` : 'N/A'
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

function formatDate(date: string, extractId?: string): string {
  const [day, month, year] = date.split('/')
  if (!day || !month || !year) return date
  
  let yearNum: number
  if (year === 'xx') {
    // Use the year from the extraction upload date
    if (extractId) {
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

// Handle transaction clicks
function handleTransactionClick(transaction: TransactionWithMetadata) {
  if (transaction.isConsolidated && transaction.ruleId) {
    // Toggle expansion for consolidated transactions
    toggleConsolidatedExpansion(transaction.ruleId)
  } else {
    // Open modal for normal transactions
    openSignificadoModal(transaction)
  }
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
  
  // Reset advanced options
  showAdvancedOptions.value = false
  ruleIncludes.value = ''
  ruleSaveClassification.value = false
  ruleSaveSignificado.value = false
  ruleConsolidar.value = false
  editingRuleId.value = null
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

async function createRule() {
  if (!ruleIncludes.value.trim()) {
    alert('Por favor, informe o texto para incluir na regra')
    return
  }
  
  if (!ruleSaveClassification.value && !ruleSaveSignificado.value) {
    alert('Por favor, selecione pelo menos uma opção para salvar (classificação ou significado)')
    return
  }
  
  try {
    const rule = {
      includes: ruleIncludes.value.trim(),
      classificationId: ruleSaveClassification.value && selectedClassificationId.value !== 'NEW' ? selectedClassificationId.value : undefined,
      significado: ruleSaveSignificado.value ? newSignificado.value.trim() : undefined,
      consolidar: ruleConsolidar.value && ruleSaveSignificado.value
    }
    
    if (editingRuleId.value) {
      // Update existing rule
      await updateRule(editingRuleId.value, rule)
      alert('Regra atualizada com sucesso!')
    } else {
      // Create new rule
      await addRule(rule)
      alert('Regra criada com sucesso! Agora transações similares serão classificadas automaticamente.')
    }
    
    // Clear rule form
    ruleIncludes.value = ''
    ruleSaveClassification.value = false
    ruleSaveSignificado.value = false
    ruleConsolidar.value = false
    editingRuleId.value = null
    
  } catch (error) {
    console.error('Error creating/updating rule:', error)
    alert('Erro ao criar/atualizar regra')
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
    
    // Apply rules to other unclassified transactions
    // This function is removed as per the edit hint.
    
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
  
  if (availableMonthsForYear.length > 0 && !availableMonthsForYear.includes(selectedMonth.value)) {
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
    
    // If no saved preferences, try to use 2025 first (when the extraction was uploaded)
    if (!localStorage.getItem(STORAGE_KEYS.SELECTED_YEAR)) {
      if (availableYears.value.includes(2025)) {
        selectedYear.value = 2025
      } else if (availableYears.value.includes(currentDate.getFullYear())) {
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
      // If no saved month preference, try to use July first (when most transactions are)
      if (!localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH)) {
        if (selectedYear.value === 2025 && availableMonthsForYear.includes(7)) {
          selectedMonth.value = 7
        } else if (selectedYear.value === currentDate.getFullYear() && 
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

// Helper function to get rule text by ID
function getRuleText(ruleId: string): string {
  const { rules } = useRules()
  const rule = rules.value.find(r => r.id === ruleId)
  return rule ? rule.includes : 'Regra não encontrada'
}

// Function to toggle expansion of consolidated transactions
function toggleConsolidatedExpansion(ruleId: string) {
  if (expandedConsolidated.value.has(ruleId)) {
    expandedConsolidated.value.delete(ruleId)
  } else {
    expandedConsolidated.value.add(ruleId)
  }
}

// Function to get color for category charts
function getCategoryColor(categoryId: string, index: number): string {
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
    '#14B8A6', // teal
    '#EAB308', // yellow
  ]
  
  if (categoryId === 'uncategorized') {
    return '#6B7280' // gray for uncategorized
  }
  
  return colors[index % colors.length]
}

// Function to edit rule
function editRule(ruleId: string) {
  const { rules, updateRule } = useRules()
  const rule = rules.value.find(r => r.id === ruleId)
  
  if (rule) {
    // Pre-fill the advanced options with the current rule
    ruleIncludes.value = rule.includes
    ruleSaveClassification.value = !!rule.classificationId
    ruleSaveSignificado.value = !!rule.significado
    ruleConsolidar.value = !!rule.consolidar
    
    // Also pre-fill the main form fields if they match the rule
    if (rule.classificationId && rule.classificationId === selectedClassificationId.value) {
      // Keep current selection
    } else if (rule.classificationId) {
      selectedClassificationId.value = rule.classificationId
    }
    
    if (rule.significado && rule.significado === newSignificado.value) {
      // Keep current value
    } else if (rule.significado) {
      newSignificado.value = rule.significado
    }
    
    // Set the editing ID
    editingRuleId.value = ruleId
    
    // Show advanced options
    showAdvancedOptions.value = true
    
    // Scroll to advanced options
    nextTick(() => {
      const advancedOptionsSection = document.querySelector('[data-advanced-options]')
      if (advancedOptionsSection) {
        advancedOptionsSection.scrollIntoView({ behavior: 'smooth' })
      }
    })
  }
}


</script>
