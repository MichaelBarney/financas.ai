import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { Bank, SavedExtract } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { banks: oldBanks = [], extracts: oldExtracts = [] } = body

        const results = {
            banksCreated: 0,
            extractsCreated: 0,
            errors: [] as string[],
        }

        // Migrate banks
        if (oldBanks.length > 0) {
            const banksPath = join(process.cwd(), 'storage', 'banks.json')

            try {
                // Read existing banks to avoid duplicates
                let existingBanks: Bank[] = []
                try {
                    const data = await fs.readFile(banksPath, 'utf-8')
                    existingBanks = JSON.parse(data)
                }
                catch {
                    // File doesn't exist, start fresh
                }

                // Add new banks (avoid duplicates by name)
                const updatedBanks = [...existingBanks]
                for (const bank of oldBanks) {
                    const exists = existingBanks.find(b =>
                        b.name.toLowerCase() === bank.name.toLowerCase(),
                    )
                    if (!exists) {
                        updatedBanks.push({
                            ...bank,
                            createdAt: new Date(bank.createdAt),
                        })
                        results.banksCreated++
                    }
                }

                await fs.writeFile(banksPath, JSON.stringify(updatedBanks, null, 2))
            }
            catch (error) {
                results.errors.push(`Failed to migrate banks: ${error.message}`)
            }
        }

        // Migrate extracts
        if (oldExtracts.length > 0) {
            const transactionsDir = join(process.cwd(), 'storage', 'transactions')
            await fs.mkdir(transactionsDir, { recursive: true })

            for (const extract of oldExtracts) {
                try {
                    const { year, month, bankId } = extract
                    const monthDir = join(transactionsDir, year.toString(), month.toString(), bankId)
                    await fs.mkdir(monthDir, { recursive: true })

                    // Generate filename
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
                    const filename = `migrated-extract-${timestamp}.json`
                    const filePath = join(monthDir, filename)

                    // Save extract
                    const extractToSave = {
                        ...extract,
                        uploadedAt: new Date(extract.uploadedAt),
                    }

                    await fs.writeFile(filePath, JSON.stringify(extractToSave, null, 2))
                    results.extractsCreated++
                }
                catch (error) {
                    results.errors.push(`Failed to migrate extract ${extract.id}: ${error.message}`)
                }
            }
        }

        return results
    }
    catch (error) {
        console.error('Migration error:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Migration failed',
        })
    }
})
