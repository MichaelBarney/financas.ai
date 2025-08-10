import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { Bank } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { name } = body

        if (!name || typeof name !== 'string') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bank name is required',
            })
        }

        const banksPath = join(process.cwd(), 'storage', 'banks.json')

        // Read existing banks
        let banks: Bank[] = []
        try {
            const data = await fs.readFile(banksPath, 'utf-8')
            banks = JSON.parse(data)
        }
        catch {
            // File doesn't exist, start with empty array
            banks = []
        }

        // Check if bank already exists
        const existingBank = banks.find(bank =>
            bank.name.toLowerCase() === name.toLowerCase(),
        )

        if (existingBank) {
            return existingBank
        }

        // Create new bank
        const newBank: Bank = {
            id: crypto.randomUUID(),
            name,
            createdAt: new Date(),
        }

        banks.push(newBank)

        // Save banks
        await fs.writeFile(banksPath, JSON.stringify(banks, null, 2))

        return newBank
    }
    catch (error) {
        console.error('Error creating bank:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create bank',
        })
    }
})
