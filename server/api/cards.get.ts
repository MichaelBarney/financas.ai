import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Card } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const filePath = path.join(process.cwd(), 'storage', 'cards.json')
        const data = await fs.readFile(filePath, 'utf-8')
        const cards: Card[] = JSON.parse(data)

        // Ensure dates are properly formatted
        return cards.map(card => ({
            ...card,
            createdAt: new Date(card.createdAt),
            updatedAt: new Date(card.updatedAt),
        }))
    }
    catch (error) {
        console.error('Error reading cards:', error)
        return []
    }
})
