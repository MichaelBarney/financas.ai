<template>
  <div>
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Cartões</h1>
          <p class="text-gray-600 mt-2">Gerencie seus cartões de crédito e portadores</p>
        </div>
        <div class="flex space-x-3">
          <TelaButton
            @click="showPersonModal = true"
            variant="primary"
            size="md"
            icon="i-heroicons-user-plus"
          >
            Adicionar Pessoa
          </TelaButton>
          <TelaButton
            @click="showCardModal = true"
            variant="primary"
            size="md"
            icon="i-heroicons-credit-card"
          >
            Adicionar Cartão
          </TelaButton>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="pendingExtracts || pendingBanks || !financeStore" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-gray-500 mt-2">Carregando dados...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="allCards.length === 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <Icon name="heroicons:credit-card" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum cartão encontrado</h3>
      <p class="text-gray-500 mb-6">Processe alguns extratos para visualizar seus cartões de crédito</p>
      <TelaButton
        @click="navigateTo('/extratos')"
        variant="primary"
        size="md"
        icon="i-heroicons-document-arrow-up"
      >
        Processar Extrato
      </TelaButton>
    </div>

    <!-- Saved Cards and People Management -->
    <div v-else class="space-y-6">
      <!-- People Management Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900 flex items-center">
              <Icon name="heroicons:users" class="w-5 h-5 mr-3 text-blue-600" />
              Pessoas
            </h2>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-600">
                Principal: 
                <span v-if="financeStore.getPrincipalPerson()" class="font-medium text-yellow-700">
                  {{ financeStore.getPrincipalPerson()?.name }}
                </span>
                <span v-else class="text-gray-500">Nenhum definido</span>
              </span>
            </div>
          </div>
        </div>
        <div class="p-6">
          <div v-if="financeStore.people.value.length === 0" class="text-center py-8">
            <Icon name="heroicons:user-group" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500">Nenhuma pessoa cadastrada</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="person in financeStore.people.value"
              :key="person.id"
              class="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center flex-1">
                  <Icon name="heroicons:user" class="w-5 h-5 mr-2 text-blue-600" />
                  <div class="flex-1">
                    <div class="flex items-center">
                      <span class="font-medium text-gray-900">{{ person.name }}</span>
                      <span 
                        :class="{
                          'bg-yellow-100 text-yellow-800': person.type === 'Principal',
                          'bg-blue-100 text-blue-800': person.type === 'Dependente',
                          'bg-gray-100 text-gray-800': person.type === 'Externo'
                        }"
                        class="ml-2 px-2 py-0.5 text-xs rounded-full font-medium"
                      >
                        {{ person.type }}
                      </span>

                    </div>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <TelaButton
                    @click="editPerson(person)"
                    variant="ghost"
                    size="sm"
                    icon="i-heroicons-pencil"
                    title="Editar pessoa"
                  />
                  <TelaButton
                    @click="deletePerson(person.id)"
                    variant="ghost"
                    size="sm"
                    icon="i-heroicons-trash"
                    title="Remover pessoa"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cards Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900 flex items-center">
            <Icon name="heroicons:credit-card" class="w-5 h-5 mr-3 text-blue-600" />
            Cartões
          </h2>
        </div>
        <div class="p-6">
          <div v-if="allCards.length === 0" class="text-center py-8">
            <Icon name="heroicons:credit-card" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500 mb-4">Nenhum cartão encontrado</p>
            <NuxtLink
              to="/extratos"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon name="heroicons:document-arrow-up" class="w-4 h-4 mr-2" />
              Processar Extrato
            </NuxtLink>
          </div>
          <div v-else>
            <div
              v-for="bankGroup in allCards"
              :key="bankGroup.bankId"
              class="mb-6 last:mb-0"
            >
              <!-- Bank Header -->
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <Icon name="heroicons:building-library" class="w-5 h-5 mr-3 text-blue-600" />
                  {{ bankGroup.bankName }}
                </h3>
                <div class="flex items-center space-x-6 text-sm text-gray-600">
                  <span>{{ bankGroup.cards.length }} cartão{{ bankGroup.cards.length > 1 ? 'es' : '' }}</span>
                  <span>{{ bankGroup.totalTransactions }} transações</span>
                  <span class="font-semibold text-red-600">{{ formatCurrency(bankGroup.totalAmount) }}</span>
                </div>
              </div>

              <!-- Cards Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="card in bankGroup.cards"
                  :key="card.key"
                  :class="[getCardClasses(card), 'cursor-pointer hover:shadow-md transition-shadow duration-200']"
                  @click="card.isRegistered ? editRegisteredCard(card) : registerCard(card)"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center flex-1">
                      <Icon name="heroicons:credit-card" :class="getCardIconClass(card)" />
                      <span class="font-medium text-gray-900 ml-2">{{ getCardDisplayName(card) }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="text-xs text-gray-500">{{ card.transactionCount }} transações</span>
                      <div class="flex space-x-1" @click.stop>
                        <template v-if="card.isRegistered">
                          <TelaButton
                            @click="editRegisteredCard(card)"
                            variant="ghost"
                            size="xs"
                            icon="i-heroicons-pencil"
                            title="Editar cartão"
                          />
                          <TelaButton
                            @click="unregisterCard(card)"
                            variant="ghost"
                            size="xs"
                            icon="i-heroicons-trash"
                            title="Descadastrar cartão"
                          />
                        </template>
                      </div>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <div v-if="card.isRegistered && card.holderId" class="text-sm text-gray-600">
                      <p>Portador: {{ getPersonName(card.holderId) }}</p>
                    </div>
                    
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total gasto:</span>
                      <span class="font-semibold text-red-600">{{ formatCurrency(card.totalAmount) }}</span>
                    </div>
                    
                    <div v-if="card.internationalTransactions > 0" class="flex justify-between text-sm">
                      <span class="text-gray-600">Internacional:</span>
                      <span class="text-purple-600 font-medium">{{ card.internationalTransactions }} transações</span>
                    </div>
                    
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Média por transação:</span>
                      <span class="text-gray-700 font-medium">{{ formatCurrency(card.totalAmount / card.transactionCount) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div v-if="allCards.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ totalCardsUnified }}</div>
            <div class="text-sm text-gray-600">Total de Cartões</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ totalTransactionsUnified }}</div>
            <div class="text-sm text-gray-600">Total de Transações</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-red-600">{{ formatCurrency(totalAmountUnified) }}</div>
            <div class="text-sm text-gray-600">Gasto Total</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{{ totalInternationalTransactionsUnified }}</div>
            <div class="text-sm text-gray-600">Compras Internacionais</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Person Modal -->
    <div v-if="showPersonModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          {{ editingPerson ? 'Editar Pessoa' : 'Adicionar Pessoa' }}
        </h3>
        <form @submit.prevent="savePerson">
          <div class="mb-4">
            <label for="personName" class="block text-sm font-medium text-gray-700 mb-2">
              Nome da Pessoa
            </label>
            <input
              id="personName"
              v-model="newPersonName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome da pessoa"
            >
          </div>
          <div class="mb-4">
            <label for="personType" class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pessoa
            </label>
            <select
              id="personType"
              v-model="newPersonType"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Principal">Principal (Titular principal)</option>
              <option value="Dependente">Dependente (Cônjuge, filho, etc.)</option>
              <option value="Externo">Externo (Terceiros)</option>
            </select>
            <p class="text-sm text-gray-500 mt-1">
              <strong>Principal:</strong> Apenas uma pessoa pode ser principal.
            </p>
          </div>
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="cancelPersonModal"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? (editingPerson ? 'Salvando...' : 'Adicionando...') : (editingPerson ? 'Salvar' : 'Adicionar') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Card Modal -->
    <div v-if="showCardModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingCard ? 'Editar Cartão' : 'Cadastrar Cartão' }}
          </h3>
          <button
            @click="cancelCardModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>
        
        <form @submit.prevent="saveCard" class="space-y-4">
          <!-- Bank Selection -->
          <div>
            <label for="cardBank" class="block text-sm font-medium text-gray-700 mb-2">
              Banco
            </label>
            <select
              id="cardBank"
              v-model="newCardBankId"
              required
              :disabled="!!extractCardData"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um banco</option>
              <option
                v-for="bank in banks"
                :key="bank.id"
                :value="bank.id"
              >
                {{ bank.name }}
              </option>
            </select>
            <p v-if="extractCardData" class="text-xs text-gray-500 mt-1">
              Banco automaticamente selecionado do extrato
            </p>
          </div>

          <!-- Card ID (Last 4 digits) -->
          <div>
            <label for="cardId" class="block text-sm font-medium text-gray-700 mb-2">
              Últimos 4 dígitos do cartão
            </label>
            <input
              id="cardId"
              v-model="newCardFinalDigits"
              type="text"
              required
              :readonly="!!extractCardData"
              maxlength="4"
              pattern="[0-9]{4}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'bg-gray-100 cursor-not-allowed': !!extractCardData }"
              placeholder="1234"
            />
            <p v-if="extractCardData" class="text-xs text-gray-500 mt-1">
              Dígitos automaticamente preenchidos do extrato
            </p>
            <p v-else class="text-xs text-gray-500 mt-1">
              Digite os últimos 4 dígitos do cartão
            </p>
          </div>

          <div>
            <label for="cardName" class="block text-sm font-medium text-gray-700 mb-2">
              Nome do Cartão
            </label>
            <input
              id="cardName"
              v-model="newCardName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Nubank **** 1234"
            />
          </div>

          <div>
            <label for="cardHolder" class="block text-sm font-medium text-gray-700 mb-2">
              Portador do Cartão
            </label>
            <select
              id="cardHolder"
              v-model="newCardHolderId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma pessoa</option>
              <option
                v-for="person in financeStore.people.value"
                :key="person.id"
                :value="person.id"
              >
                {{ person.name }} ({{ person.type }})
              </option>
            </select>
            <p v-if="financeStore.people.value.length === 0" class="text-sm text-gray-500 mt-1">
              Adicione uma pessoa primeiro para poder criar cartões
            </p>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="cancelCardModal"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || financeStore.people.value.length === 0 || !newCardBankId || !newCardFinalDigits"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? 'Salvando...' : (editingCard ? 'Atualizar' : 'Cadastrar') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Card from Extract Modal -->
    <div v-if="showCardFromExtractModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Cadastrar Cartão do Extrato
        </h3>
        <form @submit.prevent="saveCardFromExtract">
          <!-- Bank Selection (Read-only for extract cards) -->
          <div class="mb-4">
            <label for="extractCardBank" class="block text-sm font-medium text-gray-700 mb-2">
              Banco
            </label>
            <input
              id="extractCardBank"
              :value="extractCardData?.bankName || ''"
              type="text"
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p class="text-xs text-gray-500 mt-1">Banco do extrato</p>
          </div>

          <!-- Card ID (Last 4 digits) - Read Only -->
          <div class="mb-4">
            <label for="extractCardId" class="block text-sm font-medium text-gray-700 mb-2">
              Últimos 4 dígitos
            </label>
            <input
              id="extractCardId"
              :value="extractCardData?.finalCartao || ''"
              type="text"
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p class="text-xs text-gray-500 mt-1">Dígitos do extrato</p>
          </div>

          <div class="mb-4">
            <label for="extractCardName" class="block text-sm font-medium text-gray-700 mb-2">
              Nome do Cartão
            </label>
            <input
              id="extractCardName"
              v-model="newCardName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do cartão"
            >
          </div>
          <div class="mb-4">
            <label for="extractCardHolder" class="block text-sm font-medium text-gray-700 mb-2">
              Portador do Cartão
            </label>
            <select
              id="extractCardHolder"
              v-model="newCardHolderId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma pessoa</option>
              <option
                v-for="person in financeStore.people.value"
                :key="person.id"
                :value="person.id"
              >
                {{ person.name }} ({{ person.type }})
              </option>
            </select>
            <p v-if="financeStore.people.value.length === 0" class="text-sm text-gray-500 mt-1">
              Adicione uma pessoa primeiro para poder criar cartões
            </p>
          </div>
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="cancelCardFromExtractModal"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || financeStore.people.value.length === 0"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? 'Cadastrando...' : 'Cadastrar Cartão' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Bank, SavedExtract, Person, Card } from '~/types'

useHead({
  title: 'Cartões - Finanças.ai'
})

// Use finance store for data management
const financeStore = useFinanceStore()

// Load data from APIs
const { data: banks, pending: pendingBanks } = await useFetch<Bank[]>('/api/banks')
const { data: extracts, pending: pendingExtracts } = await useFetch<SavedExtract[]>('/api/extracts')

// Modal states
const showPersonModal = ref(false)
const showCardModal = ref(false)
const showCardFromExtractModal = ref(false)
const isSubmitting = ref(false)
const isCreatingCard = ref(false)

// Form data
const newPersonName = ref('')
const newPersonType = ref<'Principal' | 'Dependente' | 'Externo'>('Dependente')
const editingPerson = ref<Person | null>(null)
const newCardName = ref('')
const newCardHolderId = ref('')
const newCardBankId = ref('')
const newCardFinalDigits = ref('')
const editingCard = ref<Card | null>(null)
const extractCardData = ref<{ finalCartao: string; bankName: string } | null>(null)



// Unified cards processing - combines extract cards with registered cards
const allCards = computed(() => {
  if (!banks.value || !extracts.value) return []

  const bankCardMap = new Map<string, {
    bankId: string
    bankName: string
    cards: Map<string, {
      key: string
      finalCartao: string
      bankId: string
      bankName: string
      transactionCount: number
      totalAmount: number
      internationalTransactions: number
      isRegistered: boolean
      registeredCard?: any
      name?: string
      holderId?: string
    }>
    totalAmount: number
    totalTransactions: number
  }>()

  // First, process extract data
  extracts.value.forEach(extract => {
    const bankName = banks.value?.find(b => b.id === extract.bankId)?.name || 'Banco desconhecido'
    
    if (!bankCardMap.has(extract.bankId)) {
      bankCardMap.set(extract.bankId, {
        bankId: extract.bankId,
        bankName,
        cards: new Map(),
        totalAmount: 0,
        totalTransactions: 0
      })
    }

    const bankData = bankCardMap.get(extract.bankId)!

    extract.data.transacoes.forEach(transaction => {
      if (transaction.finalCartao && transaction.finalCartao !== 'N/A') {
        const cardKey = `${extract.bankId}-${transaction.finalCartao}`
        const existing = bankData.cards.get(cardKey) || {
          key: cardKey,
          finalCartao: transaction.finalCartao,
          bankId: extract.bankId,
          bankName,
          transactionCount: 0,
          totalAmount: 0,
          internationalTransactions: 0,
          isRegistered: false
        }

        existing.transactionCount++
        existing.totalAmount += transaction.valor
        bankData.totalAmount += transaction.valor
        bankData.totalTransactions++
        
        if (transaction.compraInternacional) {
          existing.internationalTransactions++
        }

        bankData.cards.set(cardKey, existing)
      }
    })
  })

  // Now, check which cards are registered and merge the data
  if (financeStore.cards.value) {
    financeStore.cards.value.forEach(registeredCard => {
      // Use the new relational structure: bankId + finalCartao
      const cardKey = `${registeredCard.bankId}-${registeredCard.finalCartao}`
      
      // Find if we have this card in our map
      for (const [bankId, bankData] of bankCardMap.entries()) {
        if (bankData.cards.has(cardKey)) {
          const card = bankData.cards.get(cardKey)!
          card.isRegistered = true
          card.registeredCard = registeredCard
          card.name = registeredCard.name
          card.holderId = registeredCard.holderId
          break
        }
      }
    })
  }

  // Convert to array and sort
  return Array.from(bankCardMap.values())
    .map(bank => ({
      ...bank,
      cards: Array.from(bank.cards.values()).sort((a, b) => {
        // Sort registered cards first, then by amount
        if (a.isRegistered && !b.isRegistered) return -1
        if (!a.isRegistered && b.isRegistered) return 1
        return b.totalAmount - a.totalAmount
      })
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
})

// Legacy computed for compatibility
const creditCardsByBank = computed(() => {
  return allCards.value.map(bank => ({
    ...bank,
    cards: bank.cards.filter(card => !card.isRegistered).map(card => ({
      finalCartao: card.finalCartao,
      transactionCount: card.transactionCount,
      totalAmount: card.totalAmount,
      internationalTransactions: card.internationalTransactions
    }))
  })).filter(bank => bank.cards.length > 0)
})

// Summary stats for unified cards
const totalCardsUnified = computed(() => {
  return allCards.value.reduce((sum, bank) => sum + bank.cards.length, 0)
})

const totalTransactionsUnified = computed(() => {
  return allCards.value.reduce((sum, bank) => sum + bank.totalTransactions, 0)
})

const totalAmountUnified = computed(() => {
  return allCards.value.reduce((sum, bank) => sum + bank.totalAmount, 0)
})

const totalInternationalTransactionsUnified = computed(() => {
  return allCards.value.reduce((sum, bank) => {
    return sum + bank.cards.reduce((cardSum, card) => cardSum + card.internationalTransactions, 0)
  }, 0)
})

// Legacy summary stats
const totalCards = computed(() => {
  return creditCardsByBank.value.reduce((sum, bank) => sum + bank.cards.length, 0)
})

const totalTransactions = computed(() => {
  return creditCardsByBank.value.reduce((sum, bank) => sum + bank.totalTransactions, 0)
})

const totalAmount = computed(() => {
  return creditCardsByBank.value.reduce((sum, bank) => sum + bank.totalAmount, 0)
})

const totalInternationalTransactions = computed(() => {
  return creditCardsByBank.value.reduce((sum, bank) => {
    return sum + bank.cards.reduce((cardSum, card) => cardSum + card.internationalTransactions, 0)
  }, 0)
})

// Helper functions
function getPersonName(personId: string) {
  const person = financeStore.people.value.find(p => p.id === personId)
  return person?.name || 'Pessoa não encontrada'
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Card helper functions
function getCardClasses(card: any) {
  const baseClasses = "border border-gray-200 rounded-lg p-4 transition-colors"
  
  if (card.isRegistered) {
    return `${baseClasses} bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100`
  } else {
    return `${baseClasses} bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100`
  }
}

function getCardIconClass(card: any) {
  if (card.isRegistered) {
    return "w-5 h-5 text-green-600"
  } else {
    return "w-5 h-5 text-purple-600"
  }
}

function getCardDisplayName(card: any) {
  if (card.isRegistered && card.name) {
    return card.name
  } else {
    return `**** ${card.finalCartao}`
  }
}

// Person management
async function savePerson() {
  if (!newPersonName.value.trim()) return
  
  isSubmitting.value = true
  try {
    if (editingPerson.value) {
      await financeStore.updatePerson(editingPerson.value.id, newPersonName.value.trim(), newPersonType.value)
    } else {
      await financeStore.addPerson(newPersonName.value.trim(), newPersonType.value)
    }
    cancelPersonModal()
  } catch (error) {
    console.error('Error saving person:', error)
    const errorMessage = (error as any)?.data?.message || 'Erro ao salvar pessoa'
    alert(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

function editPerson(person: Person) {
  editingPerson.value = person
  newPersonName.value = person.name
  newPersonType.value = person.type
  showPersonModal.value = true
}

async function deletePerson(personId: string) {
  if (!confirm('Tem certeza que deseja remover esta pessoa? Todos os cartões associados também serão removidos.')) {
    return
  }
  
  try {
    await financeStore.removePerson(personId)
  } catch (error) {
    console.error('Error deleting person:', error)
    alert('Erro ao remover pessoa')
  }
}

function cancelPersonModal() {
  showPersonModal.value = false
  newPersonName.value = ''
  newPersonType.value = 'Dependente'
  editingPerson.value = null
}

// Card management
async function saveCard() {
  if (!newCardName.value.trim() || !newCardHolderId.value || !newCardBankId.value || !newCardFinalDigits.value) return
  
  isSubmitting.value = true
  try {
    if (editingCard.value) {
      await financeStore.updateCard(
        editingCard.value.id, 
        newCardName.value.trim(), 
        newCardHolderId.value,
        editingCard.value.bankId,
        editingCard.value.finalCartao
      )
      alert('Cartão atualizado com sucesso!')
    } else {
      // Check if this is a card from extract
      if (extractCardData.value) {
        // This is a card from extract, create it
        const bank = banks.value?.find(b => b.name === extractCardData.value?.bankName)
        if (!bank) {
          alert('Banco não encontrado')
          return
        }
        await financeStore.addCard(
          newCardName.value.trim(), 
          newCardHolderId.value,
          bank.id,
          extractCardData.value.finalCartao
        )
      } else {
        // This is a manually added card
        await financeStore.addCard(
          newCardName.value.trim(), 
          newCardHolderId.value,
          newCardBankId.value,
          newCardFinalDigits.value
        )
        alert('Cartão adicionado com sucesso!')
      }
    }
    
    cancelCardModal()
  } catch (error) {
    console.error('Error saving card:', error)
    alert('Erro ao salvar cartão')
  } finally {
    isSubmitting.value = false
  }
}

function editCard(card: Card) {
  editingCard.value = card
  newCardName.value = card.name
  newCardHolderId.value = card.holderId
  showCardModal.value = true
}

async function deleteCard(cardId: string) {
  if (!confirm('Tem certeza que deseja remover este cartão?')) {
    return
  }
  
  try {
    await financeStore.removeCard(cardId)
  } catch (error) {
    console.error('Error deleting card:', error)
    alert('Erro ao remover cartão')
  }
}

function cancelCardModal() {
  showCardModal.value = false
  newCardName.value = ''
  newCardHolderId.value = ''
  newCardBankId.value = ''
  newCardFinalDigits.value = ''
  editingCard.value = null
  extractCardData.value = null
}



// Card registration functions
function registerCard(card: any) {
  // Always open the card modal with pre-filled information
  extractCardData.value = { finalCartao: card.finalCartao, bankName: card.bankName }
  newCardName.value = `${card.bankName} **** ${card.finalCartao}`
  newCardHolderId.value = ''
  
  // Auto-fill bank and digits for extract cards
  const bank = banks.value?.find(b => b.name === card.bankName)
  if (bank) {
    newCardBankId.value = bank.id
    newCardFinalDigits.value = card.finalCartao
  }
  
  showCardModal.value = true
}

async function registerCardDirect(card: any, holderId: string) {
  isCreatingCard.value = true
  try {
    const cardName = `${card.bankName} **** ${card.finalCartao}`
    await financeStore.addCard(cardName, holderId, card.bankId, card.finalCartao)
    
    // Show success message
    const person = financeStore.people.value.find(p => p.id === holderId)
    alert(`Cartão "${cardName}" cadastrado com sucesso para ${person?.name}!`)
  } catch (error) {
    console.error('Error registering card:', error)
    alert('Erro ao cadastrar cartão')
  } finally {
    isCreatingCard.value = false
  }
}

function editRegisteredCard(card: any) {
  if (!card.registeredCard) return
  
  editingCard.value = card.registeredCard
  newCardName.value = card.registeredCard.name
  newCardHolderId.value = card.registeredCard.holderId
  newCardBankId.value = card.registeredCard.bankId
  newCardFinalDigits.value = card.registeredCard.finalCartao
  showCardModal.value = true
}

async function unregisterCard(card: any) {
  if (!card.registeredCard) return
  
  if (!confirm(`Tem certeza que deseja descadastrar o cartão "${card.name}"? Ele voltará a aparecer apenas como cartão do extrato.`)) {
    return
  }
  
  try {
    await financeStore.removeCard(card.registeredCard.id)
    alert('Cartão descadastrado com sucesso!')
  } catch (error) {
    console.error('Error unregistering card:', error)
    alert('Erro ao descadastrar cartão')
  }
}

async function saveCardFromExtract() {
  if (!newCardName.value.trim() || !newCardHolderId.value || !extractCardData.value) return
  
  isSubmitting.value = true
  try {
    const bank = banks.value?.find(b => b.name === extractCardData.value?.bankName)
    if (!bank) {
      alert('Banco não encontrado')
      return
    }
    
    await financeStore.addCard(
      newCardName.value.trim(), 
      newCardHolderId.value,
      bank.id,
      extractCardData.value.finalCartao
    )
    
    // Show success message
    const person = financeStore.people.value.find(p => p.id === newCardHolderId.value)
    alert(`Cartão "${newCardName.value}" cadastrado com sucesso para ${person?.name}!`)
    
    cancelCardFromExtractModal()
  } catch (error) {
    console.error('Error saving card from extract:', error)
    alert('Erro ao cadastrar cartão')
  } finally {
    isSubmitting.value = false
  }
}

function cancelCardFromExtractModal() {
  showCardFromExtractModal.value = false
  newCardName.value = ''
  newCardHolderId.value = ''
  extractCardData.value = null
}
</script>
