<template>
  <div v-if="categorySpending.length > 0" class="bg-white border border-gray-200 rounded-lg mb-6">
    <div class="px-6 py-4 border-b border-gray-200">
      <button 
        @click="toggleCollapsed"
        class="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg px-2 py-1 -mx-2 -my-1"
      >
        <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
          📊 Gastos por Categoria
        </h2>
        <Icon 
          :name="isCollapsed ? 'heroicons:chevron-down' : 'heroicons:chevron-up'" 
          class="w-5 h-5 text-gray-500 transition-transform duration-200"
        />
      </button>
    </div>
    
    <div v-if="!isCollapsed" class="px-6 py-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Interactive Pie Chart -->
        <div class="flex flex-col items-center">
          <div class="relative">
            <svg width="300" height="300" viewBox="0 0 300 300" class="transform -rotate-90">
              <!-- Pie slices -->
              <g v-for="(slice, index) in pieSlices" :key="slice.category.id">
                <path
                  :d="slice.path"
                  :fill="getCategoryColor(slice.category.id, index)"
                  :stroke="hoveredSlice === index ? '#ffffff' : 'none'"
                  :stroke-width="hoveredSlice === index ? '3' : '0'"
                  class="transition-all duration-300 cursor-pointer"
                  :class="{ 'opacity-80': hoveredSlice !== null && hoveredSlice !== index }"
                  @mouseenter="hoveredSlice = index"
                  @mouseleave="hoveredSlice = null"
                />
              </g>
              
              <!-- Center circle for donut effect -->
              <circle cx="150" cy="150" r="60" fill="white" />
              
              <!-- Center text -->
              <text x="150" y="145" text-anchor="middle" class="transform rotate-90 origin-center">
                <tspan class="text-xs fill-gray-600">Total Gasto</tspan>
              </text>
              <text x="150" y="160" text-anchor="middle" class="transform rotate-90 origin-center">
                <tspan class="text-sm font-bold fill-gray-900">{{ formatCurrency(totalExpenses) }}</tspan>
              </text>
            </svg>
            
            <!-- Tooltip -->
            <div 
              v-if="hoveredSlice !== null" 
              class="absolute top-2 left-2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg z-10 pointer-events-none"
            >
              <div class="flex items-center gap-2 mb-1">
                <span>{{ pieSlices[hoveredSlice]?.category.emoji }}</span>
                <span class="font-medium">{{ pieSlices[hoveredSlice]?.category.text }}</span>
              </div>
              <div class="text-sm">
                {{ formatCurrency(pieSlices[hoveredSlice]?.category.amount || 0) }}
                <span class="text-gray-300">
                  ({{ pieSlices[hoveredSlice]?.category.percentage.toFixed(1) }}%)
                </span>
              </div>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="mt-4 grid grid-cols-2 gap-2 w-full max-w-sm">
            <div 
              v-for="(category, index) in categorySpending.slice(0, 8)" 
              :key="category.id"
              class="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
              :class="{ 'bg-gray-100': hoveredSlice === index }"
              @mouseenter="hoveredSlice = index"
              @mouseleave="hoveredSlice = null"
            >
              <div 
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: getCategoryColor(category.id, index) }"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-gray-900 truncate">
                  {{ category.emoji }} {{ category.text }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ category.percentage.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
          
          <!-- Show remaining categories if more than 8 -->
          <div v-if="categorySpending.length > 8" class="mt-2 text-xs text-gray-500 text-center">
            +{{ categorySpending.length - 8 }} outras categorias
          </div>
        </div>
        
        <!-- Summary stats -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumo de Gastos</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total de Categorias:</span>
              <span class="font-medium">{{ categorySpending.length }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total Gasto:</span>
              <span class="font-medium text-red-600">{{ formatCurrency(totalExpenses) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Maior Categoria:</span>
              <div class="text-right">
                <div class="font-medium text-sm">{{ categorySpending[0]?.emoji }} {{ categorySpending[0]?.text }}</div>
                <div class="text-xs text-gray-500">{{ formatCurrency(categorySpending[0]?.amount || 0) }}</div>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Média por Categoria:</span>
              <span class="font-medium">{{ formatCurrency(totalExpenses / categorySpending.length) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CategorySpending {
  id: string
  amount: number
  emoji: string
  text: string
  percentage: number
}

interface PieSlice {
  category: CategorySpending
  path: string
  startAngle: number
  endAngle: number
}

interface Props {
  categorySpending: CategorySpending[]
  totalExpenses: number
  isCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCollapsed: false
})

const emit = defineEmits<{
  toggleCollapsed: []
}>()

// Local state for chart interaction
const hoveredSlice = ref<number | null>(null)

// Pie chart slices computation
const pieSlices = computed(() => {
  if (props.categorySpending.length === 0) return []
  
  const slices: PieSlice[] = []
  let currentAngle = 0
  const centerX = 150
  const centerY = 150
  const radius = 90
  
  for (const category of props.categorySpending) {
    const startAngle = currentAngle
    const endAngle = currentAngle + (category.percentage / 100) * 360
    
    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    
    // Calculate arc points
    const startX = centerX + radius * Math.cos(startRad)
    const startY = centerY + radius * Math.sin(startRad)
    const endX = centerX + radius * Math.cos(endRad)
    const endY = centerY + radius * Math.sin(endRad)
    
    // Large arc flag for arcs greater than 180 degrees
    const largeArc = category.percentage > 50 ? 1 : 0
    
    // Create SVG path
    const path = [
      `M ${centerX} ${centerY}`, // Move to center
      `L ${startX} ${startY}`, // Line to start point
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`, // Arc to end point
      'Z' // Close path
    ].join(' ')
    
    slices.push({
      category,
      path,
      startAngle,
      endAngle
    })
    
    currentAngle = endAngle
  }
  
  return slices
})

function toggleCollapsed() {
  emit('toggleCollapsed')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function getCategoryColor(categoryId: string, index: number): string {
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
    '#14B8A6', // teal
    '#EAB308', // yellow
  ]
  
  if (categoryId === 'uncategorized') {
    return '#6B7280' // gray for uncategorized
  }
  
  return colors[index % colors.length]
}
</script>