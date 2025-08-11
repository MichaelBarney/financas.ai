import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { rules } = body

        if (!Array.isArray(rules)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Rules must be an array',
            })
        }

        const storageDir = resolve(process.cwd(), 'storage')
        const memoryPath = resolve(storageDir, 'memory.json')

        // Create storage directory if it doesn't exist
        if (!existsSync(storageDir)) {
            mkdirSync(storageDir, { recursive: true })
        }

        // Write memory rules to file
        const memoryData = JSON.stringify({ rules }, null, 2)
        writeFileSync(memoryPath, memoryData, 'utf-8')

        return { success: true }
    }
    catch (error) {
        console.error('Error saving memory rules:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to save memory rules',
        })
    }
})
