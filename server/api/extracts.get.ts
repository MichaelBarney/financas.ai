import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { SavedExtract } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const { bankId } = query

        const extractionsDir = join(process.cwd(), 'storage', 'extractions')
        const extracts: SavedExtract[] = []

        // Check if extractions directory exists
        try {
            await fs.access(extractionsDir)
        }
        catch {
            return []
        }

        // Read all bank directories
        const banks = await fs.readdir(extractionsDir)

        for (const bankDir of banks) {
            const bankPath = join(extractionsDir, bankDir)
            const stat = await fs.stat(bankPath)

            if (!stat.isDirectory())
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
