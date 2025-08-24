export const useSidebar = () => {
  const isCollapsed = ref(false)
  const isMobile = ref(false)
  
  const toggle = () => {
    isCollapsed.value = !isCollapsed.value
  }
  
  const collapse = () => {
    isCollapsed.value = true
  }
  
  const expand = () => {
    isCollapsed.value = false
  }
  
  // Check if mobile on client side
  const checkMobile = () => {
    if (process.client) {
      isMobile.value = window.innerWidth < 1024
      // Auto-collapse on mobile
      if (isMobile.value && !isCollapsed.value) {
        collapse()
      }
    }
  }
  
  // Persist state in localStorage
  const saveState = () => {
    if (process.client) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed.value))
    }
  }
  
  // Restore state from localStorage
  const restoreState = () => {
    if (process.client) {
      const stored = localStorage.getItem('sidebar-collapsed')
      if (stored) {
        isCollapsed.value = JSON.parse(stored)
      }
    }
  }
  
  // Initialize on client mount
  onMounted(() => {
    restoreState()
    checkMobile()
    
    // Add resize listener
    const handleResize = () => {
      checkMobile()
    }
    
    window.addEventListener('resize', handleResize)
    
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })
  })
  
  // Save state when it changes
  watch(isCollapsed, saveState)
  
  return {
    isCollapsed: readonly(isCollapsed),
    isMobile: readonly(isMobile),
    toggle,
    collapse,
    expand
  }
}