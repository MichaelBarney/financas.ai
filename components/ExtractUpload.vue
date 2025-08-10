<template>
  <div>
    <!-- Upload Modal -->
    <div 
      v-if="showModal"
      fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50
      @click.self="closeModal"
    >
      <div bg-white rounded-lg p-24px w-full max-w-md mx-16px>
        <div flex items-center justify-between mb-16px>
          <h3 text-lg font-semibold>Enviar Extrato</h3>
          <TelaButton 
            @click="closeModal"
            variant="ghost"
            size="sm"
            icon="i-ph-x"
          />
        </div>

        <!-- Password Input (shown when needed) -->
        <div v-if="requiresPassword" mb-16px>
          <div p-16px bg-yellow-50 border border-yellow-200 rounded-lg>
            <div flex items-center gap-8px mb-8px>
              <Icon name="ph:lock-key" size="20" class="text-yellow-600" />
              <span text-sm font-medium text-yellow-800>PDF Protegido por Senha</span>
            </div>
            <p text-sm text-yellow-700 mb-12px>
              Este PDF está protegido por senha. Selecione um banco para usar uma senha salva ou digite manualmente.
            </p>
            
            <!-- Bank selector for saved passwords -->
            <div mb-12px>
              <label text-xs font-medium text-yellow-800 mb-4px block>Banco (opcional)</label>
              <select
                v-model="selectedBankForPassword"
                @change="onBankForPasswordChange"
                class="w-full px-12px py-8px border border-yellow-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
              >
                <option value="">Selecione um banco...</option>
                <option v-for="bankName in savedPasswordBanks" :key="bankName" :value="bankName">
                  {{ bankName }}
                </option>
              </select>
            </div>
            
            <!-- Debug info -->
            <div v-if="banks.length > 0" p-8px bg-blue-50 border border-blue-200 rounded text-xs text-blue-800>
              <strong>Bancos carregados:</strong> {{ banks.length }} - {{ banks.map(b => b.name).join(', ') }}
            </div>
            <div v-else p-8px bg-red-50 border border-red-200 rounded text-xs text-red-800>
              <strong>Nenhum banco carregado!</strong>
            </div>
            
            <!-- Password input -->
            <div>
              <label text-xs font-medium text-yellow-800 mb-4px block>Senha do PDF</label>
              <input
                v-model="pdfPassword"
                type="password"
                required
                class="w-full px-12px py-8px border border-yellow-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Digite a senha do PDF"
              />
            </div>
          </div>
        </div>

        <!-- File Upload Area -->
        <TelaFileDrop 
          v-model="isDragOver"
          :accept="['application/pdf']"
          @file-drop="onDrop"
        >
          <div
            :class="[
              'border-2 border-dashed rounded-lg p-32px text-center transition-colors',
              isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
              isUploading ? 'pointer-events-none opacity-50' : ''
            ]"
          >
            <Icon name="ph:cloud-arrow-up" size="48" class="mx-auto mb-16px text-gray-400" />
            
            <div v-if="!isUploading">
              <p text-gray-600 mb-8px>
                Arraste um arquivo PDF aqui ou
              </p>
              <div class="flex justify-center">
                <TelaButton 
                  @click="openFileDialog"
                  variant="primary"
                  size="md"
                >
                  Escolher arquivo
                </TelaButton>
              </div>
            </div>
            
            <div v-else>
              <p text-gray-600>Processando extrato...</p>
            </div>

            <input 
              ref="fileInput"
              type="file"
              accept=".pdf"
              hidden
              @change="handleFileSelect"
            />
          </div>
        </TelaFileDrop>

        <!-- Selected file info -->
        <div v-if="selectedFile" mt-16px p-12px bg-gray-50 rounded>
          <div flex items-center gap-8px>
            <Icon name="ph:file-pdf" size="20" class="text-red-500" />
            <span text-sm>{{ selectedFile.name }}</span>
            <TelaButton 
              @click="removeSelectedFile"
              variant="ghost"
              size="sm"
              icon="i-ph-x"
            />
          </div>
        </div>

        <!-- Action buttons -->
        <div flex gap-8px mt-24px>
          <TelaButton 
            @click="closeModal"
            variant="secondary"
            size="md"
            class="flex-1"
          >
            Cancelar
          </TelaButton>
          <TelaButton 
            @click="uploadExtract"
            variant="primary"
            size="md"
            class="flex-1"
            :disabled="!canUpload || isUploading"
          >
            {{ isUploading ? 'Processando...' : 'Enviar' }}
          </TelaButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { addExtract, addBank, banks, loadData, getBanks } = useFinanceStore()
const { uploadPdfToServer, pollExtractResult } = useTelaAPI()

const emit = defineEmits<{
  close: []
  success: [data: any]
}>()

const props = defineProps<{
  showModal: boolean
}>()

const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()
const requiresPassword = ref(false)
const pdfPassword = ref('')
const selectedBankForPassword = ref('')
const savedPasswords = ref<Record<string, string>>({})

const savedPasswordBanks = computed(() => {
  return Object.keys(savedPasswords.value)
})

const canUpload = computed(() => {
  if (requiresPassword.value) {
    return selectedFile.value && !isUploading.value && pdfPassword.value.trim() !== ''
  }
  return selectedFile.value && !isUploading.value
})

function onDrop(files: File[] | null) {
  if (files && files.length > 0) {
    const file = files[0]
    if (file && file.type === 'application/pdf') {
      selectedFile.value = file
      // Reset password state when new file is selected
      requiresPassword.value = false
      pdfPassword.value = ''
      selectedBankForPassword.value = ''
    }
  }
}

function openFileDialog() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file) {
      selectedFile.value = file
      // Reset password state when new file is selected
      requiresPassword.value = false
      pdfPassword.value = ''
      selectedBankForPassword.value = ''
    }
  }
}

function removeSelectedFile() {
  selectedFile.value = null
  requiresPassword.value = false
  pdfPassword.value = ''
  selectedBankForPassword.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function loadSavedPasswords() {
  try {
    savedPasswords.value = await $fetch('/api/passwords')
  } catch (error) {
    console.error('Error loading saved passwords:', error)
    savedPasswords.value = {}
  }
}

function onBankForPasswordChange() {
  if (selectedBankForPassword.value && savedPasswords.value[selectedBankForPassword.value]) {
    const password = savedPasswords.value[selectedBankForPassword.value]
    if (password) {
      pdfPassword.value = password
    }
  }
}

async function uploadExtract() {
  if (!canUpload.value || !selectedFile.value || isUploading.value) return

  isUploading.value = true

  try {
    // Ensure data is loaded and get banks
    const banksData = await getBanks()
    
    // Temporary debug log
    console.warn('[DEBUG] Banks loaded:', banksData.length, banksData.map(b => b.name))
    
    const registeredBanks = banksData.map(bank => bank.name)
    
    // Upload PDF and get completion ID
    const response = await uploadPdfToServer(selectedFile.value, registeredBanks, pdfPassword.value)

    if (response.status === 'password_required') {
      // PDF requires password
      requiresPassword.value = true
      isUploading.value = false
      // Load saved passwords when password input becomes visible
      await loadSavedPasswords()
      return
    }

    const { completionId } = response
    
    // Poll for the result
    const result = await pollExtractResult(completionId)
    
    // Validate the result structure
    if (typeof result !== 'object' || !result.transacoes) {
      console.error('Invalid result structure:', result)
      throw new Error('Invalid extract data format received')
    }
    
    // Handle bank response format
    let bankName = result.banco
    let bank: any
    
    if (bankName && bankName.startsWith('NEW:')) {
      // Extract the actual bank name after "NEW:"
      bankName = bankName.substring(4).trim()
      // Create new bank
      bank = await addBank(bankName)
    } else if (bankName) {
      // Find existing bank
      bank = banks.value.find(b => b.name.toLowerCase() === bankName.toLowerCase())
      
      if (!bank) {
        // Fallback: create bank if not found (shouldn't happen with proper Tela response)
        bank = await addBank(bankName)
      }
    } else {
      // Fallback if no bank name is provided
      bank = await addBank('Unknown Bank')
    }
    
    // Add extract to store
    await addExtract(bank.id, result)
    
    emit('success', { bankId: bank.id, data: result })
    closeModal()
  } catch (error: any) {
    console.error('Error uploading extract:', error)
    
    // Handle different types of errors
    let errorMessage = 'Erro ao processar extrato. Tente novamente.'
    
    if (error?.statusCode === 422) {
      errorMessage = 'Falha no processamento do documento. Verifique se o arquivo é um extrato válido.'
    } else if (error?.statusCode === 409) {
      errorMessage = 'Este extrato já foi processado anteriormente. Não é necessário enviá-lo novamente.'
      // Close modal for duplicate since it's not really an error
      setTimeout(() => {
        closeModal()
      }, 3000)
    } else if (error?.message?.includes('timeout')) {
      errorMessage = 'Tempo limite excedido. O documento pode estar sendo processado. Tente novamente em alguns minutos.'
    } else if (error?.message?.includes('password')) {
      errorMessage = 'Senha do PDF incorreta. Tente novamente.'
    }
    
    // For now, log the error. In the future, we can add a toast/notification system
    console.error('User-friendly error:', errorMessage)
    
    // TODO: Show error message to user via toast/notification system
    alert(errorMessage) // Temporary solution
  } finally {
    isUploading.value = false
  }
}

function closeModal() {
  selectedFile.value = null
  requiresPassword.value = false
  pdfPassword.value = ''
  selectedBankForPassword.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  emit('close')
}

// Reset form when modal closes and load passwords when it opens
watch(() => props.showModal, (newVal) => {
  if (!newVal) {
    selectedFile.value = null
    requiresPassword.value = false
    pdfPassword.value = ''
    selectedBankForPassword.value = ''
  } else {
    // Load saved passwords when modal opens
    loadSavedPasswords()
  }
})

// Load passwords when password input becomes visible
watch(requiresPassword, (newVal) => {
  if (newVal) {
    loadSavedPasswords()
  }
})
</script>