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

        // Read all extraction files directly from extractions directory
        const files = await fs.readdir(extractionsDir)

        for (const file of files) {
            if (!file.endsWith('.json'))
                continue

            const filePath = join(extractionsDir, file)
            const stat = await fs.stat(filePath)

            if (!stat.isFile())
                continue

            const fileData = await fs.readFile(filePath, 'utf-8')
            const extract: SavedExtract = JSON.parse(fileData)

            // For old timestamp-based filenames, ensure the ID matches the filename
            // This handles the transition from old to new naming convention
            if (file.startsWith('extract-') && file !== `${extract.id}.json`) {
                // Update the filename to match the extract ID
                const newFilePath = join(extractionsDir, `${extract.id}.json`)
                try {
                    await fs.rename(filePath, newFilePath)
                    console.log(`[INFO] Renamed extract file from ${file} to ${extract.id}.json`)
                }
                catch (renameError) {
                    console.warn(`[WARN] Failed to rename extract file ${file}:`, renameError)
                }
            }

            // Filter by bankId if specified
            if (bankId && extract.bankId !== bankId)
                continue

            // Convert date strings back to Date objects
            extract.uploadedAt = new Date(extract.uploadedAt)

            extracts.push(extract)
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
