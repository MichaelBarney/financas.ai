import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { SavedExtract } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const { id } = event.context.params
        const body = await readBody(event)
        const { transactionIndex, classificationId } = body

        if (typeof transactionIndex !== 'number' || typeof classificationId !== 'string') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid request body. Expected transactionIndex (number) and classificationId (string)',
            })
        }

        const extractionsDir = join(process.cwd(), 'storage', 'extractions')
        const extractPath = join(extractionsDir, `${id}.json`)

        console.log(`[DEBUG] Looking for extract file: ${extractPath}`)

        // Check if extract file exists
        try {
            await fs.access(extractPath)
            console.log(`[DEBUG] Extract file found: ${extractPath}`)
        }
        catch {
            // List available files for debugging
            try {
                const files = await fs.readdir(extractionsDir)
                console.log(`[DEBUG] Available extract files:`, files)
            }
            catch (listError) {
                console.log(`[DEBUG] Could not list extract directory:`, listError)
            }

            throw createError({
                statusCode: 404,
                statusMessage: `Extract not found: ${id}`,
            })
        }

        // Read the extract file
        const fileData = await fs.readFile(extractPath, 'utf-8')
        const extract: SavedExtract = JSON.parse(fileData)

        // Validate transaction index
        if (transactionIndex < 0 || transactionIndex >= extract.data.transacoes.length) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid transaction index',
            })
        }

        // Update the classificationId field
        extract.data.transacoes[transactionIndex].classificationId = classificationId

        // Write the updated extract back to file
        await fs.writeFile(extractPath, JSON.stringify(extract, null, 2), 'utf-8')

        return { success: true, message: 'Classification updated successfully' }
    }
    catch (error) {
        console.error('Error updating transaction classification:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update transaction classification',
        })
    }
})
