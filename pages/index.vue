<template>
    <div p-24px>
        <!-- Page Header -->
        <div mb-24px>
            <h1 text-2xl font-bold mb-8px>Dashboard Financeiro</h1>
            <p text-gray-600>Gerencie seus extratos bancários e acompanhe suas transações</p>
        </div>

        <!-- Summary Cards -->
        <div v-if="summary" grid grid-cols-1 md:grid-cols-3 gap-16px mb-24px>
            <div bg-white border border-gray-200 rounded-lg p-16px>
                <h3 text-sm font-medium text-gray-500 uppercase tracking-wide>Total de Bancos</h3>
                <p text-2xl font-bold text-gray-900 mt-8px>{{ summary.totalBanks }}</p>
            </div>
            
            <div bg-white border border-gray-200 rounded-lg p-16px>
                <h3 text-sm font-medium text-gray-500 uppercase tracking-wide>Total de Extratos</h3>
                <p text-2xl font-bold text-gray-900 mt-8px>{{ summary.totalExtracts }}</p>
            </div>
            
            <div bg-white border border-gray-200 rounded-lg p-16px>
                <h3 text-sm font-medium text-gray-500 uppercase tracking-wide>Total de Transações</h3>
                <p text-2xl font-bold text-gray-900 mt-8px>{{ summary.totalTransactions }}</p>
            </div>
        </div>

        <!-- Transactions List -->
        <div bg-white border border-gray-200 rounded-lg>
            <div px-16px py-12px border-b border-gray-200>
                <h2 text-lg font-semibold>Extratos e Transações</h2>
            </div>
            <div p-16px>
                <TransactionsList />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { banks, extracts } = useFinanceStore()

const summary = computed(() => {
    const totalTransactions = extracts.value.reduce((sum, extract) => {
        return sum + extract.data.transacoes.length
    }, 0)

    return {
        totalBanks: banks.value.length,
        totalExtracts: extracts.value.length,
        totalTransactions
    }
})
</script>
