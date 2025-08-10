<template>
  <aside class="fixed left-0 top-16 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-10">
    <nav class="p-4">
      <ul class="space-y-2">
        <li>
          <NuxtLink
            to="/"
            class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            :class="{ 'bg-blue-50 text-blue-700': $route.path === '/' }"
          >
            <Icon name="heroicons:chart-bar" class="w-5 h-5 mr-3" />
            Dashboard
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/cartoes"
            class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            :class="{ 'bg-blue-50 text-blue-700': $route.path === '/cartoes' }"
          >
            <Icon name="heroicons:credit-card" class="w-5 h-5 mr-3" />
            Cartões
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/extratos"
            class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            :class="{ 'bg-blue-50 text-blue-700': $route.path === '/extratos' }"
          >
            <Icon name="heroicons:document-text" class="w-5 h-5 mr-3" />
            Extratos
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/bancos"
            class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            :class="{ 'bg-blue-50 text-blue-700': $route.path === '/bancos' }"
          >
            <Icon name="heroicons:building-library" class="w-5 h-5 mr-3" />
            Bancos
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
// Componente de sidebar para navegação principal
</script>

<style scoped>
.router-link-exact-active {
  @apply bg-blue-50 text-blue-700;
}
</style>
