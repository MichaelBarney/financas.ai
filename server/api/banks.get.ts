import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { Bank } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const banksPath = join(process.cwd(), 'storage', 'banks.json')

        // Check if file exists
        try {
            await fs.access(banksPath)
        }
        catch {
            // File doesn't exist, return empty array
            return []
        }

        const data = await fs.readFile(banksPath, 'utf-8')
        const banks: Bank[] = JSON.parse(data)

        // Convert date strings back to Date objects
        return banks.map(bank => ({
            ...bank,
            createdAt: new Date(bank.createdAt),
        }))
    }
    catch (error) {
        console.error('Error reading banks:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to read banks',
        })
    }
})
