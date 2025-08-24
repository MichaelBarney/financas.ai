<template>
    <header class="w-full flex items-center justify-between py-4 px-6 bg-white border-b border-gray-200">
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-semibold text-gray-900">Finanças.ai</h1>
        </div>
        
        <TelaButton 
            @click="showUploadModal = true"
            size="md"
            variant="primary"
            icon="i-ph-plus"
            :leading="true"
        >
            Adicionar Extrato
        </TelaButton>
    </header>

    <!-- Upload Modal -->
    <ExtractUpload 
        :show-modal="showUploadModal"
        @close="showUploadModal = false"
        @success="handleUploadSuccess"
    />
</template>

<script setup lang="ts">
const showUploadModal = ref(false)

function handleUploadSuccess({ bankId, data }: { bankId: string, data: any }) {
    // Extract is already saved by the upload component, just close modal
    console.log('Upload success for bank:', bankId, 'with', data.transacoes?.length || 0, 'transactions')
    showUploadModal.value = false
}
</script>
