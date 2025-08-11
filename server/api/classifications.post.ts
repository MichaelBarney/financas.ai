import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { text, emoji } = body

        if (!text || !emoji) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Text and emoji are required',
            })
        }

        const classificationsPath = join(process.cwd(), 'storage', 'classifications.json')
        const classificationsData = readFileSync(classificationsPath, 'utf-8')
        const classifications = JSON.parse(classificationsData)

        const newClassification = {
            id: Date.now().toString(),
            text,
            emoji,
            createdAt: new Date().toISOString(),
        }

        classifications.push(newClassification)

        writeFileSync(classificationsPath, JSON.stringify(classifications, null, 2))

        return newClassification
    }
    catch (error) {
        console.error('Error creating classification:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create classification',
        })
    }
})
