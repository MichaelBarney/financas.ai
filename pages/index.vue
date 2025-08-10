<template>
  <div>
    <!-- Dashboard Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600 mt-2">Visão geral das suas finanças</p>
    </div>

    <!-- Summary Cards -->
    <div v-if="summary" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Bancos</h3>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ summary.totalBanks }}</p>
          </div>
          <Icon name="heroicons:building-library" class="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Extratos</h3>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ summary.totalExtracts }}</p>
          </div>
          <Icon name="heroicons:document-text" class="w-8 h-8 text-green-500" />
        </div>
      </div>
      
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Transações</h3>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ summary.totalTransactions }}</p>
          </div>
          <Icon name="heroicons:arrow-trending-up" class="w-8 h-8 text-purple-500" />
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Cartões</h3>
            <p class="text-2xl font-bold text-gray-900 mt-2">{{ summary.totalCreditCards }}</p>
          </div>
          <Icon name="heroicons:credit-card" class="w-8 h-8 text-orange-500" />
        </div>
      </div>
    </div>
    <!-- Transaction Table -->
    <TransactionTable class="mb-8" />
    <!-- Recent Activity -->
    <div v-if="recentExtracts.length > 0" class="bg-white border border-gray-200 rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Atividade Recente</h2>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div
            v-for="extract in recentExtracts"
            :key="extract.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-gray-400" />
              <div>
                <p class="font-medium text-gray-900">{{ extract.data.banco }}</p>
                <p class="text-sm text-gray-500">{{ extract.data.transacoes.length }} transações</p>
              </div>
            </div>
            <span class="text-sm text-gray-400">
              {{ formatDate(extract.uploadedAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <Icon name="heroicons:chart-pie" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Bem-vindo ao Finanças.ai</h3>
      <p class="text-gray-500 mb-6">Comece adicionando um banco e processando seus extratos</p>
      <NuxtLink
        to="/bancos"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
        Adicionar Primeiro Banco
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Dashboard - Finanças.ai'
})

const { banks, extracts } = useFinanceStore()

const summary = computed(() => {
  const totalTransactions = extracts.value.reduce((sum, extract) => {
    return sum + extract.data.transacoes.length
  }, 0)

  // Count unique credit cards across all extracts
  const uniqueCards = new Set<string>()
  extracts.value.forEach(extract => {
    extract.data.transacoes.forEach(transaction => {
      if (transaction.finalCartao && transaction.finalCartao !== 'N/A') {
        uniqueCards.add(transaction.finalCartao)
      }
    })
  })

  return {
    totalBanks: banks.value.length,
    totalExtracts: extracts.value.length,
    totalTransactions,
    totalCreditCards: uniqueCards.size
  }
})

const recentExtracts = computed(() => {
  return extracts.value
    .slice()
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5)
})

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>
