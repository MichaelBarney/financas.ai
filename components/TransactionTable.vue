<template>
  <div class="w-full max-w-full overflow-x-hidden">
    <!-- Category Spending Chart -->
    <CategorySpendingChart
      :category-spending="categorySpending"
      :total-expenses="totalExpenses"
      :is-collapsed="isCategorySpendingCollapsed"
      @toggle-collapsed="toggleCategorySpending"
    />

    <!-- Investments Section -->
    <InvestmentsSection
      :investment-transactions="investmentTransactions"
      :investment-income="investmentIncome"
      :investment-expenses="investmentExpenses"
      :investment-balance="investmentBalance"
      :expanded-consolidated="expandedConsolidated"
      @transaction-click="handleTransactionClick"
    />

    <!-- Transactions Table -->
    <TransactionsTable
      :transactions="transactionsWithConsolidation"
      :selected-year="selectedYear"
      :selected-month="selectedMonth"
      :available-years="availableYears"
      :selected-people-types="selectedPeopleTypes"
      :show-skipped-transactions="showSkippedTransactions"
      :expanded-consolidated="expandedConsolidated"
      :total-income="totalIncome"
      :total-expenses="totalExpenses"
      :balance="balance"
      @update-year="selectedYear = $event"
      @update-month="selectedMonth = $event"
      @toggle-people-type="togglePeopleType"
      @update-show-skipped="showSkippedTransactions = $event"
      @transaction-click="handleTransactionClick"
      @show-skip-reason="showSkipReason"
    />

    <!-- Transaction Modal -->
    <TransactionModal
      :show="showSignificadoModal"
      :editing-transaction="editingTransaction"
      :significado="newSignificado"
      :selected-classification-id="selectedClassificationId"
      :new-classification-text="newClassificationText"
      :new-classification-emoji="newClassificationEmoji"
      :skip-reason="skipReason"
      :is-submitting="isSubmitting"
      :is-valid-selection="isValidSelection"
      :classifications="classifications"
      :show-rule-builder="showRuleBuilder"
      :rule-conditions="ruleConditions"
      :rule-logic-operator="ruleLogicOperator"
      :rule-actions="ruleActions"
      @close="closeSignificadoModal"
      @save="saveSignificado"
      @update-significado="newSignificado = $event"
      @select-classification="selectClassification"
      @update-new-classification-text="newClassificationText = $event"
      @update-new-classification-emoji="newClassificationEmoji = $event"
      @update-skip-reason="skipReason = $event"
      @create-new-classification="createNewClassification"
      @edit-rule="editRule"
      @toggle-rule-builder="toggleRuleBuilder"
      @close-rule-builder="showRuleBuilder = false"
      @add-rule-condition="addRuleCondition"
      @remove-rule-condition="removeRuleCondition"
      @update-condition-value="updateConditionValue"
      @update-condition-type="updateConditionType"
      @update-logic-operator="ruleLogicOperator = $event"
      @update-rule-action="updateRuleAction"
    />

  </div>
</template>

<script setup lang="ts">
import type { Transaction, Person, Card } from '~/types'
import type { TransactionWithMetadata } from '~/composables/useTransactionHelpers'
import { nextTick } from 'vue'

const { extracts, people, cards, classifications, updateTransactionSignificado, updateTransactionClassification, addClassification, skipTransaction } = useFinanceStore()
const { addRule, applyRules, updateRule } = useRules()
const { formatDate, formatCurrency, getTransactionDescription, getTransactionAccount, getTransactionRowClasses, getClassificationText } = useTransactionHelpers()
const { getPersonByCard, getPersonName } = usePersonHelpers()

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

// Rule builder state
const showRuleBuilder = ref(false)
const editingRuleId = ref<string | null>(null)

// Rule conditions and logic
const ruleConditions = ref([
  { id: Date.now(), type: 'includes', value: '' }
])
const ruleLogicOperator = ref('AND')

// Rule actions
const ruleActions = ref({
  saveClassification: true,
  saveSignificado: false,
  consolidate: false
})

// Legacy variables (to be removed gradually)
const ruleIncludes = ref('')
const ruleSaveClassification = ref(false)
const ruleSaveSignificado = ref(false)
const ruleConsolidar = ref(false)

// Expanded consolidated transactions state
const expandedConsolidated = ref<Set<string>>(new Set())

// Pie chart interaction state
const hoveredSlice = ref<number | null>(null)

// Category spending collapsible state
const isCategorySpendingCollapsed = ref(false)

// Storage keys for remembering user preferences
const STORAGE_KEYS = {
  SELECTED_YEAR: 'financas-ai-selected-year',
  SELECTED_MONTH: 'financas-ai-selected-month',
  SELECTED_PEOPLE_TYPES: 'financas-ai-selected-people-types',
  SHOW_SKIPPED_TRANSACTIONS: 'financas-ai-show-skipped-transactions',
  CATEGORY_SPENDING_COLLAPSED: 'financas-ai-category-spending-collapsed'
}

// Functions to save and load user preferences
function saveUserPreferences() {
  if (process.client) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_YEAR, selectedYear.value.toString())
    localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, selectedMonth.value.toString())
    localStorage.setItem(STORAGE_KEYS.SELECTED_PEOPLE_TYPES, JSON.stringify(selectedPeopleTypes.value))
    localStorage.setItem(STORAGE_KEYS.SHOW_SKIPPED_TRANSACTIONS, showSkippedTransactions.value.toString())
    localStorage.setItem(STORAGE_KEYS.CATEGORY_SPENDING_COLLAPSED, isCategorySpendingCollapsed.value.toString())
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

    // Load category spending collapsed preference
    const savedCategoryCollapsed = localStorage.getItem(STORAGE_KEYS.CATEGORY_SPENDING_COLLAPSED)
    if (savedCategoryCollapsed) {
      isCategorySpendingCollapsed.value = JSON.parse(savedCategoryCollapsed)
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
  
  // Reset rule builder
  showRuleBuilder.value = false
  ruleConditions.value = [{ id: Date.now(), type: 'includes', value: '' }]
  ruleLogicOperator.value = 'AND'
  ruleActions.value = {
    saveClassification: true,
    saveSignificado: false,
    consolidate: false
  }
  editingRuleId.value = null
  
  // Reset legacy variables
  ruleIncludes.value = ''
  ruleSaveClassification.value = false
  ruleSaveSignificado.value = false
  ruleConsolidar.value = false
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
    
    // Create rule if rule builder is open and has valid conditions
    if (showRuleBuilder.value && shouldCreateRule()) {
      await createRuleFromBuilder()
    }
    
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

// Watch for changes in category spending collapsed state
watch(isCategorySpendingCollapsed, () => {
  // Save user preferences when collapsed state changes
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

// Function to toggle category spending collapse
function toggleCategorySpending() {
  isCategorySpendingCollapsed.value = !isCategorySpendingCollapsed.value
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
    showRuleBuilder.value = true
    
    // Scroll to rule builder
    nextTick(() => {
      const ruleBuilderSection = document.querySelector('.bg-blue-50')
      if (ruleBuilderSection) {
        ruleBuilderSection.scrollIntoView({ behavior: 'smooth' })
      }
    })
  }
}

// New Rule Builder Functions
function addRuleCondition() {
  ruleConditions.value.push({
    id: Date.now() + Math.random(),
    type: 'includes',
    value: ''
  })
}

function removeRuleCondition(index: number) {
  if (ruleConditions.value.length > 1) {
    ruleConditions.value.splice(index, 1)
  }
}

function updateConditionValue(condition: any, index: number, value?: string) {
  if (value !== undefined) {
    // Direct value update from input
    condition.value = value
    return
  }
  
  if (!editingTransaction.value) return
  
  if (condition.type === 'day') {
    // Extract day from current transaction
    const [day] = editingTransaction.value.data.split('/')
    condition.value = parseInt(day) || 1
  } else if (condition.type === 'value') {
    // Use current transaction value
    condition.value = editingTransaction.value.valor
  } else if (condition.type === 'includes') {
    // Pre-fill with current transaction name
    const transactionName = getTransactionDescription(editingTransaction.value)
    condition.value = transactionName || ''
  }
}

function updateConditionType(condition: any, index: number, type: string) {
  condition.type = type
  // Auto-fill value when type changes
  updateConditionValue(condition, index)
}

function updateRuleAction(action: string, value: boolean) {
  if (action === 'saveClassification') {
    ruleActions.value.saveClassification = value
  } else if (action === 'saveSignificado') {
    ruleActions.value.saveSignificado = value
  } else if (action === 'consolidate') {
    ruleActions.value.consolidate = value
  }
}

function toggleRuleBuilder() {
  if (!showRuleBuilder.value) {
    // Opening rule builder - initialize with transaction values
    showRuleBuilder.value = true
    initializeRuleConditions()
  } else {
    // Closing rule builder
    showRuleBuilder.value = false
  }
}

function initializeRuleConditions() {
  if (!editingTransaction.value) return
  
  // Reset to single condition with auto-filled transaction name
  const transactionName = getTransactionDescription(editingTransaction.value)
  
  ruleConditions.value = [
    { id: Date.now(), type: 'includes', value: transactionName || '' }
  ]
  
  // Reset rule actions with significado pre-checked
  ruleActions.value = {
    saveClassification: true,
    saveSignificado: true,
    consolidate: false
  }
}

const canCreateRule = computed(() => {
  // Must have at least one valid condition
  const hasValidCondition = ruleConditions.value.some(condition => {
    if (condition.type === 'includes') {
      return condition.value && condition.value.trim().length > 0
    } else if (condition.type === 'day') {
      return condition.value && condition.value >= 1 && condition.value <= 31
    } else if (condition.type === 'value') {
      return condition.value && condition.value > 0
    }
    return false
  })
  
  // Must have at least one action selected
  const hasAction = ruleActions.value.saveClassification || ruleActions.value.saveSignificado
  
  // If saving classification, must have a valid classification selected
  const hasValidClassification = !ruleActions.value.saveClassification || 
    (selectedClassificationId.value && 
     selectedClassificationId.value !== 'IGNORE' && 
     selectedClassificationId.value !== 'NEW')
  
  return hasValidCondition && hasAction && hasValidClassification
})

function shouldCreateRule(): boolean {
  return canCreateRule.value
}

async function createRuleFromBuilder() {
  try {
    const { addRule } = useRules()
    
    // Build the rule conditions
    const conditions = ruleConditions.value
      .filter(condition => {
        if (condition.type === 'includes') {
          return condition.value && condition.value.trim().length > 0
        } else if (condition.type === 'day') {
          return condition.value && condition.value >= 1 && condition.value <= 31
        } else if (condition.type === 'value') {
          return condition.value && condition.value > 0
        }
        return false
      })
      .map(condition => ({
        type: condition.type,
        value: condition.type === 'includes' ? condition.value.trim() : condition.value
      }))

    const rule = {
      conditions,
      logicOperator: ruleLogicOperator.value,
      classificationId: ruleActions.value.saveClassification && selectedClassificationId.value !== 'NEW' ? selectedClassificationId.value : undefined,
      significado: ruleActions.value.saveSignificado ? newSignificado.value.trim() : undefined,
      consolidar: ruleActions.value.consolidate && ruleActions.value.saveSignificado,
      // Legacy field for backward compatibility
      includes: conditions.find(c => c.type === 'includes')?.value || ''
    }

    await addRule(rule)
    console.log('Rule created successfully during transaction save')
  } catch (error) {
    console.error('Error creating rule:', error)
    // Don't throw here to avoid interrupting the main save flow
  }
}



</script>
