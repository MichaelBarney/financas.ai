<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Extratos</h1>
      <p class="text-gray-600 mt-2">Visualize e gerencie seus extratos bancários</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Upload de extratos -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Upload de Extratos</h2>
        <ExtractUpload 
          :show-modal="showUploadModal"
          @close="showUploadModal = false"
          @success="handleUploadSuccess"
        />
        <button
          v-if="!showUploadModal"
          @click="showUploadModal = true"
          class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center"
        >
          <Icon name="heroicons:document-arrow-up" class="w-5 h-5 mr-2" />
          Fazer Upload de Extrato
        </button>
      </div>

      <!-- Lista de extratos -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Extratos Processados</h2>
          <button
            class="text-blue-600 hover:text-blue-700 text-sm font-medium"
            @click="() => refreshExtracts()"
          >
            Atualizar
          </button>
        </div>

        <div v-if="pending" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-500 mt-2">Carregando extratos...</p>
        </div>

        <div v-else-if="extracts?.length === 0" class="text-center py-8">
          <Icon name="heroicons:document-text" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500">Nenhum extrato processado ainda</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="extract in extracts"
            :key="extract.id"
            class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            @click="selectExtract(extract)"
          >
            <div class="flex items-center justify-between space-x-4">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 mb-1">{{ extract.data.banco }}</p>
                <p class="text-sm text-gray-500 whitespace-pre-wrap mb-1 break-words">{{ extract.data.descricao }}</p>
                <p class="text-xs text-gray-400">{{ formatDate(extract.uploadedAt) }}</p>
              </div>
              <div class="flex flex-col items-end flex-shrink-0">
                <span class="text-sm font-medium text-blue-600 mb-1">
                  {{ extract.data.transacoes.length }} transações
                </span>
                <p class="text-xs text-gray-400">Clique para ver</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista detalhada de transações -->
    <div v-if="selectedExtract" class="mt-6">
      <TransactionsList :transactions="selectedExtract.data.transacoes" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SavedExtract } from '~/types'

useHead({
  title: 'Extratos - Finanças.ai'
})

// Use useFetch for reactive data loading
const { data: extracts, pending, refresh: refreshExtracts } = await useFetch<SavedExtract[]>('/api/extracts')

const selectedExtract = ref<SavedExtract | null>(null)
const showUploadModal = ref(false)

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Handle extract selection for viewing details
function selectExtract(extract: SavedExtract) {
  selectedExtract.value = extract
}

// Handle upload success
function handleUploadSuccess(data: any) {
  showUploadModal.value = false
  refreshExtracts()
}
</script>
