import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
    try {
        const rulesPath = resolve(process.cwd(), 'storage/rules.json')

        if (!existsSync(rulesPath)) {
            // Return empty rules if file doesn't exist
            return { rules: [] }
        }

        const rulesData = readFileSync(rulesPath, 'utf-8')
        const rules = JSON.parse(rulesData)

        return rules
    }
    catch (error) {
        console.error('Error reading rules file:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to read rules',
        })
    }
})
