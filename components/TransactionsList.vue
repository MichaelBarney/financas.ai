<template>
  <div>
    <div v-if="!extracts.length" text-center py-32px text-gray-500>
      <Icon name="ph:file-text" size="48" class="mx-auto mb-16px" />
      <p>Nenhum extrato encontrado</p>
      <p text-sm>Adicione extratos usando o botão no header</p>
    </div>

    <div v-else space-y-24px>
      <!-- Group by Year/Month -->
      <div 
        v-for="group in groupedExtracts" 
        :key="group.key"
        border border-gray-200 rounded-lg overflow-hidden
      >
        <!-- Month Header -->
        <div bg-gray-50 px-16px py-12px border-b border-gray-200>
          <h3 text-lg font-semibold flex items-center justify-between>
            {{ group.monthName }} {{ group.year }}
            <span text-sm font-normal text-gray-600>
              {{ group.totalTransactions }} transações
            </span>
          </h3>
        </div>

        <!-- Banks in this month -->
        <div v-for="bankGroup in group.banks" :key="bankGroup.bankId" class="border-b border-gray-100 last:border-b-0">
          <!-- Bank Header -->
          <div bg-white px-16px py-8px border-b border-gray-100>
            <div flex items-center justify-between>
              <h4 text-md font-medium text-gray-800>
                {{ getBankName(bankGroup.bankId) }}
              </h4>
              <div flex gap-16px text-sm>
                <span text-green-600>
                  Entradas: {{ formatCurrency(bankGroup.totalIncome) }}
                </span>
                <span text-red-600>
                  Saídas: {{ formatCurrency(bankGroup.totalExpenses) }}
                </span>
                <span :class="bankGroup.balance >= 0 ? 'text-green-600' : 'text-red-600'" font-medium>
                  Saldo: {{ formatCurrency(bankGroup.balance) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Transactions -->
          <div>
            <div 
              v-for="(transaction, index) in bankGroup.transactions" 
              :key="index"
              px-16px py-12px hover:bg-gray-50 flex items-center justify-between
              :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-25'"
            >
              <div flex items-center gap-12px flex-1>
                <div 
                  :class="[
                    'w-8px h-8px rounded-full',
                    transaction.tipo === 'ENTRADA' ? 'bg-green-500' : 'bg-red-500'
                  ]"
                />
                <div flex-1>
                  <p font-medium text-gray-900>{{ getTransactionDescription(transaction.descricao) }}</p>
                  <div flex gap-16px text-sm text-gray-500>
                    <span>{{ formatDate(transaction.data) }}</span>
                    <span v-if="transaction.finalCartao && transaction.finalCartao !== 'N/A'" 
                          class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      <Icon name="ph:credit-card" size="12" />
                      **** {{ transaction.finalCartao }}
                    </span>
                    <span v-if="transaction.compraInternacional" 
                          class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      <Icon name="ph:globe" size="12" />
                      Internacional
                    </span>
                    <span v-if="getTransactionAccount(transaction.descricao)">{{ getTransactionAccount(transaction.descricao) }}</span>
                  </div>
                </div>
              </div>
              
              <div text-right>
                <p 
                  :class="[
                    'font-semibold',
                    transaction.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                  ]"
                >
                  {{ transaction.tipo === 'ENTRADA' ? '+' : '-' }}{{ formatCurrency(transaction.valor) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SavedExtract, Transaction } from '~/types'

const { extracts, banks } = useFinanceStore()

const groupedExtracts = computed(() => {
  const groups = new Map<string, {
    year: number
    month: number
    monthName: string
    key: string
    banks: Map<string, {
      bankId: string
      transactions: Transaction[]
      totalIncome: number
      totalExpenses: number
      balance: number
    }>
    totalTransactions: number
  }>()

  extracts.value.forEach(extract => {
    // Group transactions by month from each extract
    const monthlyGroups = new Map<string, Transaction[]>()
    
    extract.data.transacoes.forEach(transaction => {
      const [day, transactionMonth, transactionYear] = transaction.data.split('/')
      const yearNum = transactionYear.length === 2 
        ? Number.parseInt(`20${transactionYear}`) 
        : Number.parseInt(transactionYear)
      const monthNum = Number.parseInt(transactionMonth)
      const key = `${yearNum}-${monthNum}`
      
      if (!monthlyGroups.has(key)) {
        monthlyGroups.set(key, [])
      }
      monthlyGroups.get(key)!.push(transaction)
    })
    
    // Process each month group
    monthlyGroups.forEach((transactions, key) => {
      const [year, month] = key.split('-')
      const yearNum = Number.parseInt(year)
      const monthNum = Number.parseInt(month)
      
      if (!groups.has(key)) {
        groups.set(key, {
          year: yearNum,
          month: monthNum,
          monthName: getMonthName(monthNum),
          key,
          banks: new Map(),
          totalTransactions: 0
        })
      }

      const group = groups.get(key)!
      
      if (!group.banks.has(extract.bankId)) {
        group.banks.set(extract.bankId, {
          bankId: extract.bankId,
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0
        })
      }

      const bankGroup = group.banks.get(extract.bankId)!
      bankGroup.transactions.push(...transactions)
      
      // Calculate totals
      transactions.forEach(transaction => {
        if (transaction.tipo === 'ENTRADA') {
          bankGroup.totalIncome += transaction.valor
        } else {
          bankGroup.totalExpenses += transaction.valor
        }
      })
      
      bankGroup.balance = bankGroup.totalIncome - bankGroup.totalExpenses
      group.totalTransactions += transactions.length
    })
  })

  // Convert to array and sort by date (newest first)
  return Array.from(groups.values())
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
    .map(group => ({
      ...group,
      banks: Array.from(group.banks.values())
    }))
})

function getBankName(bankId: string) {
  const bank = banks.value.find(b => b.id === bankId)
  return bank?.name || 'Banco desconhecido'
}

function getMonthName(month: number) {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month - 1] || 'Mês inválido'
}

function formatDate(dateStr: string) {
  const [day, month, year] = dateStr.split('/')
  // Handle both 2-digit and 4-digit years
  const fullYear = year.length === 2 ? `20${year}` : year
  return `${day}/${month}/${fullYear}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function getTransactionDescription(descricao: string | { nome: string; conta: string }): string {
  if (typeof descricao === 'string') {
    return descricao
  }
  return descricao.nome
}

function getTransactionAccount(descricao: string | { nome: string; conta: string }): string | null {
  if (typeof descricao === 'string') {
    return null
  }
  return descricao.conta !== 'N/A' ? descricao.conta : null
}
</script>