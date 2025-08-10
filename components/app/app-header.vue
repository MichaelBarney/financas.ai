<template>
    <div
        w-full flex items-center justify-between
        py-16px px-24px
        b="b-.5px gray-160"
    >
        <h1 text-xl font-semibold>Gestão Financeira</h1>
        
        <TelaButton 
            @click="showUploadModal = true"
            size="md"
            variant="primary"
            icon="i-ph-plus"
            :leading="true"
        >
            Adicionar Extrato
        </TelaButton>
    </div>

    <!-- Upload Modal -->
    <ExtractUpload 
        :show-modal="showUploadModal"
        @close="showUploadModal = false"
        @success="handleUploadSuccess"
    />
</template>

<script setup lang="ts">
const { addExtract } = useFinanceStore()

const showUploadModal = ref(false)

function handleUploadSuccess({ bankId, data }: { bankId: string, data: any }) {
    const savedExtracts = addExtract(bankId, data)
    console.log('Extracts saved:', savedExtracts)
    showUploadModal.value = false
}
</script>
