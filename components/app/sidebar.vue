<template>
  <!-- Mobile Overlay -->
  <div 
    v-if="isMobile && !isCollapsed"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
    @click="collapse"
  />
  
  <!-- Sidebar -->
  <aside 
    class="bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-50"
    :class="[
      // Mobile behavior
      isMobile 
        ? [
            'fixed inset-y-0 left-0',
            isCollapsed ? '-translate-x-full w-64' : 'translate-x-0 w-64'
          ]
        // Desktop behavior  
        : [
            'relative h-full',
            isCollapsed ? 'w-16' : 'w-56'
          ]
    ]"
  >
    <nav class="h-full overflow-y-auto" :class="isCollapsed && !isMobile ? 'p-2' : 'p-4'">
      <ul class="space-y-1">
        <li>
          <NuxtLink
            to="/"
            class="flex items-center px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
            :class="{ 'bg-blue-50 text-blue-700': $route.path === '/' }"
            @click="isMobile && collapse()"
          >
            <Icon name="heroicons:chart-bar" class="w-5 h-5 flex-shrink-0" :class="!isCollapsed || isMobile ? 'mr-3' : ''" />
            <span v-if="!isCollapsed || isMobile" class="text-sm font-medium">Dashboard</span>
            <!-- Tooltip for collapsed desktop state -->
            <div v-if="isCollapsed && !isMobile" class="absolute left-16 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Dashboard
            </div>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/cartoes"
            class="flex items-center px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
            :class="{ 'bg-blue-50 text-blue-700': $route.path === '/cartoes' }"
            @click="isMobile && collapse()"
          >
            <Icon name="heroicons:credit-card" class="w-5 h-5 flex-shrink-0" :class="!isCollapsed || isMobile ? 'mr-3' : ''" />
            <span v-if="!isCollapsed || isMobile" class="text-sm font-medium">Cartões</span>
            <div v-if="isCollapsed && !isMobile" class="absolute left-16 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Cartões
            </div>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/extratos"
            class="flex items-center px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
            :class="{ 'bg-blue-50 text-blue-700': $route.path === '/extratos' }"
            @click="isMobile && collapse()"
          >
            <Icon name="heroicons:document-text" class="w-5 h-5 flex-shrink-0" :class="!isCollapsed || isMobile ? 'mr-3' : ''" />
            <span v-if="!isCollapsed || isMobile" class="text-sm font-medium">Extratos</span>
            <div v-if="isCollapsed && !isMobile" class="absolute left-16 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Extratos
            </div>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/bancos"
            class="flex items-center px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
            :class="{ 'bg-blue-50 text-blue-700': $route.path === '/bancos' }"
            @click="isMobile && collapse()"
          >
            <Icon name="heroicons:building-library" class="w-5 h-5 flex-shrink-0" :class="!isCollapsed || isMobile ? 'mr-3' : ''" />
            <span v-if="!isCollapsed || isMobile" class="text-sm font-medium">Bancos</span>
            <div v-if="isCollapsed && !isMobile" class="absolute left-16 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Bancos
            </div>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const { isCollapsed, isMobile, collapse } = useSidebar()

// Close sidebar on Escape key (mobile)
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMobile.value && !isCollapsed.value) {
      collapse()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped>
.router-link-exact-active {
  background-color: rgb(239 246 255);
  color: rgb(29 78 216);
}
</style>
