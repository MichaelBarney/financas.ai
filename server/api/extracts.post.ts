import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { SavedExtract, ExtractResult } from '~/types'
import { checkForDuplicateExtract } from '~/server/utils/deduplication'

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

        // Check for duplicate extract before processing
        const isDuplicate = await checkForDuplicateExtract(bankId, extractData)

        if (isDuplicate) {
            console.warn('[INFO] Duplicate extract detected, skipping save')
            throw createError({
                statusCode: 409,
                statusMessage: 'This extract has already been processed and saved',
            })
        }

        // Create directory structure: storage/extractions/bankId/
        const extractionsDir = join(process.cwd(), 'storage', 'extractions')
        const bankDir = join(extractionsDir, bankId)
        await fs.mkdir(bankDir, { recursive: true })

        // Create extract object with all transactions
        const extract: SavedExtract = {
            id: crypto.randomUUID(),
            bankId,
            data: extractData,
            uploadedAt: new Date(),
        }

        // Generate filename with timestamp to avoid conflicts
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `extract-${timestamp}.json`
        const filePath = join(bankDir, filename)

        // Save extract to file
        await fs.writeFile(filePath, JSON.stringify(extract, null, 2))

        return [extract]
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
