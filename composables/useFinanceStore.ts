import type { Bank, SavedExtract, ExtractResult, Person, Card, Classification } from '~/types'

const banks = ref<Bank[]>([])
const extracts = ref<SavedExtract[]>([])
const people = ref<Person[]>([])
const cards = ref<Card[]>([])
const classifications = ref<Classification[]>([])
const settings = ref<{ primaryPersonId: string | null }>({ primaryPersonId: null })
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

            // Load people
            const peopleData = await $fetch<Person[]>('/api/people')
            people.value = peopleData

            // Load cards
            const cardsData = await $fetch<Card[]>('/api/cards')
            cards.value = cardsData

            // Load classifications
            const classificationsData = await $fetch<Classification[]>('/api/classifications')
            classifications.value = classificationsData

            // Load settings
            const settingsData = await $fetch<{ primaryPersonId: string | null }>('/api/settings')
            settings.value = settingsData

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

    // Also expose a way to check if data is loaded
    const ensureDataLoaded = async () => {
        if (!isLoaded.value) {
            await loadData()
        }
        return isLoaded.value
    }

    // Get banks with fallback to ensure they're loaded
    const getBanks = async () => {
        if (banks.value.length === 0) {
            await ensureDataLoaded()
        }
        // Double-check if banks are still empty after loading
        if (banks.value.length === 0) {
            console.warn('[WARN] Banks still empty after loading, trying direct API call')
            try {
                const banksData = await $fetch<Bank[]>('/api/banks')
                banks.value = banksData
                console.warn('[WARN] Banks loaded directly from API:', banksData.length)
            }
            catch (error) {
                console.error('[ERROR] Failed to load banks directly:', error)
            }
        }
        return banks.value
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
        // Since extracts are no longer split by month, we need to filter transactions
        const monthlyExtracts: SavedExtract[] = []

        extracts.value.forEach((extract) => {
            const monthlyTransactions = extract.data.transacoes.filter((transaction) => {
                const parts = transaction.data.split('/')
                if (parts.length < 3) {
                    return false
                }

                const [_day, transactionMonth, transactionYear] = parts
                if (!transactionMonth || !transactionYear) {
                    return false
                }

                const yearNum = transactionYear.length === 2
                    ? Number.parseInt(`20${transactionYear}`)
                    : Number.parseInt(transactionYear)
                const monthNum = Number.parseInt(transactionMonth)

                return yearNum === year && monthNum === month
            })

            if (monthlyTransactions.length > 0) {
                // Create a new extract with filtered transactions
                monthlyExtracts.push({
                    ...extract,
                    data: {
                        ...extract.data,
                        transacoes: monthlyTransactions,
                    },
                })
            }
        })

        return monthlyExtracts
    }

    const getExtractsByBank = (bankId: string) => {
        return extracts.value.filter(extract => extract.bankId === bankId)
    }

    const getTransactionsByMonth = (year: number, month: number) => {
        const transactions: any[] = []

        extracts.value.forEach((extract) => {
            extract.data.transacoes.forEach((transaction) => {
                const parts = transaction.data.split('/')
                if (parts.length < 3) {
                    return
                }

                const [_day, transactionMonth, transactionYear] = parts
                if (!transactionMonth || !transactionYear) {
                    return
                }

                const yearNum = transactionYear.length === 2
                    ? Number.parseInt(`20${transactionYear}`)
                    : Number.parseInt(transactionYear)
                const monthNum = Number.parseInt(transactionMonth)

                if (yearNum === year && monthNum === month) {
                    transactions.push({
                        ...transaction,
                        bankId: extract.bankId,
                        extractId: extract.id,
                        banco: extract.data.banco,
                    })
                }
            })
        })

        return transactions
    }

    const getAllAvailableMonths = () => {
        const months = new Set<string>()

        extracts.value.forEach((extract) => {
            extract.data.transacoes.forEach((transaction) => {
                const parts = transaction.data.split('/')
                if (parts.length < 3) {
                    return
                }

                const [_day, month, year] = parts
                if (!month || !year) {
                    return
                }

                const yearNum = year.length === 2
                    ? Number.parseInt(`20${year}`)
                    : Number.parseInt(year)
                const monthNum = Number.parseInt(month)

                months.add(`${yearNum}-${monthNum}`)
            })
        })

        return Array.from(months)
            .map((monthKey) => {
                const [year, month] = monthKey.split('-')
                if (!year || !month) {
                    return null
                }
                return { year: Number.parseInt(year), month: Number.parseInt(month) }
            })
            .filter((item): item is { year: number; month: number } => item !== null)
            .sort((a, b) => {
                if (a.year !== b.year) {
                    return b.year - a.year // Most recent year first
                }
                return b.month - a.month // Most recent month first
            })
    }

    const addPerson = async (name: string, type: 'Principal' | 'Dependente' | 'Externo') => {
        try {
            const newPerson = await $fetch<Person>('/api/people', {
                method: 'POST',
                body: { name, type },
            })

            // Update local state
            const existingIndex = people.value.findIndex(p => p.id === newPerson.id)
            if (existingIndex === -1) {
                people.value.push(newPerson)
            }

            return newPerson
        }
        catch (error) {
            console.error('Error adding person:', error)
            throw error
        }
    }

    const removePerson = async (id: string) => {
        try {
            await $fetch(`/api/people/${id}`, {
                method: 'DELETE',
            })

            // Update local state
            people.value = people.value.filter(person => person.id !== id)
            // Also remove related cards from local state
            cards.value = cards.value.filter(card => card.holderId !== id)
            // Clear primary person if it was this person
            if (settings.value.primaryPersonId === id) {
                settings.value.primaryPersonId = null
            }
        }
        catch (error) {
            console.error('Error removing person:', error)
            throw error
        }
    }

    const updatePerson = async (id: string, name: string, type: 'Principal' | 'Dependente' | 'Externo') => {
        try {
            const updatedPerson = await $fetch<Person>(`/api/people/${id}`, {
                method: 'PUT',
                body: { name, type },
            })

            // Update local state
            const personIndex = people.value.findIndex(p => p.id === id)
            if (personIndex !== -1) {
                people.value[personIndex] = updatedPerson
            }

            return updatedPerson
        }
        catch (error) {
            console.error('Error updating person:', error)
            throw error
        }
    }

    const addCard = async (name: string, holderId: string, bankId: string, finalCartao: string) => {
        try {
            const newCard = await $fetch<Card>('/api/cards', {
                method: 'POST',
                body: { name, holderId, bankId, finalCartao },
            })

            // Update local state
            const existingIndex = cards.value.findIndex(c => c.id === newCard.id)
            if (existingIndex === -1) {
                cards.value.push(newCard)
            }

            return newCard
        }
        catch (error) {
            console.error('Error adding card:', error)
            throw error
        }
    }

    const updateCard = async (id: string, name: string, holderId: string, bankId: string, finalCartao: string) => {
        try {
            const updatedCard = await $fetch<Card>(`/api/cards/${id}`, {
                method: 'PUT',
                body: { name, holderId, bankId, finalCartao },
            })

            // Update local state
            const cardIndex = cards.value.findIndex(c => c.id === id)
            if (cardIndex !== -1) {
                cards.value[cardIndex] = updatedCard
            }

            return updatedCard
        }
        catch (error) {
            console.error('Error updating card:', error)
            throw error
        }
    }

    const removeCard = async (id: string) => {
        try {
            await $fetch(`/api/cards/${id}`, {
                method: 'DELETE',
            })

            // Update local state
            cards.value = cards.value.filter(card => card.id !== id)
        }
        catch (error) {
            console.error('Error removing card:', error)
            throw error
        }
    }

    const getPrincipalPerson = () => {
        return people.value.find(person => person.type === 'Principal') || null
    }

    const setPrimaryPerson = async (personId: string | null) => {
        try {
            const updatedSettings = await $fetch<{ primaryPersonId: string | null }>('/api/settings', {
                method: 'PUT',
                body: { primaryPersonId: personId },
            })

            // Update local state
            settings.value = updatedSettings

            return updatedSettings
        }
        catch (error) {
            console.error('Error setting primary person:', error)
            throw error
        }
    }

    const updateTransactionSignificado = async (extractId: string, transactionIndex: number, significado: string) => {
        try {
            await $fetch(`/api/extracts/${extractId}/transaction-significado`, {
                method: 'PUT',
                body: { transactionIndex, significado },
            })

            // Update local state
            const extractIndex = extracts.value.findIndex(e => e.id === extractId)
            if (extractIndex !== -1 && extracts.value[extractIndex]?.data?.transacoes?.[transactionIndex]) {
                if (significado.trim() === '') {
                    delete extracts.value[extractIndex].data.transacoes[transactionIndex].significado
                }
                else {
                    extracts.value[extractIndex].data.transacoes[transactionIndex].significado = significado
                }
            }

            return true
        }
        catch (error) {
            console.error('Error updating transaction significado:', error)
            throw error
        }
    }

    const addClassification = async (text: string, emoji: string) => {
        try {
            const newClassification = await $fetch<Classification>('/api/classifications', {
                method: 'POST',
                body: { text, emoji },
            })

            // Update local state
            const existingIndex = classifications.value.findIndex(c => c.id === newClassification.id)
            if (existingIndex === -1) {
                classifications.value.push(newClassification)
            }

            return newClassification
        }
        catch (error) {
            console.error('Error adding classification:', error)
            throw error
        }
    }

    const updateTransactionClassification = async (extractId: string, transactionIndex: number, classificationId: string) => {
        try {
            await $fetch(`/api/extracts/${extractId}/transaction-classification`, {
                method: 'PUT',
                body: { transactionIndex, classificationId },
            })

            // Update local state
            const extractIndex = extracts.value.findIndex(e => e.id === extractId)
            if (extractIndex !== -1 && extracts.value[extractIndex]?.data?.transacoes?.[transactionIndex]) {
                extracts.value[extractIndex].data.transacoes[transactionIndex].classificationId = classificationId
            }

            return true
        }
        catch (error) {
            console.error('Error updating transaction classification:', error)
            throw error
        }
    }

    const skipTransaction = async (extractId: string, transactionIndex: number, skipReason: string) => {
        try {
            await $fetch(`/api/extracts/${extractId}/transaction-skip`, {
                method: 'PUT',
                body: { transactionIndex, skipReason },
            })

            // Update local state
            const extractIndex = extracts.value.findIndex(e => e.id === extractId)
            if (extractIndex !== -1 && extracts.value[extractIndex]?.data?.transacoes?.[transactionIndex]) {
                extracts.value[extractIndex].data.transacoes[transactionIndex].skipped = true
                extracts.value[extractIndex].data.transacoes[transactionIndex].skipReason = skipReason
                // Clear classification and significado when skipping
                delete extracts.value[extractIndex].data.transacoes[transactionIndex].classificationId
                delete extracts.value[extractIndex].data.transacoes[transactionIndex].significado
            }

            return true
        }
        catch (error) {
            console.error('Error skipping transaction:', error)
            throw error
        }
    }

    return {
        banks: readonly(banks),
        extracts: readonly(extracts),
        people: readonly(people),
        cards: readonly(cards),
        classifications: readonly(classifications),
        settings: readonly(settings),
        addBank,
        removeBank,
        addExtract,
        addPerson,
        updatePerson,
        removePerson,
        addCard,
        updateCard,
        removeCard,
        getPrincipalPerson,
        setPrimaryPerson,
        updateTransactionSignificado,
        addClassification,
        updateTransactionClassification,
        skipTransaction,
        getExtractsByMonth,
        getExtractsByBank,
        getTransactionsByMonth,
        getAllAvailableMonths,
        loadData, // Expose loadData for manual refresh
        ensureDataLoaded, // Expose ensureDataLoaded
        getBanks, // Expose getBanks
    }
}
