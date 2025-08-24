<template>
  <!-- Transaction Modal -->
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ editingTransaction?.classificationId ? 'Editar Transação' : 'Analisar Transação' }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="heroicons:x-mark" class="w-6 h-6" />
        </button>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-2">Transação:</p>
        <div class="bg-gray-50 p-3 rounded-lg">
          <p class="font-medium text-gray-900">{{ editingTransaction ? getTransactionDescription(editingTransaction) : '' }}</p>
          <p class="text-sm text-gray-600">{{ editingTransaction ? `${formatDate(editingTransaction.data, editingTransaction.extractId)} - ${formatCurrency(editingTransaction.valor)}` : '' }}</p>
        </div>
      </div>

      <!-- Rule Info Section -->
      <div v-if="editingTransaction?.appliedFromRule && editingTransaction?.ruleId" class="mb-4">
        <p class="text-sm text-gray-600 mb-2">🧠 Regra Aplicada:</p>
        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-blue-900">
                Incluir quando contém: <span class="font-normal">{{ getRuleText(editingTransaction.ruleId) }}</span>
              </p>
              <p v-if="editingTransaction.significado" class="text-xs text-blue-700 mt-1">
                Significado: {{ editingTransaction.significado }}
              </p>
              <p v-if="editingTransaction.classificationId" class="text-xs text-blue-700 mt-1">
                Classificação: {{ getClassificationText(editingTransaction.classificationId) }}
              </p>
            </div>
            <button
              @click="$emit('editRule', editingTransaction.ruleId)"
              class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Editar Regra
            </button>
          </div>
        </div>
      </div>

      <form @submit.prevent="$emit('save')" class="space-y-4">
        <div>
          <label for="significado" class="block text-sm font-medium text-gray-700 mb-2">
            Significado (Nome personalizado) - Opcional
          </label>
          <input
            id="significado"
            :value="significado"
            @input="$emit('updateSignificado', ($event.target as HTMLInputElement).value)"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Deixe em branco para usar a descrição original"
          />
          <p class="text-xs text-gray-500 mt-1">
            Se preenchido, este nome substituirá a descrição original da transação
          </p>
        </div>

        <div>
          <label for="classification" class="block text-sm font-medium text-gray-700 mb-2">
            Classificação <span class="text-red-500">*</span>
          </label>
          <div class="space-y-3">
            <!-- Existing classifications -->
            <div v-if="classifications.length > 0" class="grid grid-cols-3 gap-2">
              <button
                v-for="classification in classifications"
                :key="classification.id"
                type="button"
                @click="$emit('selectClassification', classification.id)"
                :class="[
                  'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
                  selectedClassificationId === classification.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                ]"
              >
                <span class="text-lg">{{ classification.emoji }}</span>
                <span>{{ classification.text }}</span>
              </button>
              
              <!-- Ignorar option -->
              <button
                type="button"
                @click="$emit('selectClassification', 'IGNORE')"
                :class="[
                  'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
                  selectedClassificationId === 'IGNORE'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-600'
                ]"
              >
                <span class="text-lg">⏭️</span>
                <span>Ignorar</span>
              </button>
              
              <!-- Nova option -->
              <button
                type="button"
                @click="$emit('selectClassification', 'NEW')"
                :class="[
                  'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
                  selectedClassificationId === 'NEW'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                ]"
              >
                <span class="text-lg">➕</span>
                <span>Nova</span>
              </button>
            </div>
            
            <!-- Create new classification -->
            <div v-if="selectedClassificationId === 'NEW'" class="border-t pt-3">
              <p class="text-xs text-gray-600 mb-2">Criar nova classificação:</p>
              <div class="flex gap-2">
                <input
                  :value="newClassificationText"
                  @input="$emit('updateNewClassificationText', ($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="Nome da classificação"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  :value="newClassificationEmoji"
                  @input="$emit('updateNewClassificationEmoji', ($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="😊"
                  maxlength="2"
                  class="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  @click="$emit('createNewClassification')"
                  :disabled="!newClassificationText || !newClassificationEmoji"
                  class="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Criar
                </button>
              </div>
            </div>
            
            <!-- Skip reason input -->
            <div v-if="selectedClassificationId === 'IGNORE'" class="border-t pt-3">
              <div>
                <label for="modalSkipReason" class="block text-sm font-medium text-gray-700 mb-2">
                  Motivo para ignorar <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="modalSkipReason"
                  :value="skipReason"
                  @input="$emit('updateSkipReason', ($event.target as HTMLTextAreaElement).value)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Por exemplo: Transação duplicada, valor incorreto, etc."
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Rules Section -->
        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-gray-900">Regras de Classificação</h3>
            <button
              type="button"
              @click="$emit('toggleRuleBuilder')"
              class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Icon name="heroicons:plus" class="w-4 h-4" />
              Adicionar Regra
            </button>
          </div>
          
          <p class="text-xs text-gray-600 mb-3">
            Crie regras para aplicar automaticamente classificações em transações similares.
          </p>

          <!-- Rule Builder -->
          <RuleBuilder
            :show="showRuleBuilder"
            :conditions="ruleConditions"
            :logic-operator="ruleLogicOperator"
            :actions="ruleActions"
            @close="$emit('closeRuleBuilder')"
            @add-condition="$emit('addRuleCondition')"
            @remove-condition="$emit('removeRuleCondition', $event)"
            @update-condition-value="$emit('updateConditionValue', $event, arguments[1], arguments[2])"
            @update-condition-type="$emit('updateConditionType', $event, arguments[1], arguments[2])"
            @update-logic-operator="$emit('updateLogicOperator', $event)"
            @update-rule-action="$emit('updateRuleAction', $event, arguments[1])"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting || !isValidSelection"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TransactionWithMetadata } from '~/composables/useTransactionHelpers'
import type { Classification } from '~/types'

interface RuleCondition {
  id: number
  type: 'includes' | 'day' | 'value'
  value: string | number
}

interface RuleActions {
  saveClassification: boolean
  saveSignificado: boolean
  consolidate: boolean
}

interface Props {
  show: boolean
  editingTransaction: TransactionWithMetadata | null
  significado: string
  selectedClassificationId: string
  newClassificationText: string
  newClassificationEmoji: string
  skipReason: string
  isSubmitting: boolean
  isValidSelection: boolean
  classifications: Classification[]
  showRuleBuilder: boolean
  ruleConditions: RuleCondition[]
  ruleLogicOperator: 'AND' | 'OR'
  ruleActions: RuleActions
}

defineProps<Props>()

defineEmits<{
  close: []
  save: []
  updateSignificado: [value: string]
  selectClassification: [id: string]
  updateNewClassificationText: [value: string]
  updateNewClassificationEmoji: [value: string]
  updateSkipReason: [value: string]
  createNewClassification: []
  editRule: [ruleId: string]
  toggleRuleBuilder: []
  closeRuleBuilder: []
  addRuleCondition: []
  removeRuleCondition: [index: number]
  updateConditionValue: [condition: RuleCondition, index: number, value: string]
  updateConditionType: [condition: RuleCondition, index: number, type: string]
  updateLogicOperator: [operator: 'AND' | 'OR']
  updateRuleAction: [action: string, value: boolean]
}>()

const { formatDate, formatCurrency, getTransactionDescription, getClassificationText } = useTransactionHelpers()

function getRuleText(ruleId: string): string {
  const { rules } = useRules()
  const rule = rules.value.find(r => r.id === ruleId)
  return rule ? rule.includes : 'Regra não encontrada'
}
</script>