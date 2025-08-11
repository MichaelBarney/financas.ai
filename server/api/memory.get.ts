import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
    try {
        const memoryPath = resolve(process.cwd(), 'storage/memory.json')

        if (!existsSync(memoryPath)) {
            // Return empty rules if file doesn't exist
            return { rules: [] }
        }

        const memoryData = readFileSync(memoryPath, 'utf-8')
        const memory = JSON.parse(memoryData)

        return memory
    }
    catch (error) {
        console.error('Error reading memory file:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to read memory rules',
        })
    }
})
