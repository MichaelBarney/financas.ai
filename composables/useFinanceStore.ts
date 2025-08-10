import type { Bank, SavedExtract, ExtractResult } from '~/types'

const banks = ref<Bank[]>([])
const extracts = ref<SavedExtract[]>([])
const isLoaded = ref(false)

export function useFinanceStore() {
    // Load data from server on first access
    const loadData = async () => {
        if (isLoaded.value)
            return

        try {
            // Load banks
            const banksData = await $fetch<Bank[]>('/api/banks')
            banks.value = banksData

            // Load extracts
            const extractsData = await $fetch<SavedExtract[]>('/api/extracts')
            extracts.value = extractsData

            isLoaded.value = true
        }
        catch (error) {
            console.error('Error loading data:', error)
        }
    }

    // Auto-load data on first access
    if (process.client && !isLoaded.value) {
        loadData()
    }

    const addBank = async (name: string) => {
        try {
            const newBank = await $fetch<Bank>('/api/banks', {
                method: 'POST',
                body: { name },
            })

            // Update local state
            const existingIndex = banks.value.findIndex(b => b.id === newBank.id)
            if (existingIndex === -1) {
                banks.value.push(newBank)
            }

            return newBank
        }
        catch (error) {
            console.error('Error adding bank:', error)
            throw error
        }
    }

    const removeBank = async (id: string) => {
        try {
            await $fetch(`/api/banks/${id}`, {
                method: 'DELETE',
            })

            // Update local state
            banks.value = banks.value.filter(bank => bank.id !== id)
            // Also remove related extracts from local state
            extracts.value = extracts.value.filter(extract => extract.bankId !== id)
        }
        catch (error) {
            console.error('Error removing bank:', error)
            throw error
        }
    }

    const addExtract = async (bankId: string, extractData: ExtractResult) => {
        try {
            const savedExtracts = await $fetch<SavedExtract[]>('/api/extracts', {
                method: 'POST',
                body: { bankId, extractData },
            })

            // Update local state
            extracts.value.push(...savedExtracts)

            return savedExtracts
        }
        catch (error) {
            console.error('Error adding extract:', error)
            throw error
        }
    }

    const getExtractsByMonth = (year: number, month: number) => {
        return extracts.value.filter(extract =>
            extract.year === year && extract.month === month,
        )
    }

    const getExtractsByBank = (bankId: string) => {
        return extracts.value.filter(extract => extract.bankId === bankId)
    }

    return {
        banks: readonly(banks),
        extracts: readonly(extracts),
        addBank,
        removeBank,
        addExtract,
        getExtractsByMonth,
        getExtractsByBank,
        loadData, // Expose loadData for manual refresh
    }
}
