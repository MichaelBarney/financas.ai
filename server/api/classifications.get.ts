import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
    try {
        const classificationsPath = join(process.cwd(), 'storage', 'classifications.json')
        const classificationsData = readFileSync(classificationsPath, 'utf-8')
        const classifications = JSON.parse(classificationsData)

        return classifications
    }
    catch (error) {
        console.error('Error reading classifications:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to read classifications',
        })
    }
})
