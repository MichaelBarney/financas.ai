import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { Bank } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const bankId = getRouterParam(event, 'id')

        if (!bankId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bank ID is required',
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
            throw createError({
                statusCode: 404,
                statusMessage: 'Banks file not found',
            })
        }

        // Find and remove bank
        const bankIndex = banks.findIndex(bank => bank.id === bankId)

        if (bankIndex === -1) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Bank not found',
            })
        }

        banks.splice(bankIndex, 1)

        // Save banks
        await fs.writeFile(banksPath, JSON.stringify(banks, null, 2))

        return { success: true }
    }
    catch (error) {
        console.error('Error deleting bank:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete bank',
        })
    }
})
