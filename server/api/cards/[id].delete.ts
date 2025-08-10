import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Card } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const cardId = getRouterParam(event, 'id')

        if (!cardId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Card ID is required',
            })
        }

        const filePath = path.join(process.cwd(), 'storage', 'cards.json')

        // Read existing cards
        const data = await fs.readFile(filePath, 'utf-8')
        let cards: Card[] = JSON.parse(data)

        // Check if card exists
        const cardExists = cards.some(card => card.id === cardId)
        if (!cardExists) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Card not found',
            })
        }

        // Remove card
        cards = cards.filter(card => card.id !== cardId)
        await fs.writeFile(filePath, JSON.stringify(cards, null, 2))

        return { success: true }
    }
    catch (error) {
        console.error('Error deleting card:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete card',
        })
    }
})
