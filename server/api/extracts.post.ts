import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { SavedExtract, ExtractResult } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { bankId, extractData } = body as { bankId: string, extractData: ExtractResult }

        if (!bankId || !extractData) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bank ID and extract data are required',
            })
        }

        const transactions = extractData.transacoes || []
        const savedExtracts: SavedExtract[] = []
        const transactionsDir = join(process.cwd(), 'storage', 'transactions')

        // Ensure base transactions directory exists
        await fs.mkdir(transactionsDir, { recursive: true })

        // Group transactions by month
        const monthlyTransactions = new Map<string, any[]>()

        transactions.forEach((transaction) => {
            const [_day, month, year] = transaction.data.split('/')
            // Handle both 2-digit and 4-digit years
            const yearNum = year.length === 2 ? Number.parseInt(`20${year}`) : Number.parseInt(year)
            const monthNum = Number.parseInt(month)
            const key = `${yearNum}-${monthNum}`

            if (!monthlyTransactions.has(key)) {
                monthlyTransactions.set(key, [])
            }

            monthlyTransactions.get(key)!.push(transaction)
        })

        // Save each month's transactions separately
        for (const [monthKey, monthTransactions] of monthlyTransactions) {
            const [year, month] = monthKey.split('-')
            const yearNum = Number.parseInt(year)
            const monthNum = Number.parseInt(month)

            // Create directory structure: storage/transactions/2025/7/bankId/
            const monthDir = join(transactionsDir, year, month, bankId)
            await fs.mkdir(monthDir, { recursive: true })

            // Create extract object
            const extract: SavedExtract = {
                id: crypto.randomUUID(),
                bankId,
                year: yearNum,
                month: monthNum,
                data: {
                    ...extractData,
                    transacoes: monthTransactions,
                },
                uploadedAt: new Date(),
            }

            // Generate filename with timestamp to avoid conflicts
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const filename = `extract-${timestamp}.json`
            const filePath = join(monthDir, filename)

            // Save extract to file
            await fs.writeFile(filePath, JSON.stringify(extract, null, 2))

            savedExtracts.push(extract)
        }

        return savedExtracts
    }
    catch (error: any) {
        console.error('Error saving extract:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to save extract',
        })
    }
})
