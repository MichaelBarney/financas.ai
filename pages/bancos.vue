<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Bancos</h1>
      <p class="text-gray-600 mt-2">Configure e gerencie suas instituições bancárias</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Formulário para adicionar banco -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Adicionar Banco</h2>
        
        <form @submit.prevent="addBank" class="space-y-4">
          <div>
            <label for="bankName" class="block text-sm font-medium text-gray-700 mb-1">
              Nome do Banco
            </label>
            <input
              id="bankName"
              v-model="newBankName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Banco do Brasil, Itaú, Nubank..."
            />
          </div>
          
          <button
            type="submit"
            :disabled="!newBankName.trim() || isAdding"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Icon v-if="isAdding" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            <Icon v-else name="heroicons:plus" class="w-4 h-4 mr-2" />
            {{ isAdding ? 'Adicionando...' : 'Adicionar Banco' }}
          </button>
        </form>
      </div>

      <!-- Lista de bancos -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Bancos Cadastrados</h2>
          <TelaButton
            size="sm"
            @click="() => refreshBanks()"
          >
            Atualizar
          </TelaButton>
        </div>

        <div v-if="pending" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-500 mt-2">Carregando bancos...</p>
        </div>

        <div v-else-if="banks?.length === 0" class="text-center py-8">
          <Icon name="heroicons:building-library" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500">Nenhum banco cadastrado ainda</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="bank in banks"
            :key="bank.id"
            class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">{{ bank.name }}</p>
                <p class="text-xs text-gray-400">
                  Criado em {{ formatDate(bank.createdAt) }}
                </p>
              </div>
              <button
                @click="deleteBank(bank.id)"
                class="text-red-600 hover:text-red-700 p-1"
                title="Excluir banco"
              >
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Bank } from '~/types'

useHead({
  title: 'Bancos - Finanças.ai'
})

// Use useFetch for reactive data loading
const { data: banks, pending, refresh: refreshBanks } = await useFetch<Bank[]>('/api/banks')

const newBankName = ref('')
const isAdding = ref(false)

async function addBank() {
  if (!newBankName.value.trim()) return
  
  isAdding.value = true
  try {
    await $fetch('/api/banks', {
      method: 'POST',
      body: { name: newBankName.value.trim() }
    })
    newBankName.value = ''
    await refreshBanks()
  } catch (error) {
    console.error('Erro ao adicionar banco:', error)
    alert('Erro ao adicionar banco. Tente novamente.')
  } finally {
    isAdding.value = false
  }
}

async function deleteBank(bankId: string) {
  if (!confirm('Tem certeza que deseja excluir este banco?')) return
  
  try {
    await $fetch(`/api/banks/${bankId}`, { method: 'DELETE' })
    await refreshBanks()
  } catch (error) {
    console.error('Erro ao excluir banco:', error)
    alert('Erro ao excluir banco. Tente novamente.')
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>
