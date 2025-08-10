import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Person, Card } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const personId = getRouterParam(event, 'id')

        if (!personId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Person ID is required',
            })
        }

        const peopleFilePath = path.join(process.cwd(), 'storage', 'people.json')
        const cardsFilePath = path.join(process.cwd(), 'storage', 'cards.json')
        const settingsFilePath = path.join(process.cwd(), 'storage', 'settings.json')

        // Read existing people
        const peopleData = await fs.readFile(peopleFilePath, 'utf-8')
        let people: Person[] = JSON.parse(peopleData)

        // Check if person exists
        const personExists = people.some(person => person.id === personId)
        if (!personExists) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Person not found',
            })
        }

        // Check if person has cards
        let cards: Card[] = []
        try {
            const cardsData = await fs.readFile(cardsFilePath, 'utf-8')
            cards = JSON.parse(cardsData)
        }
        catch (error) {
            // Cards file doesn't exist yet
        }

        const personCards = cards.filter(card => card.holderId === personId)
        if (personCards.length > 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Cannot delete person with associated cards',
            })
        }

        // Remove person
        people = people.filter(person => person.id !== personId)
        await fs.writeFile(peopleFilePath, JSON.stringify(people, null, 2))

        // If this was the primary person, clear the setting
        try {
            const settingsData = await fs.readFile(settingsFilePath, 'utf-8')
            const settings = JSON.parse(settingsData)
            if (settings.primaryPersonId === personId) {
                settings.primaryPersonId = null
                await fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2))
            }
        }
        catch (error) {
            // Settings file doesn't exist, no action needed
        }

        return { success: true }
    }
    catch (error) {
        console.error('Error deleting person:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete person',
        })
    }
})
