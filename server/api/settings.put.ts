import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Person } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const { primaryPersonId } = await readBody(event)

        // If setting a primary person, verify they exist
        if (primaryPersonId) {
            const peopleFilePath = path.join(process.cwd(), 'storage', 'people.json')
            try {
                const peopleData = await fs.readFile(peopleFilePath, 'utf-8')
                const people: Person[] = JSON.parse(peopleData)
                const personExists = people.some(person => person.id === primaryPersonId)

                if (!personExists) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'Person not found',
                    })
                }
            }
            catch (error) {
                if (error.statusCode)
                    throw error
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Person not found',
                })
            }
        }

        const filePath = path.join(process.cwd(), 'storage', 'settings.json')

        // Read existing settings
        let settings = { primaryPersonId: null }
        try {
            const data = await fs.readFile(filePath, 'utf-8')
            settings = JSON.parse(data)
        }
        catch (error) {
            // File doesn't exist yet, use defaults
        }

        // Update settings
        settings.primaryPersonId = primaryPersonId

        // Save to file
        await fs.writeFile(filePath, JSON.stringify(settings, null, 2))

        return settings
    }
    catch (error) {
        console.error('Error updating settings:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update settings',
        })
    }
})
