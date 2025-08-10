import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { SavedExtract } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const { bankId, year, month } = query

        const transactionsDir = join(process.cwd(), 'storage', 'transactions')
        const extracts: SavedExtract[] = []

        // Check if transactions directory exists
        try {
            await fs.access(transactionsDir)
        }
        catch {
            return []
        }

        // Read all year/month directories
        const years = await fs.readdir(transactionsDir)

        for (const yearDir of years) {
            const yearPath = join(transactionsDir, yearDir)
            const stat = await fs.stat(yearPath)

            if (!stat.isDirectory())
                continue

            // Filter by year if specified
            if (year && yearDir !== year.toString())
                continue

            const months = await fs.readdir(yearPath)

            for (const monthDir of months) {
                const monthPath = join(yearPath, monthDir)
                const monthStat = await fs.stat(monthPath)

                if (!monthStat.isDirectory())
                    continue

                // Filter by month if specified
                if (month && monthDir !== month.toString())
                    continue

                const banks = await fs.readdir(monthPath)

                for (const bankDir of banks) {
                    const bankPath = join(monthPath, bankDir)
                    const bankStat = await fs.stat(bankPath)

                    if (!bankStat.isDirectory())
                        continue

                    // Filter by bankId if specified
                    if (bankId && bankDir !== bankId)
                        continue

                    const files = await fs.readdir(bankPath)

                    for (const file of files) {
                        if (!file.endsWith('.json'))
                            continue

                        const filePath = join(bankPath, file)
                        const fileData = await fs.readFile(filePath, 'utf-8')
                        const extract: SavedExtract = JSON.parse(fileData)

                        // Convert date strings back to Date objects
                        extract.uploadedAt = new Date(extract.uploadedAt)

                        extracts.push(extract)
                    }
                }
            }
        }

        return extracts
    }
    catch (error) {
        console.error('Error reading extracts:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to read extracts',
        })
    }
})
