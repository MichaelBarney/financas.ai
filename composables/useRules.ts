import type { Rule } from '~/types'

const rules = ref<Rule[]>([])
const isLoaded = ref(false)

export function useRules() {
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

    // Load rules from storage
    const loadRules = async () => {
        if (isLoaded.value)
            return

        try {
            const response = await $fetch<{ rules: Rule[] }>('/api/rules')
            rules.value = response.rules || []
            isLoaded.value = true
        }
        catch (error) {
            console.error('Error loading rules:', error)
            // Initialize with empty array if file doesn't exist
            rules.value = []
            isLoaded.value = true
        }
    }

    // Save rules to storage
    const saveRules = async () => {
        try {
            await $fetch('/api/rules', {
                method: 'POST',
                body: { rules: rules.value },
            })
        }
        catch (error) {
            console.error('Error saving rules:', error)
            throw error
        }
    }

    // Add a new rule
    const addRule = async (rule: Omit<Rule, 'id' | 'createdAt'>) => {
        const newRule: Rule = {
            ...rule,
            id: generateUUID(),
            createdAt: new Date(),
        }

        rules.value.push(newRule)
        await saveRules()
        return newRule
    }

    // Update an existing rule
    const updateRule = async (id: string, updates: Partial<Omit<Rule, 'id' | 'createdAt'>>) => {
        const index = rules.value.findIndex(rule => rule.id === id)
        if (index === -1)
            throw new Error('Rule not found')

        rules.value[index] = {
            ...rules.value[index],
            ...updates,
        }

        await saveRules()
        return rules.value[index]
    }

    // Remove a rule
    const removeRule = async (id: string) => {
        const index = rules.value.findIndex(rule => rule.id === id)
        if (index === -1)
            throw new Error('Rule not found')

        rules.value.splice(index, 1)
        await saveRules()
    }

    // Find matching rule for a transaction description
    const findMatchingRule = (description: string): Rule | null => {
        const normalizedDescription = description.toLowerCase()

        return rules.value.find((rule) => {
            const normalizedInclude = rule.includes.toLowerCase()
            return normalizedDescription.includes(normalizedInclude)
        }) || null
    }

    // Auto-apply rules to a transaction
    const applyRules = (transaction: any) => {
        const description = typeof transaction.descricao === 'string'
            ? transaction.descricao
            : transaction.descricao.nome

        const matchingRule = findMatchingRule(description)

        if (matchingRule) {
            return {
                classificationId: matchingRule.classificationId,
                significado: matchingRule.significado,
                appliedFromRule: true,
                ruleId: matchingRule.id,
            }
        }

        return null
    }

    // Auto-load rules on first access
    if (process.client && !isLoaded.value) {
        loadRules()
    }

    return {
        rules,
        loadRules,
        saveRules,
        addRule,
        updateRule,
        removeRule,
        findMatchingRule,
        applyRules,
    }
}
