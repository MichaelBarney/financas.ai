<template>
  <div v-if="show" class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-blue-900">Nova Regra</h4>
      <button
        @click="$emit('close')"
        class="text-blue-600 hover:text-blue-800 text-sm"
      >
        Cancelar
      </button>
    </div>

    <!-- Rule Conditions -->
    <div class="space-y-3">
      <div v-for="(condition, index) in conditions" :key="condition.id" class="bg-white border border-blue-200 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <select
            :value="condition.type" 
            class="text-sm border border-gray-300 rounded px-2 py-1"
            @change="$emit('updateConditionType', condition, index, ($event.target as HTMLSelectElement).value)"
          >
            <option value="includes">Nome contém</option>
            <option value="day">Mesmo dia do mês</option>
            <option value="value">Mesmo valor</option>
          </select>
          <button
            v-if="conditions.length > 1"
            @click="$emit('removeCondition', index)"
            class="text-red-600 hover:text-red-800 text-sm"
          >
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
        
        <div class="grid grid-cols-1 gap-2">
          <input
            v-if="condition.type === 'includes'"
            :value="condition.value"
            @input="$emit('updateConditionValue', condition, index, ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Ex: NETFLIX, UBER, IFOOD"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div
            v-else-if="condition.type === 'day'"
            class="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50 text-gray-700"
          >
            Dia {{ condition.value }} de cada mês
          </div>
          <div
            v-else-if="condition.type === 'value'"
            class="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50 text-gray-700"
          >
            {{ formatCurrency(condition.value || 0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Logic Operator -->
    <div v-if="conditions.length > 1" class="flex items-center gap-2">
      <span class="text-xs text-gray-600">Lógica:</span>
      <select :value="logicOperator" @change="$emit('updateLogicOperator', ($event.target as HTMLSelectElement).value)" class="text-sm border border-gray-300 rounded px-2 py-1">
        <option value="AND">E (todas as condições)</option>
        <option value="OR">OU (qualquer condição)</option>
      </select>
    </div>

    <!-- Add Condition Button -->
    <button
      type="button"
      @click="$emit('addCondition')"
      class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
    >
      <Icon name="heroicons:plus" class="w-4 h-4" />
      Adicionar condição
    </button>

    <!-- Rule Actions -->
    <div class="border-t border-blue-200 pt-3">
      <h5 class="text-xs font-medium text-blue-900 mb-2">Ações da regra:</h5>
      <div class="space-y-2">
        <label class="flex items-center gap-2">
          <input
            :checked="actions.saveClassification"
            @change="$emit('updateRuleAction', 'saveClassification', ($event.target as HTMLInputElement).checked)"
            type="checkbox"
            class="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-xs text-blue-800">Aplicar classificação atual</span>
        </label>
        
        <label class="flex items-center gap-2">
          <input
            :checked="actions.saveSignificado"
            @change="$emit('updateRuleAction', 'saveSignificado', ($event.target as HTMLInputElement).checked)"
            type="checkbox"
            class="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-xs text-blue-800">Aplicar significado atual</span>
        </label>

        <label class="flex items-center gap-2">
          <input
            :checked="actions.consolidate"
            @change="$emit('updateRuleAction', 'consolidate', ($event.target as HTMLInputElement).checked)"
            type="checkbox"
            class="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            :disabled="!actions.saveSignificado"
          />
          <span class="text-xs text-blue-800" :class="{ 'text-gray-400': !actions.saveSignificado }">
            Consolidar transações similares
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  conditions: RuleCondition[]
  logicOperator: 'AND' | 'OR'
  actions: RuleActions
}

defineProps<Props>()

defineEmits<{
  close: []
  addCondition: []
  removeCondition: [index: number]
  updateConditionValue: [condition: RuleCondition, index: number, value: string]
  updateConditionType: [condition: RuleCondition, index: number, type: string]
  updateLogicOperator: [operator: 'AND' | 'OR']
  updateRuleAction: [action: string, value: boolean]
}>()

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>