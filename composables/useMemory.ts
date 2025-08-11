import type { MemoryRule } from '~/types'

const memoryRules = ref<MemoryRule[]>([])
const isLoaded = ref(false)

export function useMemory() {
    // Helper function to generate UUID
    const generateUUID = (): string => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID()
        }
        // Fallback for environments without crypto.randomUUID
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0
            const v = c === 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
    }

    // Load memory rules from storage
    const loadMemoryRules = async () => {
        if (isLoaded.value)
            return

        try {
            const response = await $fetch<{ rules: MemoryRule[] }>('/api/memory')
            memoryRules.value = response.rules || []
            isLoaded.value = true
        }
        catch (error) {
            console.error('Error loading memory rules:', error)
            // Initialize with empty array if file doesn't exist
            memoryRules.value = []
            isLoaded.value = true
        }
    }

    // Save memory rules to storage
    const saveMemoryRules = async () => {
        try {
            await $fetch('/api/memory', {
                method: 'POST',
                body: { rules: memoryRules.value },
            })
        }
        catch (error) {
            console.error('Error saving memory rules:', error)
            throw error
        }
    }

    // Add a new memory rule
    const addMemoryRule = async (rule: Omit<MemoryRule, 'id' | 'createdAt'>) => {
        const newRule: MemoryRule = {
            ...rule,
            id: generateUUID(),
            createdAt: new Date(),
        }

        memoryRules.value.push(newRule)
        await saveMemoryRules()
        return newRule
    }

    // Update an existing memory rule
    const updateMemoryRule = async (id: string, updates: Partial<Omit<MemoryRule, 'id' | 'createdAt'>>) => {
        const index = memoryRules.value.findIndex(rule => rule.id === id)
        if (index === -1)
            throw new Error('Memory rule not found')

        memoryRules.value[index] = {
            ...memoryRules.value[index],
            ...updates,
        }

        await saveMemoryRules()
        return memoryRules.value[index]
    }

    // Remove a memory rule
    const removeMemoryRule = async (id: string) => {
        const index = memoryRules.value.findIndex(rule => rule.id === id)
        if (index === -1)
            throw new Error('Memory rule not found')

        memoryRules.value.splice(index, 1)
        await saveMemoryRules()
    }

    // Find matching memory rule for a transaction description
    const findMatchingRule = (description: string): MemoryRule | null => {
        const normalizedDescription = description.toLowerCase()

        return memoryRules.value.find((rule) => {
            const normalizedInclude = rule.includes.toLowerCase()
            return normalizedDescription.includes(normalizedInclude)
        }) || null
    }

    // Auto-apply memory rules to a transaction
    const applyMemoryRules = (transaction: any) => {
        const description = typeof transaction.descricao === 'string'
            ? transaction.descricao
            : transaction.descricao.nome

        const matchingRule = findMatchingRule(description)

        if (matchingRule) {
            return {
                classificationId: matchingRule.classificationId,
                significado: matchingRule.significado,
                appliedFromMemory: true,
                memoryRuleId: matchingRule.id,
            }
        }

        return null
    }

    // Auto-load memory rules on first access
    if (process.client && !isLoaded.value) {
        loadMemoryRules()
    }

    return {
        memoryRules,
        loadMemoryRules,
        saveMemoryRules,
        addMemoryRule,
        updateMemoryRule,
        removeMemoryRule,
        findMatchingRule,
        applyMemoryRules,
    }
}
